import type {
  CalendarProvider,
  CalendarProviderCapabilities,
  IncomingEvent,
  SubCalendar,
  SyncWindow,
  WriteError,
  WriteSuccess,
} from "@shared/calendars";

export const nativeCapabilities: CalendarProviderCapabilities = {
  serverSidePullable: false,
  writable: false,
  hasSubCalendars: true,
};

export const NativeCalendarAdapter: CalendarProvider = {
  capabilities: nativeCapabilities,

  async fetchEvents(
    _ctx: unknown,
    _connection: unknown,
    _window: SyncWindow,
  ): Promise<IncomingEvent[]> {
    throw new Error("Native (Apple) calendars are pushed from the device; server cannot pull");
  },

  async writeEvent(
    _ctx: unknown,
    _connection: unknown,
    _event: IncomingEvent,
  ): Promise<WriteSuccess | WriteError> {
    return { kind: "not_supported", message: "Native calendars cannot be written server-side" };
  },

  async listSubCalendars(_ctx: unknown, _connection: unknown): Promise<SubCalendar[]> {
    return [];
  },
};
