import { MutationCtx } from "@convex/_generated/server";

import { userByExternalId } from "./userByExternalId";

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
