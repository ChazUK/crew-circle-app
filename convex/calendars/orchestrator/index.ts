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
    async syncNewConnection(
      ctx: ActionCtx,
      connectionId: Id<"calendarConnections">,
      userId: Id<"users">,
    ): Promise<{ syncError: string | null }> {
      const connection = await ctx.runQuery(
        internal.calendars.actionHelpers.getConnectionInternal,
        { connectionId },
      );
      if (!connection) {
        return { syncError: "Calendar connection not found" };
      }
      const adapter = adapters[connection.provider];
      if (!adapter?.fetchEvents) {
        return {
          syncError: `Provider "${connection.provider}" does not support server-side sync`,
        };
      }
      const window = currentSyncWindow();
      let syncError: string | null = null;
      try {
        const events = await adapter.fetchEvents(ctx, connection, window);
        await ctx.runMutation(internal.calendars.mutations.replaceEvents, {
          connectionId,
          userId,
          events,
        });
        await ctx.runMutation(internal.calendars.mutations.markSynced, {
          connectionId,
          error: undefined,
        });
      } catch (err) {
        syncError = err instanceof Error ? err.message : "Unknown sync error";
        await ctx.runMutation(internal.calendars.mutations.markSynced, {
          connectionId,
          error: syncError,
        });
      }
      return { syncError };
    },

    async syncConnection(
      ctx: ActionCtx,
      connectionId: Id<"calendarConnections">,
      userId: Id<"users">,
    ): Promise<void> {
      const { syncError } = await this.syncNewConnection(ctx, connectionId, userId);
      if (syncError) throw new Error(syncError);
    },

    addToCalendar(_event: unknown): Promise<void> {
      throw new Error("Not implemented: orchestrator.addToCalendar");
    },
  };
}
