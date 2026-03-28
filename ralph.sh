#!/usr/bin/env bash
# ralph.sh — Autonomous multi-agent GitHub issue solver for crew-circle-app
#
# Spawns N Claude Code agents in parallel. Each agent:
#   1. Claims the oldest open, unblocked GitHub issue
#   2. Implements it in a git worktree (TDD, lint, type-check)
#   3. Creates a pull request and moves on to the next issue
#
# PRs are reviewed by HITL. Re-run ralph.sh after merging
# to pick up newly available issues. GitHub auto-closes issues via
# "Closes #N" in the PR body.
#
# Pattern: https://www.aihero.dev/tips-for-ai-coding-with-ralph-wiggum
#
# Prerequisites:
#   gh        — GitHub CLI (run: gh auth login)
#   claude    — Claude Code CLI (run: npm install -g @anthropic-ai/claude-code)
#   git, jq
#   ANTHROPIC_API_KEY — must be set in ~/.zshrc or ~/.bashrc (NOT inline/current session),
#                       then restart Docker Desktop so the sandbox daemon picks it up
#
# Usage:
#   ./ralph.sh                         # 3 agents, local mode
#   RALPH_AGENTS=5 ./ralph.sh          # 5 parallel agents
#   RALPH_SANDBOX=1 ./ralph.sh         # Isolate each agent in a Docker sandbox microVM (recommended for AFK)
#   RALPH_PRD_NUMBER=42 ./ralph.sh     # Point agents at a PRD issue for context
#   RALPH_MAX_ITER=10 ./ralph.sh       # Cap at 10 issues per agent then stop

set -euo pipefail

# ─────────────────────────────────────────────────────────────
# Config — all overridable via env vars
# ─────────────────────────────────────────────────────────────
REPO="${RALPH_REPO:-ChazUK/crew-circle-app}"
NUM_AGENTS="${RALPH_AGENTS:-5}"
MAX_ITER="${RALPH_MAX_ITER:-20}"       # Max issues per agent before it self-terminates
SANDBOX="${RALPH_SANDBOX:-0}"          # 1 = wrap each claude invocation in Docker
PRD_NUMBER="${RALPH_PRD_NUMBER:-}"     # GitHub issue # that contains the PRD (optional)

CLAIMED_LABEL="ralph-in-progress"
BLOCKED_LABEL="blocked"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RALPH_DIR="$SCRIPT_DIR/.ralph"
WORKTREES_DIR="$RALPH_DIR/worktrees"
LOG_DIR="$RALPH_DIR/logs"

# ─────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────
_ts() { date '+%H:%M:%S'; }
info()  { printf '\033[36m[ralph %s]\033[0m %s\n' "$(_ts)" "$*" >&2; }
warn()  { printf '\033[33m[ralph %s]\033[0m %s\n' "$(_ts)" "$*" >&2; }
err()   { printf '\033[31m[ralph %s ERROR]\033[0m %s\n' "$(_ts)" "$*" >&2; }
agent_log() {
  local id="$1"; shift
  printf '\033[35m[agent#%s %s]\033[0m %s\n' "$id" "$(_ts)" "$*" >&2
}

# ─────────────────────────────────────────────────────────────
# Cleanup on exit / Ctrl-C
# ─────────────────────────────────────────────────────────────
AGENT_PIDS=()

cleanup() {
  info "Shutting down — releasing any claimed issues..."
  for pid in "${AGENT_PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  # Release any labels left behind
  local claimed
  claimed=$(gh issue list \
    --repo "$REPO" --state open \
    --label "$CLAIMED_LABEL" \
    --json number --jq '.[].number' 2>/dev/null || true)
  for num in $claimed; do
    warn "Releasing claim on issue #$num"
    gh issue edit "$num" --remove-label "$CLAIMED_LABEL" --repo "$REPO" 2>/dev/null || true
  done
  # Prune worktrees
  git -C "$SCRIPT_DIR" worktree prune 2>/dev/null || true
  rm -rf "$WORKTREES_DIR"
}
trap cleanup EXIT INT TERM

