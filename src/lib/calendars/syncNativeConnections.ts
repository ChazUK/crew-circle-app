import type { Id } from "@convex/_generated/dataModel";
import type { IncomingEvent, SyncWindow } from "@shared/calendars";

import { fetchNativeEvents } from "./fetchNativeEvents";

export type NativeConnectionToSync = {
  connectionId: Id<"calendarConnections">;
  nativeCalendarIds: string[];
};

export type UploadNativeEvents = (
  connectionId: Id<"calendarConnections">,
  events: IncomingEvent[],
) => Promise<void>;

const SYNC_WINDOW_PAST_MS = 30 * 24 * 60 * 60 * 1000;
const SYNC_WINDOW_FUTURE_MS = 180 * 24 * 60 * 60 * 1000;

function currentSyncWindow(): SyncWindow {
  const now = Date.now();
  return {
    windowStartMs: now - SYNC_WINDOW_PAST_MS,
    windowEndMs: now + SYNC_WINDOW_FUTURE_MS,
  };
}

export async function syncNativeConnections(
  connections: NativeConnectionToSync[],
  uploadEvents: UploadNativeEvents,
): Promise<void> {
  const window = currentSyncWindow();
  for (const { connectionId, nativeCalendarIds } of connections) {
    try {
      const events = await fetchNativeEvents(nativeCalendarIds, window);
      await uploadEvents(connectionId, events);
    } catch (err) {
      console.error("[syncNativeConnections] sync failed for connection", connectionId, err);
    }
  }
}
