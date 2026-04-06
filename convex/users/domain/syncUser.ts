import { MutationCtx } from "@convex/_generated/server";

import { getUserByExternalId } from "../db/getUser";
import { upsertUser } from "../db/upsertUser";

export const createUser = (
  ctx: MutationCtx,
  args: {
    externalAuthId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
  },
) => upsertUser(ctx, args);

export const updateUser = async (
  ctx: MutationCtx,
  {
    externalAuthId,
    ...fields
  }: {
    externalAuthId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
  },
) => {
  const user = await getUserByExternalId(ctx, externalAuthId);
  if (!user) return null;

  const updates = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  );
  await ctx.db.patch(user._id, updates);
};

export const deleteUser = async (
  ctx: MutationCtx,
  { externalAuthId }: { externalAuthId: string },
) => {
  const user = await getUserByExternalId(ctx, externalAuthId);
  if (!user) return null;
  await ctx.db.delete(user._id);
};
