import type { IncomingEvent, SyncWindow } from "@shared/calendars";
import * as Calendar from "expo-calendar";

export async function fetchNativeEvents(
  calendarIds: string[],
  window: SyncWindow,
): Promise<IncomingEvent[]> {
  const events = await Calendar.getEventsAsync(
    calendarIds,
    new Date(window.windowStartMs),
    new Date(window.windowEndMs),
  );

  console.log(
    `[fetchNativeEvents] device returned ${events.length} event(s) from ${calendarIds.length} calendar(s)`,
    events.map((e) => ({
      id: e.id,
      calendarId: e.calendarId,
      title: e.title,
      availability: e.availability,
      allDay: e.allDay,
      startDate: e.startDate,
    })),
  );

  return events
    .filter((event) => {
      const avail = event.availability as string;
      return avail !== "free" && avail !== "notBusy";
    })
    .map((event) => ({
      externalId: event.id,
      subCalendarId: event.calendarId,
      title: event.title,
      description: event.notes || undefined,
      location: event.location ?? undefined,
      startsAt: new Date(event.startDate).getTime(),
      endsAt: new Date(event.endDate).getTime(),
      isAllDay: event.allDay,
      originalTimezone: event.timeZone || undefined,
    }));
}