# ─────────────────────────────────────────────────────────────
# Prerequisites
# ─────────────────────────────────────────────────────────────
check_deps() {
  local missing=()
  for cmd in gh git jq claude; do
    command -v "$cmd" &>/dev/null || missing+=("$cmd")
  done
  if [[ ${#missing[@]} -gt 0 ]]; then
    err "Missing required tools: ${missing[*]}"
    echo "Install guide:" >&2
    echo "  gh:     https://cli.github.com" >&2
    echo "  claude: npm install -g @anthropic-ai/claude-code" >&2
    echo "  jq:     brew install jq" >&2
    exit 1
  fi

  if ! gh auth status &>/dev/null; then
    err "GitHub CLI not authenticated. Run: gh auth login"
    exit 1
  fi

  if [[ "$SANDBOX" == "1" ]]; then
    if ! command -v docker &>/dev/null; then
      warn "RALPH_SANDBOX=1 but docker not found — falling back to local execution"
      SANDBOX=0
    else
      # In sandbox mode the daemon runs independently of this shell session.
      # ANTHROPIC_API_KEY must be set in ~/.zshrc or ~/.bashrc and Docker Desktop
      # must have been restarted after — setting it inline won't reach the daemon.
      if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
        warn "ANTHROPIC_API_KEY not found in current shell."
        warn "For sandbox mode it must be set in ~/.zshrc or ~/.bashrc with Docker Desktop restarted."
        warn "Continuing — the sandbox daemon may still have it if already configured."
      fi
    fi
  else
    if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
      err "ANTHROPIC_API_KEY is not set."
      exit 1
    fi
  fi
}

# ─────────────────────────────────────────────────────────────
# GitHub helpers
# ─────────────────────────────────────────────────────────────
ensure_labels() {
  gh label create "$CLAIMED_LABEL" \
    --color "fbca04" \
    --description "Claimed by a Ralph agent" \
    --repo "$REPO" 2>/dev/null || true
}

# Returns JSON of the oldest open, unclaimed, unblocked issue — or empty.
find_next_issue() {
  gh issue list \
    --repo "$REPO" \
    --state open \
    --limit 200 \
    --json number,title,body,labels,createdAt \
    --jq "
      [
        .[] |
        select(
          (.labels | map(.name) |
            (contains([\"$CLAIMED_LABEL\"]) or contains([\"$BLOCKED_LABEL\"]))
          ) | not
        )
      ]
      | sort_by(.createdAt)
      | first
      // empty
    " 2>/dev/null || true
}

# Atomically claim an issue by labelling it. Returns 0 if successful.
claim_issue() {
  local number="$1"
  gh issue edit "$number" --add-label "$CLAIMED_LABEL" --repo "$REPO" 2>/dev/null || return 1
  # Re-read to guard against tiny race window between two agents
  local labels
  labels=$(gh issue view "$number" \
    --repo "$REPO" --json labels \
    --jq '.labels[].name' 2>/dev/null || echo "")
  echo "$labels" | grep -q "^${CLAIMED_LABEL}$"
}

release_issue() {
  local number="$1"
  gh issue edit "$number" --remove-label "$CLAIMED_LABEL" --repo "$REPO" 2>/dev/null || true
}

mark_blocked() {
  local number="$1"
  gh issue edit "$number" \
    --add-label "$BLOCKED_LABEL" \
    --remove-label "$CLAIMED_LABEL" \
    --repo "$REPO" 2>/dev/null || true
}


# ─────────────────────────────────────────────────────────────
# Agent prompt
# ─────────────────────────────────────────────────────────────
build_prompt() {
  local issue_number="$1"
  local issue_title="$2"
  local issue_body="$3"
  local branch="$4"

  local prd_section=""
  if [[ -n "$PRD_NUMBER" ]]; then
    prd_section="
## Reference Architecture (PRD)
Fetch and read issue #${PRD_NUMBER} for the full product spec:
\`\`\`bash
gh issue view ${PRD_NUMBER} --repo ${REPO}
\`\`\`
Use it as your authoritative reference for architecture, conventions, and scope."
  fi

  cat <<PROMPT
# Ralph Agent — Implementing Issue #${issue_number}

You are an autonomous Ralph agent. Your sole job this session is to implement the GitHub
issue below, get all checks green, open a pull request, and output a completion signal.

---

## Issue #${issue_number}: ${issue_title}

${issue_body}

---
${prd_section}

## Repository
- **GitHub repo:** ${REPO}
- **Working branch:** \`${branch}\` (already checked out — do NOT switch branches)
- **Stack:** React Native (Expo) + Convex backend, TypeScript strict mode
- **Domain:** UK film/TV production crew short term hiring tool (see \`UBIQUITOUS_LANGUAGE.md\`)

## Available Skills
Use these /skills to list all available skills to help you with specific tasks (invoke with /skill-name):

---

## Instructions

### Step 0 — Progress file
Create \`progress.txt\` in the repo root now (do NOT commit it — add to .gitignore if missing):

\`\`\`
{
  "issue": {
    "number": ${issue_number},
    "title": "${issue_title}"
  },
  "status": "started",
  "steps_completed": [],
  "current_step": "understanding the issue",
  "decisions": [],
  "blockers": []
}
\`\`\`

Update it at the start of every step so a future iteration can resume without re-exploring.

### Step 1 — Understand before implementing
- Re-read the issue carefully
- Read \`UBIQUITOUS_LANGUAGE.md\` for domain terminology
- Explore the relevant files (\`src/\`, \`convex/\`) before touching anything
- Check \`git log --oneline -20\` for recent related changes
Blockers: []
\`\`\`

Update it at the start of every step so a future iteration can resume without re-exploring.

### Step 1 — Understand before implementing
- Re-read the issue carefully
- Read \`UBIQUITOUS_LANGUAGE.md\` for domain terminology
- Explore the relevant files (\`src/\`, \`convex/\`) before touching anything
- Check \`git log --oneline -20\` for recent related changes

### Step 2 — Plan (small steps)
Break the work into the smallest possible independent commits.
One logical change per commit. Smaller steps = higher quality output.

### Step 3 — Implement using TDD (where applicable)
For new functionality:
1. Write a failing test first
2. Make it pass with minimal code
3. Refactor
4. Test for edge cases

Use \`/tdd\` skill if helpful for structuring the loop.

### Step 4 — Feedback loops (MUST all pass before opening a PR)
Run these in order and fix every failure before continuing:
\`\`\`bash
npx tsc --noEmit          # type-checking (zero errors allowed)
npm run lint              # oxlint
npm run fmt:check         # oxfmt formatting
npm run test 2>/dev/null  # run test suites
\`\`\`

Do NOT open a PR if any check fails. Fix the failures first.

### Step 5 — Commit
Commit messages must follow Conventional Commits and reference the issue:
\`\`\`
type(scope): short description

Longer explanation if needed.

Closes #${issue_number}
\`\`\`

Do NOT commit: \`progress.txt\`, \`.env\` files, secrets, debug code, or \`console.log\`.

### Step 6 — Open a pull request
\`\`\`bash
git push origin ${branch}
gh pr create \\
  --repo ${REPO} \\
  --base main \\
  --title "type(scope): #${issue_number} description" \\
  --body "$(cat <<'PRBODY'
## Summary
<!-- What changed and why -->

## Test Plan
<!-- Steps to verify this works -->

## Checklist
- [ ] TypeScript compiles with zero errors
- [ ] Lint passes
- [ ] Formatting passes
- [ ] Tests pass (or no test script exists yet)

Closes #${issue_number}
PRBODY
)"
\`\`\`

### Step 7 — Output your result

If the PR is open and all checks pass:
\`\`\`
<promise>COMPLETE</promise>
\`\`\`

If something blocks you (missing dependency, unclear spec, requires human decision):
1. Post a comment on issue #${issue_number} explaining what is blocking
2. Output:
\`\`\`
<promise>BLOCKED</promise>
\`\`\`

---

## Quality bar (this is production code)
- TypeScript \`strict: true\` — no \`any\`, no ts-ignore without comment
- No debug code (\`console.log\`, TODO, FIXME) left in committed files
- Accessible UI components (labels, a11y props)
- Error handling for all user-facing mutations
- Follow existing code patterns — read before you write

Begin now. Update \`progress.txt\` first, then explore, then implement.
PROMPT
}

# ─────────────────────────────────────────────────────────────
# Run claude (local or Docker sandbox)
# ─────────────────────────────────────────────────────────────
run_claude() {
  local worktree="$1"
  local prompt_file="$2"
  local log_file="$3"

  if [[ "$SANDBOX" == "1" ]]; then
    # Docker sandbox mode: each agent runs in an isolated microVM via `docker sandbox run`.
    # The worktree directory syncs at the same absolute path inside the VM.
    # Each worktree gets its own named sandbox (claude-agent-N); they are fully isolated
    # from each other and from the host outside the workspace.
    # Requires: Docker Desktop 4.58+ (macOS/Windows).
    # IMPORTANT: ANTHROPIC_API_KEY must be in ~/.zshrc or ~/.bashrc and Docker Desktop
    # restarted — the daemon ignores variables set only in the current shell session.
    docker sandbox run claude "$worktree" \
      --dangerously-skip-permissions \
      -p "$(cat "$prompt_file")" \
      2>&1 | tee "$log_file"
  else
    # Local mode: run claude directly in the worktree
    (
      cd "$worktree"
      claude --dangerously-skip-permissions \
        -p "$(cat "$prompt_file")" \
        2>&1 | tee "$log_file"
    )
  fi
}

# ─────────────────────────────────────────────────────────────
# Single agent loop (runs as a background process)
# ─────────────────────────────────────────────────────────────
agent_loop() {
  local agent_id="$1"
  local iter=0

  agent_log "$agent_id" "started (max $MAX_ITER issues)"

  while [[ $iter -lt $MAX_ITER ]]; do
    iter=$((iter + 1))
    agent_log "$agent_id" "iter $iter/$MAX_ITER — scanning for issues..."

    # ── Find next unclaimed issue ──────────────────────────────
    local issue_json
    issue_json=$(find_next_issue)

    if [[ -z "$issue_json" ]]; then
      agent_log "$agent_id" "no unclaimed issues available. Waiting 30s..."
      sleep 30
      # Try one more time then exit rather than spinning forever
      issue_json=$(find_next_issue)
      if [[ -z "$issue_json" ]]; then
        agent_log "$agent_id" "still no issues. Exiting."
        break
      fi
    fi

    local issue_number issue_title issue_body
    issue_number=$(echo "$issue_json" | jq -r '.number')
    issue_title=$(echo "$issue_json"  | jq -r '.title')
    issue_body=$(echo "$issue_json"   | jq -r '.body // "(no description)"')

    # ── Claim the issue ────────────────────────────────────────
    if ! claim_issue "$issue_number"; then
      agent_log "$agent_id" "lost race to claim #$issue_number — retrying..."
      sleep $((RANDOM % 5 + 1))
      continue
    fi
    agent_log "$agent_id" "claimed #$issue_number: $issue_title"

    # ── Set up isolated git worktree ───────────────────────────
    local branch="ralph/issue-${issue_number}"
    local worktree="${WORKTREES_DIR}/agent-${agent_id}"

    # Remove stale worktree if present
    git -C "$SCRIPT_DIR" worktree remove --force "$worktree" 2>/dev/null || true
    rm -rf "$worktree"

    # Fetch latest main and create fresh branch
    git -C "$SCRIPT_DIR" fetch origin main --quiet 2>/dev/null || \
      warn "Could not fetch origin/main — working from local main"

    # Delete stale remote-tracking or local branch if it exists
    git -C "$SCRIPT_DIR" branch -D "$branch" 2>/dev/null || true

    if ! git -C "$SCRIPT_DIR" worktree add -b "$branch" "$worktree" origin/main 2>/dev/null; then
      git -C "$SCRIPT_DIR" worktree add -b "$branch" "$worktree" main
    fi

    # ── Build the prompt ───────────────────────────────────────
    local prompt_file="$RALPH_DIR/prompt-agent${agent_id}-issue${issue_number}.txt"
    build_prompt "$issue_number" "$issue_title" "$issue_body" "$branch" > "$prompt_file"

    local log_file="$LOG_DIR/agent-${agent_id}-issue-${issue_number}.log"
    agent_log "$agent_id" "running claude on #$issue_number... (log: $log_file)"

    # ── Run the agent ──────────────────────────────────────────
    local output=""
    local run_exit=0
    output=$(run_claude "$worktree" "$prompt_file" "$log_file" 2>&1) || run_exit=$?

    if [[ $run_exit -ne 0 ]]; then
      warn "Agent #$agent_id — claude exited with code $run_exit for issue #$issue_number"
    fi

    rm -f "$prompt_file"

    # ── Parse the promise signal ───────────────────────────────
    if echo "$output" | grep -q '<promise>COMPLETE</promise>'; then
      agent_log "$agent_id" "#$issue_number — COMPLETE. PR created, moving on."
      # Leave the ralph-in-progress label on the issue so it won't be re-claimed.
      # GitHub will auto-close the issue when the PR is merged ("Closes #N").
      # To release a stuck claim manually: gh issue edit N --remove-label ralph-in-progress

    elif echo "$output" | grep -q '<promise>BLOCKED</promise>'; then
      agent_log "$agent_id" "#$issue_number — BLOCKED signal received"
      mark_blocked "$issue_number"

    else
      warn "Agent #$agent_id — no promise signal for #$issue_number. Check: $log_file"
      release_issue "$issue_number"
    fi

    # ── Tidy up worktree and sandbox ──────────────────────────
    git -C "$SCRIPT_DIR" worktree remove --force "$worktree" 2>/dev/null || true
    # Sandboxes persist until explicitly removed — clean up to avoid accumulation.
    # The sandbox name mirrors the workspace dirname: claude-agent-N
    if [[ "$SANDBOX" == "1" ]]; then
      docker sandbox rm "claude-agent-${agent_id}" 2>/dev/null || true
    fi

    # Brief pause before grabbing the next issue
    sleep 5
  done

  agent_log "$agent_id" "reached max iterations ($MAX_ITER). Done."
}

# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────
main() {
  info "Ralph — autonomous issue solver"
  info "  repo:      $REPO"
  info "  agents:    $NUM_AGENTS"
  info "  max iter:  $MAX_ITER issues/agent"
  info "  sandbox:   $([ "$SANDBOX" == "1" ] && echo "Docker" || echo "local")"
  [[ -n "$PRD_NUMBER" ]] && info "  PRD issue:  #$PRD_NUMBER"
  echo >&2

  check_deps
  ensure_labels

  mkdir -p "$WORKTREES_DIR" "$LOG_DIR"

  info "Spawning $NUM_AGENTS agents..."

  for i in $(seq 1 "$NUM_AGENTS"); do
    agent_loop "$i" &
    AGENT_PIDS+=($!)
    info "Agent #$i started (pid ${AGENT_PIDS[-1]})"
    # Stagger starts to reduce issue-claiming races
    sleep 3
  done

  info "All agents running. Logs in: $LOG_DIR"
  info "Press Ctrl+C to stop and release all claims."
  echo >&2

  # Wait for all agents to finish
  local exit_code=0
  for pid in "${AGENT_PIDS[@]}"; do
    wait "$pid" || exit_code=$?
  done

  if [[ $exit_code -eq 0 ]]; then
    info "All agents finished successfully."
  else
    warn "Some agents exited with non-zero status. Check logs in $LOG_DIR"
  fi
}

main "$@"
