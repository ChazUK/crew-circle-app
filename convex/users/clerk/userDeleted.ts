import { v } from "convex/values";

import { internalMutation } from "../../_generated/server";
import { userByExternalId } from "../_helpers";

export const userDeleted = internalMutation({
  args: { externalAuthId: v.string() },
  handler: async (ctx, { externalAuthId }) => {
    const user = await userByExternalId(ctx, externalAuthId);
    if (!user) return;
    await ctx.db.delete(user._id);
  },
});
