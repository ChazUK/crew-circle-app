# ADR-0006: Date and time handling

**Status:** Accepted

## Context

Calendar data touches date and time at every layer — storage, server logic, recurrence expansion, client queries, and display. Without a consistent approach, DST transitions, timezone ambiguity, and library proliferation all become sources of subtle bugs.

The core tension:

- **UTC timestamps** (Unix ms) are unambiguous and arithmetic on them is always correct. They have no DST.
- **Calendar dates** (year/month/day) are timezone-relative. "Today" in Tokyo is a different UTC range than "today" in New York. Operations on calendar dates that ignore timezone produce wrong results on DST transition days.
- **Display** must render UTC timestamps in the user's local timezone — a concern entirely separate from storage and computation.

This ADR defines which tool handles each concern and why.

## Installed packages

| Package                 | Purpose                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `date-fns`              | Display formatting, DST-safe calendar arithmetic on the client                             |
| `rrule-temporal`        | RFC 5545 recurrence rule expansion                                                         |
| `@js-temporal/polyfill` | Temporal API — already installed as a dependency of `rrule-temporal`; free to use directly |

Do not install `date-fns-tz`, `luxon`, `dayjs`, `moment`, or the unmaintained `rrule` package.

## Decision

### 1. Storage — always Unix milliseconds (UTC)

**All timestamps are stored as `v.number()` — a UTC Unix millisecond integer.** This is not a style choice; it is a Convex constraint:

- Convex has no `Date` or datetime column type. `Date` objects cannot be stored — they are rejected at runtime.
- Timestamps stored as strings (`v.string()`) cannot be range-queried efficiently. Convex index range operators (`.gte()`, `.lt()`, etc.) work on numbers, not strings. Storing ISO strings means full table scans for any time-range query.

Every date/time value written to Convex (`startsAt`, `endsAt`, `createdAt`, `updatedAt`, `lastSyncedAt`, `tokenExpiresAt`, etc.) must therefore be a plain `number` — a UTC Unix millisecond value.

Never store:

- `Date` objects — Convex rejects them; always call `.getTime()` first
- ISO strings (e.g. `"2024-03-10T14:00:00Z"`) — parse to UTC ms at the adapter boundary (see §7); storing as strings breaks index range queries
- Local-time strings without a timezone offset (e.g. `"2024-03-10T09:00:00"`) — ambiguous and unqueryable
- Bare date strings (e.g. `"2024-03-10"`) — for all-day events, convert to `parseISO("2024-03-10").getTime()` (midnight UTC)

UTC ms is the single source of truth. All timezone conversion happens at read time, never at write time.

### 2. Duration — plain subtraction

```typescript
const durationMs = event.endsAt - event.startsAt;
```

Both values are UTC epoch ms. UTC has no DST. This is always the exact physical elapsed time. Do not use any library for this — they compute the same number and add noise.

### 3. Comparing and ordering timestamps

Use numeric comparison directly — `startsAt < endsAt`, sorting by numeric value. No library needed. Convex index scans use numeric ordering on these fields automatically.

### 4. Querying timestamps within a range

Always use Convex index range operators — not post-hoc JS filtering — so queries stay efficient at scale:

```typescript
ctx.db
  .query("calendarEvents")
  .withIndex("byUserStartsAt", (q) =>
    q.eq("userId", userId).gte("startsAt", startMs).lt("startsAt", endMs),
  )
  .collect();
```

This works because `startsAt` is a `v.number()`. If it were stored as a string, `.gte()` / `.lt()` would compare lexicographically and give wrong results. The caller is responsible for supplying correct `startMs`/`endMs` bounds (see §5).

### 5. Calendar-day boundaries — client computes, server receives

A "calendar day" is timezone-relative. The server does not know the user's timezone and must never compute day boundaries from a single timestamp input.

**Rule: server-side queries that filter by calendar day accept explicit `startMs: number` and `endMs: number` from the caller.**

On the client, compute both bounds with `date-fns`:

```typescript
import { addDays, startOfDay, parseISO } from "date-fns";

const dayStart = startOfDay(parseISO(selectedDate)); // midnight local time
const startMs = dayStart.getTime();
const endMs = addDays(dayStart, 1).getTime(); // midnight next day, DST-correct
```

