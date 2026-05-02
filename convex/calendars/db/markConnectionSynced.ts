import { v } from "convex/values";

import { internalMutation } from "../../_generated/server";

// Record a successful sync on the connection: stamp the timestamp, clear
// any previous error, and reset the failure count so a stale badge stops
// showing in the diary UI.
export const markConnectionSynced = internalMutation({
  args: { connectionId: v.id("calendarConnections") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.connectionId, {
      lastSyncedAt: Date.now(),
      lastSyncError: undefined,
      syncErrorCount: 0,
    });
  },
});
