import type {
  CalendarConnectContext,
  CalendarConnectParams,
  CalendarConnectResult,
  CalendarProvider,
  CalendarProviderRegistry,
  IncomingEvent,
  SubCalendar,
  SyncWindow,
  WriteError,
  WriteSuccess,
} from "@shared/calendars";
/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, test, vi } from "vitest";

import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";
import { createCalendarService } from "./index";

const modules = import.meta.glob("/convex/**/*.ts");

type FetchEventsFn = NonNullable<CalendarProvider["fetchEvents"]>;

function makeProvider(fetchEvents?: FetchEventsFn): CalendarProvider {
  return {
    capabilities: { serverSidePullable: true, writable: false, hasSubCalendars: true },
    async connect(
      _ctx: unknown,
      _params: CalendarConnectParams,
      _context: CalendarConnectContext,
    ): Promise<CalendarConnectResult> {
      throw new Error("not used by sync");
    },
    fetchEvents,
    async writeEvent(
      _ctx: unknown,
      _connection: unknown,
      _event: IncomingEvent,
    ): Promise<WriteSuccess | WriteError> {
      return { kind: "not_supported", message: "not used" };
    },
    async listSubCalendars(_ctx: unknown, _connection: unknown): Promise<SubCalendar[]> {
      return [];
    },
  };
}

function buildRegistry(
  overrides: Partial<CalendarProviderRegistry> = {},
): CalendarProviderRegistry {
  const stub = makeProvider();
  return {
    google: stub,
    ical: stub,
    microsoft: stub,
    native: stub,
    ...overrides,
  };
}

async function insertUser(t: TestConvex<typeof schema>, externalAuthId: string) {
  return t.run((ctx) =>
    ctx.db.insert("users", {
      externalAuthId,
      email: `${externalAuthId}@example.com`,
      hasCompletedOnboarding: false,
      isPublic: false,
    }),
  );
}

async function insertConnection(
  t: TestConvex<typeof schema>,
  userId: Id<"users">,
  provider: "google" | "ical" | "microsoft" | "native",
  overrides: Partial<{
    lastSyncedAt: number;
    lastSyncError: string;
    syncErrorCount: number;
  }> = {},
) {
  return t.run((ctx) =>
    ctx.db.insert("calendarConnections", {
      userId,
      provider,
      label: `${provider} test`,
      color: "#6366f1",
      createdAt: 0,
      syncErrorCount: 0,
      ...overrides,
    }),
  );
}

async function insertSubCalendar(
  t: TestConvex<typeof schema>,
  connectionId: Id<"calendarConnections">,
  externalId: string,
) {
  return t.run((ctx) =>
    ctx.db.insert("calendarSubCalendars", {
      connectionId,
      externalId,
      label: externalId,
      showAsBusy: true,
    }),
  );
}

function makeEvent(
  externalId: string,
  subCalendarId: string,
  startsAt: number,
  overrides: Partial<IncomingEvent> = {},
): IncomingEvent {
  return {
    externalId,
    subCalendarId,
    title: `Event ${externalId}`,
    startsAt,
    endsAt: startsAt + 60 * 60 * 1000,
    isAllDay: false,
    ...overrides,
  };
}

