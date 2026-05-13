import { Id } from "@convex/_generated/dataModel";
import { QueryCtx } from "@convex/_generated/server";

export const countUnreadForUser = async (ctx: QueryCtx, userId: Id<"users">) => {
  const unread = await ctx.db
    .query("notifications")
    .withIndex("byUserAndReadAt", (q) => q.eq("userId", userId).eq("readAt", undefined))
    .take(100);
  return unread.length;
};
