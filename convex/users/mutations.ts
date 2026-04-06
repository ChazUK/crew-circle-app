import { mutation } from "../_generated/server";
import { upsertCurrentUser } from "./domain/upsertCurrentUser";

export const upsertUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) throw new Error("Not authenticated");

    return upsertCurrentUser(ctx, identity);
  },
});
