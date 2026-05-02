import { v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
import { internalQuery } from "../../_generated/server";

// Returns every Sub-Calendar enabled for a Calendar Connection. Sync
// reads this once at the start of a pass and looks up by externalId in
// memory — cheaper than one runQuery per group, and Sub-Calendar counts
// per connection are small in practice (<20).
export const getSubCalendarsForConnection = internalQuery({
  args: { connectionId: v.id("calendarConnections") },
  handler: async (ctx, args): Promise<Doc<"calendarSubCalendars">[]> => {
    return ctx.db
      .query("calendarSubCalendars")
      .withIndex("byConnection", (q) => q.eq("connectionId", args.connectionId))
      .collect();
  },
});
