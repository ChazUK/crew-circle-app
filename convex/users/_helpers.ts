import { MutationCtx, QueryCtx } from "../_generated/server";

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return userByExternalId(ctx, identity.subject);
}

export async function upsertUserRecord(
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

export async function userByExternalId(ctx: QueryCtx, externalAuthId: string) {
  return ctx.db
    .query("users")
    .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", externalAuthId))
    .unique();
}
