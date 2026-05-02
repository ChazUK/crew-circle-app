import { v } from "convex/values";

import { Doc } from "../_generated/dataModel";
import { internalQuery } from "../_generated/server";

export const getConnectionForOwner = internalQuery({
  args: { connectionId: v.id("calendarConnections"), userId: v.id("users") },
  handler: async (ctx, args): Promise<Doc<"calendarConnections"> | null> => {
    const doc = await ctx.db.get(args.connectionId);
    if (!doc) return null;
    if (doc.userId !== args.userId) return null;
    return doc;
  },
});

export const getConnectionInternal = internalQuery({
  args: { connectionId: v.id("calendarConnections") },
  handler: async (ctx, args): Promise<Doc<"calendarConnections"> | null> => {
    return ctx.db.get(args.connectionId);
  },
});

export const getConnectionColoursForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<string[]> => {
    const connections = await ctx.db
      .query("calendarConnections")
      .withIndex("byUser", (q) => q.eq("userId", args.userId))
      .collect();
    return connections.map((connection) => connection.color);
  },
});
