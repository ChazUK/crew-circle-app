/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, test } from "vitest";

import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";

const modules = import.meta.glob("/convex/**/*.ts");

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

async function insertConnection(t: TestConvex<typeof schema>, userId: Id<"users">) {
  return t.run((ctx) =>
    ctx.db.insert("calendarConnections", {
      userId,
      provider: "ical",
      label: "Mine",
      createdAt: Date.now(),
      color: "#6366f1",
      syncErrorCount: 0,
    }),
  );
}

describe("insertSubCalendar", () => {
  test("inserts a sub-calendar row with the provided fields", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "user1");
    const connectionId = await insertConnection(t, userId);

    const subCalendarId = await t.mutation(internal.calendars.mutations.insertSubCalendar, {
      connectionId,
      externalId: "primary",
      label: "Primary calendar",
      showAsBusy: true,
    });

    const row = await t.run((ctx) => ctx.db.get(subCalendarId));
    expect(row).toMatchObject({
      connectionId,
      externalId: "primary",
      label: "Primary calendar",
      showAsBusy: true,
    });
  });

  test("returns the id of the new row", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "user1");
    const connectionId = await insertConnection(t, userId);

    const subCalendarId = await t.mutation(internal.calendars.mutations.insertSubCalendar, {
      connectionId,
      externalId: "primary",
      label: "Primary",
      showAsBusy: false,
    });

    expect(subCalendarId).toBeDefined();
    const row = await t.run((ctx) => ctx.db.get(subCalendarId));
    expect(row?._id).toBe(subCalendarId);
  });

  test("preserves showAsBusy=false when set", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "user1");
    const connectionId = await insertConnection(t, userId);

    const subCalendarId = await t.mutation(internal.calendars.mutations.insertSubCalendar, {
      connectionId,
      externalId: "secondary",
      label: "Secondary",
      showAsBusy: false,
    });

    const row = await t.run((ctx) => ctx.db.get(subCalendarId));
    expect(row?.showAsBusy).toBe(false);
  });

  test("allows multiple sub-calendars per connection", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "user1");
    const connectionId = await insertConnection(t, userId);

    await t.mutation(internal.calendars.mutations.insertSubCalendar, {
      connectionId,
      externalId: "a",
      label: "A",
      showAsBusy: true,
    });
    await t.mutation(internal.calendars.mutations.insertSubCalendar, {
      connectionId,
      externalId: "b",
      label: "B",
      showAsBusy: true,
    });

    const rows = await t.run((ctx) =>
      ctx.db
        .query("calendarSubCalendars")
        .withIndex("byConnection", (q) => q.eq("connectionId", connectionId))
        .collect(),
    );
    expect(rows.map((r) => r.externalId).sort()).toEqual(["a", "b"]);
  });
});
