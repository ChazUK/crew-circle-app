import { MutationCtx } from "@convex/_generated/server";

import { getUserByExternalId } from "./getUser";

export const upsertUser = async (
  ctx: MutationCtx,
  args: {
    externalAuthId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
  },
) => {
  const existing = await getUserByExternalId(ctx, args.externalAuthId);
  if (existing) return existing._id;
  return ctx.db.insert("users", {
    ...args,
    hasCompletedOnboarding: false,
    isPublic: false,
  });
};
