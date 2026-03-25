import { mutation, QueryCtx } from "./_generated/server";

/**
 * Creates a new user record if one does not already exist for the authenticated identity.
 * The externalAuthId is sourced exclusively from ctx.auth (server-side) and never accepted
 * as a client argument, preventing identity spoofing.
 */
export const upsertUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    console.log(JSON.stringify(identity, null, 2));

    const externalAuthId = identity.subject;

    const existing = await userByExternalId(ctx, externalAuthId);

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      externalAuthId,
      email: identity.email ?? "",
      firstName: identity.givenName,
      lastName: identity.familyName,
      hasCompletedOnboarding: false,
      isPublic: false,
    });
  },
});

/**
 * Returns the current authenticated user's record, or null if not found.
 */
export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) return null;

  return await userByExternalId(ctx, identity.subject);
}

async function userByExternalId(ctx: QueryCtx, externalAuthId: string) {
  return await ctx.db
    .query("users")
    .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", externalAuthId))
    .unique();
}