Use `addDays` — not `startMs + 86_400_000`. On DST transition days the calendar day is 23 or 25 hours; adding a fixed millisecond count gives wrong results.

### 6. "Start of now" / current time

```typescript
const nowMs = Date.now(); // UTC ms — always correct
```

Never use `new Date()` for storage or comparison. Use `Date.now()` on the server, pass explicit timestamps from the client where needed.

### 7. Parsing date strings from external providers

Provider APIs return dates in various formats. **Always parse to UTC ms at the adapter boundary** — domain logic and the database never see raw date strings.

For datetime strings with a UTC offset (`"2024-03-10T14:00:00Z"`, `"2024-03-10T09:00:00-05:00"`), `parseISO` correctly converts to UTC:

```typescript
import { parseISO } from "date-fns";

const startsAt = parseISO(apiEvent.start.dateTime).getTime(); // UTC ms, offset applied
```

For datetime strings **without** a timezone offset (`"2024-03-10T09:00:00"` — returned by some providers as "local time"), you must attach the user's timezone before parsing, otherwise the system clock timezone is assumed and the result will be wrong for users in other timezones. Use Temporal:

```typescript
import { Temporal } from "@js-temporal/polyfill";

const zdt = Temporal.PlainDateTime.from("2024-03-10T09:00:00").toZonedDateTime(userTimeZone);
const startsAt = Number(zdt.epochMilliseconds); // UTC ms, timezone-correct
```

For all-day events, providers return a bare date string (`"2024-03-10"`). Treat these as midnight UTC:

```typescript
const startsAt = parseISO("2024-03-10").getTime(); // 2024-03-10T00:00:00.000Z
```

### 8. Recurrence expansion

Use `rrule-temporal` for RFC 5545 `RRULE`/`RDATE`/`EXDATE` strings. Never use the `rrule` package (unmaintained).

`rrule-temporal` returns occurrence times as Temporal objects. Convert to UTC ms for storage:

```typescript
const startsAt = Number(occurrence.epochMilliseconds);
```

### 9. Timezone-aware date construction (Temporal)

When you have an IANA timezone identifier and need to construct a precise local instant — e.g. "midnight on March 10 in the user's timezone" — use the Temporal API directly. It is already installed via `@js-temporal/polyfill`:

```typescript
import { Temporal } from "@js-temporal/polyfill";

const tz = Temporal.Now.timeZoneId(); // or pass an explicit IANA string
const zdt = Temporal.PlainDate.from("2024-03-10").toZonedDateTime(tz);
const startMs = Number(zdt.epochMilliseconds);
const endMs = Number(zdt.add({ days: 1 }).epochMilliseconds); // DST-correct
```

Prefer this over `date-fns` when an explicit IANA timezone identifier is available rather than relying on the implicit system clock.

### 10. Display formatting

Convert UTC ms to a local `Date` object and format with `date-fns`. The JS `Date` constructor uses the device's system timezone automatically — no timezone plugin needed.

```typescript
import { format } from "date-fns";

format(new Date(event.startsAt), "h:mm a");          // "9:00 AM"
format(new Date(event.startsAt), "EEE d MMM");       // "Mon 10 Mar"
format(new Date(event.startsAt), "h:mm a – ", { ... }) // time range
```

Do not use `date-fns-tz` or `Temporal` for display — `new Date()` already applies the system timezone correctly on the device.

For all-day events, show a label ("All day") rather than formatting the timestamp — the underlying UTC value is midnight UTC which is meaningless to display as a time.

### 11. Relative time ("2 hours ago", "in 3 days")

Not currently in scope. If needed, use `date-fns/formatDistanceToNow` — consistent with the existing `date-fns` dependency.

## Consequences

- The server never computes timezone-relative bounds. Queries that filter by calendar day always take `startMs` + `endMs`.
- Duration is always `endsAt - startsAt` — no library call.
- `@js-temporal/polyfill` is available for free and is the preferred tool when an explicit IANA timezone is known.
- `date-fns` handles client-side calendar arithmetic and display formatting.
- No additional date libraries are introduced. `date-fns-tz`, `luxon`, `dayjs`, and `moment` are not used.
