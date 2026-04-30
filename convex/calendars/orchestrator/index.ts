import type { AdapterRegistry, SyncWindow } from "@shared/calendars";

import type { Id } from "../../_generated/dataModel";
import type { ActionCtx } from "../../_generated/server";

export function currentSyncWindow(): SyncWindow {
  return {
    windowStartMs: Date.now() - 30 * 24 * 60 * 60 * 1000,
    windowEndMs: Date.now() + 180 * 24 * 60 * 60 * 1000,
  };
}

export function createCalendarOrchestrator(_adapters: AdapterRegistry) {
  return {
    async syncConnection(_ctx: ActionCtx, _connectionId: Id<"calendarConnections">): Promise<void> {
      throw new Error("Not implemented: orchestrator.syncConnection");
    },

    addToCalendar(_event: unknown): Promise<void> {
      throw new Error("Not implemented: orchestrator.addToCalendar");
    },
  };
}
