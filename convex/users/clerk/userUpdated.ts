import { v } from "convex/values";

import { internalMutation } from "../../_generated/server";
import { userByExternalId } from "../_helpers";

export const userUpdated = internalMutation({
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
