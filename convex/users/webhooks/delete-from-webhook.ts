import { internalMutation } from "@convex/_generated/server";
import { v } from "convex/values";

import { userByExternalId } from "../_helpers";

export const deleteFromWebhook = internalMutation({
  args: { externalAuthId: v.string() },
  handler: async (ctx, { externalAuthId }) => {
    const user = await userByExternalId(ctx, externalAuthId);
    if (!user) return;
    await ctx.db.delete(user._id);
  },
});
