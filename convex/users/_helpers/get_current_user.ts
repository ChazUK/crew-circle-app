import { QueryCtx } from "@convex/_generated/server";

import { userByExternalId } from "./user_by_external_id";

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return userByExternalId(ctx, identity.subject);
}
