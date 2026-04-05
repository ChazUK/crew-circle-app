import { QueryCtx } from "@convex/_generated/server";

import { userByExternalId } from "./userByExternalId";

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) return null;

  return userByExternalId(ctx, identity.subject);
}
