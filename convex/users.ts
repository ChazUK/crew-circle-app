import { v } from "convex/values";

import { internalMutation, mutation, MutationCtx, QueryCtx } from "./_generated/server";

// ---------------------------------------------------------------------------
// Public mutations
// ---------------------------------------------------------------------------

/**
 * Creates a new user record if one does not already exist for the authenticated
 * identity. The externalAuthId is sourced exclusively from ctx.auth (server-side)
 * and never accepted as a client argument, preventing identity spoofing.
 */
export const upsertUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return upsertUserRecord(ctx, {
      externalAuthId: identity.subject,
      email: identity.email ?? "",
      firstName: identity.givenName,
      lastName: identity.familyName,
    });
  },
});

// ---------------------------------------------------------------------------
// Internal mutations — called exclusively from server-side HTTP actions.
// ---------------------------------------------------------------------------

export const createFromWebhook = internalMutation({
  args: {
    externalAuthId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
  },
  handler: (ctx, args) => upsertUserRecord(ctx, args),
});

export const updateFromWebhook = internalMutation({
  args: {
    externalAuthId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
  },
  handler: async (ctx, { externalAuthId, ...fields }) => {
    const user = await userByExternalId(ctx, externalAuthId);
    if (!user) return;

    const updates = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined),
    );
    await ctx.db.patch(user._id, updates);
  },
});

export const deleteByExternalId = internalMutation({
  args: { externalAuthId: v.string() },
  handler: async (ctx, { externalAuthId }) => {
    const user = await userByExternalId(ctx, externalAuthId);
    if (!user) return;
    await ctx.db.delete(user._id);
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the current authenticated user's record, or null if not found.
 */
export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return userByExternalId(ctx, identity.subject);
}

/**
 * Inserts a new user document, or returns the existing one's id if already present.
 * Centralises the upsert logic shared by upsertUser and createFromWebhook.
 */
async function upsertUserRecord(
  ctx: MutationCtx,
  args: {
    externalAuthId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
  },
) {
  const existing = await userByExternalId(ctx, args.externalAuthId);
  if (existing) return existing._id;

  return ctx.db.insert("users", {
    ...args,
    hasCompletedOnboarding: false,
    isPublic: false,
  });
}

async function userByExternalId(ctx: QueryCtx, externalAuthId: string) {
  return ctx.db
    .query("users")
    .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", externalAuthId))
    .unique();
}
