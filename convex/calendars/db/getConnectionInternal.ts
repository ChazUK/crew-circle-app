import { v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
import { internalQuery } from "../../_generated/server";

// Fetch a Calendar Connection by id without an ownership check. Reserved
// for trusted internal callers (the cron-driven sync pipeline) where the
// caller is the system, not a user. User-initiated paths must go through
// requireOwnedConnection in convex/calendars/auth/.
export const getConnectionInternal = internalQuery({
  args: { connectionId: v.id("calendarConnections") },
  handler: async (ctx, args): Promise<Doc<"calendarConnections"> | null> => {
    return ctx.db.get(args.connectionId);
  },
});
