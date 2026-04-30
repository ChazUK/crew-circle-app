import type { AdapterRegistry, SyncWindow } from "@shared/calendars";

import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { ActionCtx } from "../../_generated/server";

export function currentSyncWindow(): SyncWindow {
  return {
    windowStartMs: Date.now() - 30 * 24 * 60 * 60 * 1000,
    windowEndMs: Date.now() + 180 * 24 * 60 * 60 * 1000,
  };
}

export function createCalendarOrchestrator(adapters: AdapterRegistry) {
  return {
    async syncConnection(ctx: ActionCtx, connectionId: Id<"calendarConnections">): Promise<void> {
      const connection = await ctx.runQuery(
        internal.calendars.actionHelpers.getConnectionInternal,
        { connectionId },
      );
      if (!connection) {
        throw new Error("Calendar connection not found");
      }
      const adapter = adapters[connection.provider];
      if (!adapter?.fetchEvents) {
        throw new Error(`Provider "${connection.provider}" does not support server-side sync`);
      }
      const window = currentSyncWindow();
      try {
        const events = await adapter.fetchEvents(ctx, connection, window);
        await ctx.runMutation(internal.calendars.mutations.replaceEvents, {
          connectionId,
          userId: connection.userId,
          events,
        });
        await ctx.runMutation(internal.calendars.mutations.markSynced, {
          connectionId,
          error: undefined,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown sync error";
        await ctx.runMutation(internal.calendars.mutations.markSynced, {
          connectionId,
          error: message,
        });
        throw err;
      }
    },

    addToCalendar(_event: unknown): Promise<void> {
      throw new Error("Not implemented: orchestrator.addToCalendar");
    },
  };
}