describe("CalendarService.sync", () => {
  test("writes fetched events into the matching sub-calendar", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "owner");
    const connectionId = await insertConnection(t, userId, "ical");
    await insertSubCalendar(t, connectionId, "default");

    const fetchEvents = vi.fn(async () => [makeEvent("evt-1", "default", Date.now())]);
    const service = createCalendarService(buildRegistry({ ical: makeProvider(fetchEvents) }));

    await t.action(async (ctx) => service.sync(ctx, connectionId));

    const stored = await t.run((ctx) => ctx.db.query("calendarEvents").collect());
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      externalId: "evt-1",
      connectionId,
      userId,
      title: "Event evt-1",
    });
  });

  test("expands recurring events using their rrule", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "owner");
    const connectionId = await insertConnection(t, userId, "ical");
    await insertSubCalendar(t, connectionId, "default");

    const seedStart = Date.now() + 24 * 60 * 60 * 1000;
    const fetchEvents = vi.fn(async () => [
      makeEvent("evt-recur", "default", seedStart, {
        rrule: "FREQ=DAILY;COUNT=3",
      }),
    ]);
    const service = createCalendarService(buildRegistry({ ical: makeProvider(fetchEvents) }));

    await t.action(async (ctx) => service.sync(ctx, connectionId));

    const stored = await t.run((ctx) => ctx.db.query("calendarEvents").collect());
    expect(stored).toHaveLength(3);
    for (const row of stored) {
      expect(row.externalId.startsWith("evt-recur::")).toBe(true);
      expect(row.recurrenceId).toBeTypeOf("number");
    }
  });

  test("drops events for sub-calendars that are not enabled", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "owner");
    const connectionId = await insertConnection(t, userId, "google");
    await insertSubCalendar(t, connectionId, "enabled");
    // "disabled" is intentionally not inserted

    const fetchEvents = vi.fn(async () => [
      makeEvent("evt-keep", "enabled", Date.now()),
      makeEvent("evt-drop", "disabled", Date.now()),
    ]);
    const service = createCalendarService(buildRegistry({ google: makeProvider(fetchEvents) }));

    await t.action(async (ctx) => service.sync(ctx, connectionId));

    const stored = await t.run((ctx) => ctx.db.query("calendarEvents").collect());
    expect(stored.map((e) => e.externalId)).toEqual(["evt-keep"]);
  });

  test("groups events per sub-calendar and writes each group separately", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "owner");
    const connectionId = await insertConnection(t, userId, "google");
    const workSubCal = await insertSubCalendar(t, connectionId, "work");
    const personalSubCal = await insertSubCalendar(t, connectionId, "personal");

    const fetchEvents = vi.fn(async () => [
      makeEvent("evt-w1", "work", Date.now()),
      makeEvent("evt-p1", "personal", Date.now()),
      makeEvent("evt-w2", "work", Date.now()),
    ]);
    const service = createCalendarService(buildRegistry({ google: makeProvider(fetchEvents) }));

    await t.action(async (ctx) => service.sync(ctx, connectionId));

    const stored = await t.run((ctx) => ctx.db.query("calendarEvents").collect());
    const workEvents = stored.filter((e) => e.subCalendarId === workSubCal);
    const personalEvents = stored.filter((e) => e.subCalendarId === personalSubCal);
    expect(workEvents.map((e) => e.externalId).sort()).toEqual(["evt-w1", "evt-w2"]);
    expect(personalEvents.map((e) => e.externalId)).toEqual(["evt-p1"]);
  });

  test("clears lastSyncError and resets syncErrorCount on success", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "owner");
    const connectionId = await insertConnection(t, userId, "ical", {
      syncErrorCount: 5,
      lastSyncError: "previous failure",
    });
    await insertSubCalendar(t, connectionId, "default");

    const fetchEvents = vi.fn(async () => []);
    const service = createCalendarService(buildRegistry({ ical: makeProvider(fetchEvents) }));

    await t.action(async (ctx) => service.sync(ctx, connectionId));

    const updated = await t.run((ctx) => ctx.db.get(connectionId));
    expect(updated?.syncErrorCount).toBe(0);
    expect(updated?.lastSyncError).toBeUndefined();
    expect(updated?.lastSyncedAt).toBeTypeOf("number");
  });

  test("for google connections, tombstones events with status=cancelled", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "owner");
    const connectionId = await insertConnection(t, userId, "google");
    const subCalendarId = await insertSubCalendar(t, connectionId, "primary");

    const start = Date.now();
    await t.run((ctx) =>
      ctx.db.insert("calendarEvents", {
        userId,
        connectionId,
        subCalendarId,
        externalId: "evt-cancelled",
        title: "Going",
        startsAt: start + 365 * 24 * 60 * 60 * 1000, // outside the sync window
        endsAt: start + 365 * 24 * 60 * 60 * 1000 + 1000,
        isAllDay: false,
        updatedAt: 0,
      }),
    );

    const fetchEvents = vi.fn(async () => [
      makeEvent("evt-cancelled", "primary", start, { status: "cancelled" }),
    ]);
    const service = createCalendarService(buildRegistry({ google: makeProvider(fetchEvents) }));

    await t.action(async (ctx) => service.sync(ctx, connectionId));

    const remaining = await t.run((ctx) => ctx.db.query("calendarEvents").collect());
    expect(remaining).toEqual([]);
  });

  test("does not pass deletedExternalIds for non-google providers", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "owner");
    const connectionId = await insertConnection(t, userId, "ical");
    const subCalendarId = await insertSubCalendar(t, connectionId, "default");

    // Pre-seed an event outside the sync window so the prune step won't touch it.
    await t.run((ctx) =>
      ctx.db.insert("calendarEvents", {
        userId,
        connectionId,
        subCalendarId,
        externalId: "evt-cancelled",
        title: "Going",
        startsAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        endsAt: Date.now() + 365 * 24 * 60 * 60 * 1000 + 1000,
        isAllDay: false,
        updatedAt: 0,
      }),
    );

    const fetchEvents = vi.fn(async () => [
      makeEvent("evt-cancelled", "default", Date.now(), { status: "cancelled" }),
    ]);
    const service = createCalendarService(buildRegistry({ ical: makeProvider(fetchEvents) }));

    await t.action(async (ctx) => service.sync(ctx, connectionId));

    const remaining = await t.run((ctx) => ctx.db.query("calendarEvents").collect());
    // The cancelled event was outside the prune window AND no tombstone was sent
    // for an iCal connection — so the row survives.
    expect(remaining.map((r) => r.externalId)).toEqual(["evt-cancelled"]);
  });

  test("throws when the connection does not exist", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "owner");
    const connectionId = await insertConnection(t, userId, "ical");
    await t.run((ctx) => ctx.db.delete(connectionId));
    const service = createCalendarService(buildRegistry());

    await expect(t.action(async (ctx) => service.sync(ctx, connectionId))).rejects.toThrow(
      /not found/i,
    );
  });

  test("throws when called on a native connection", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "owner");
    const connectionId = await insertConnection(t, userId, "native");
    const fetchEvents = vi.fn(async () => []);
    const service = createCalendarService(buildRegistry({ native: makeProvider(fetchEvents) }));

    await expect(t.action(async (ctx) => service.sync(ctx, connectionId))).rejects.toThrow(
      /native/i,
    );
    expect(fetchEvents).not.toHaveBeenCalled();
  });

  test("propagates errors thrown by provider.fetchEvents", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "owner");
    const connectionId = await insertConnection(t, userId, "ical");
    await insertSubCalendar(t, connectionId, "default");

    const fetchEvents = vi.fn(async () => {
      throw new Error("provider unreachable");
    });
    const service = createCalendarService(buildRegistry({ ical: makeProvider(fetchEvents) }));

    await expect(t.action(async (ctx) => service.sync(ctx, connectionId))).rejects.toThrow(
      "provider unreachable",
    );

    const conn = await t.run((ctx) => ctx.db.get(connectionId));
    // sync did not reach the success path — lastSyncedAt stays undefined.
    expect(conn?.lastSyncedAt).toBeUndefined();
    expect(conn?.syncErrorCount).toBe(0);
  });

  test("calls the provider with the resolved connection and current sync window", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "owner");
    const connectionId = await insertConnection(t, userId, "ical");
    await insertSubCalendar(t, connectionId, "default");

    const fetchEvents = vi.fn(async () => []);
    const service = createCalendarService(buildRegistry({ ical: makeProvider(fetchEvents) }));

    await t.action(async (ctx) => service.sync(ctx, connectionId));

    expect(fetchEvents).toHaveBeenCalledTimes(1);
    const call = fetchEvents.mock.calls[0] as unknown as [
      unknown,
      { _id: Id<"calendarConnections"> },
      SyncWindow,
    ];
    expect(call[1]._id).toBe(connectionId);
    expect(call[2].windowStartMs).toBeLessThan(call[2].windowEndMs);
  });
});
