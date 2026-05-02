import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";

export const deleteConnection = internalMutation({
  args: { connectionId: v.id("calendarConnections") },
  handler: async (ctx, { connectionId }) => {
    const events = await ctx.db
      .query("calendarEvents")
      .withIndex("byConnection", (q) => q.eq("connectionId", connectionId))
      .collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
    }
    await ctx.db.delete(connectionId);
  },
});

export const insertSubCalendar = internalMutation({
  args: {
    connectionId: v.id("calendarConnections"),
    externalId: v.string(),
    label: v.string(),
    showAsBusy: v.boolean(),
  },
  handler: async (ctx, args): Promise<Id<"calendarSubCalendars">> => {
    return ctx.db.insert("calendarSubCalendars", {
      connectionId: args.connectionId,
      externalId: args.externalId,
      label: args.label,
      showAsBusy: args.showAsBusy,
    });
  },
});
