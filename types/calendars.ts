export type IncomingEvent = {
  externalId: string;
  subCalendarId?: string;
  uid?: string;
  recurrenceId?: number;
  title: string;
  description?: string;
  location?: string;
  startsAt: number;
  endsAt: number;
  isAllDay: boolean;
};

export type SubCalendar = {
  id: string;
  label: string;
  primary: boolean;
  hint?: string;
};

export type CalendarProviderCapabilities = {
  serverSidePullable: boolean;
  writable: boolean;
  hasSubCalendars: boolean;
};

export type SyncWindow = {
  windowStartMs: number;
  windowEndMs: number;
};

export type SyncError =
  | { kind: "network"; message: string }
  | { kind: "auth"; message: string }
  | { kind: "parse"; message: string }
  | { kind: "unknown"; message: string };

export type WriteError =
  | { kind: "not_supported"; message: string }
  | { kind: "conflict"; message: string }
  | { kind: "insufficient_scope"; message: string }
  | { kind: "unknown"; message: string };

export type WriteSuccess = { externalId: string };

export interface CalendarProvider<TCtx = unknown, TConn = unknown> {
  capabilities: CalendarProviderCapabilities;
  fetchEvents?(ctx: TCtx, connection: TConn, window: SyncWindow): Promise<IncomingEvent[]>;
  writeEvent?(
    ctx: TCtx,
    connection: TConn,
    event: IncomingEvent,
  ): Promise<WriteSuccess | WriteError>;
  listSubCalendars?(ctx: TCtx, connection: TConn): Promise<SubCalendar[]>;
}

export type AdapterRegistry = {
  google: CalendarProvider;
  ical: CalendarProvider;
  microsoft?: CalendarProvider;
};
