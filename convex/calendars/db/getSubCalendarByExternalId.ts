import { v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
import { internalQuery } from "../../_generated/server";

// Resolve a provider's raw sub-calendar id (the string the provider hands
// back on each event) to the Convex Sub-Calendar row. Returns null when
// the sub-calendar is not enabled for the connection — sync uses that
// signal to drop events for unselected calendars.
export const getSubCalendarByExternalId = internalQuery({
  args: {
    connectionId: v.id("calendarConnections"),
    externalId: v.string(),
  },
  handler: async (ctx, args): Promise<Doc<"calendarSubCalendars"> | null> => {
    const rows = await ctx.db
      .query("calendarSubCalendars")
      .withIndex("byConnection", (q) => q.eq("connectionId", args.connectionId))
      .collect();
    return rows.find((row) => row.externalId === args.externalId) ?? null;
  },
});
