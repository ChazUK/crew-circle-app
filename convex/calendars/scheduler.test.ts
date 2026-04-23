import { convexTest, type TestConvex } from "convex-test";
import { afterEach, describe, expect, test, vi } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("/convex/**/*.ts");

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

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

describe("listAllConnections", () => {
  test("returns an empty list when nothing is connected", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(internal.calendars.scheduler.listAllConnections, {});
    expect(result).toEqual([]);
  });

  test("returns every connection across all users", async () => {
    const t = convexTest(schema, modules);
    const alice = await insertUser(t, "alice");
    const bob = await insertUser(t, "bob");
    await t.run(async (ctx) => {
      await ctx.db.insert("calendarConnections", {
        userId: alice,
        provider: "ical",
        label: "A",
        createdAt: Date.now(),
      });
      await ctx.db.insert("calendarConnections", {
        userId: bob,
        provider: "google",
        label: "B",
        createdAt: Date.now(),
      });
    });
    const result = await t.query(internal.calendars.scheduler.listAllConnections, {});
    expect(result.map((c) => c.label).sort()).toEqual(["A", "B"]);
  });
});

describe("syncAllConnections", () => {
  const TEST_KEY = Buffer.alloc(32, 0).toString("base64");

  test("kicks off per-provider syncs for Google and iCal and skips Apple/Outlook", async () => {
    vi.stubEnv("CALENDAR_ENCRYPTION_KEY", TEST_KEY);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("BEGIN:VCALENDAR\r\nEND:VCALENDAR", { status: 200 })),
    );
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "all");

    await t.run(async (ctx) => {
      await ctx.db.insert("calendarConnections", {
        userId,
        provider: "ical",
        label: "Web",
        icalUrl: "https://example.com/feed.ics",
        createdAt: Date.now(),
      });
      await ctx.db.insert("calendarConnections", {
        userId,
        provider: "apple",
        label: "Apple",
        createdAt: Date.now(),
      });
      await ctx.db.insert("calendarConnections", {
        userId,
        provider: "outlook",
        label: "Outlook",
        createdAt: Date.now(),
      });
    });

    await t.action(internal.calendars.scheduler.syncAllConnections, {});
    await new Promise((r) => setTimeout(r, 0));
    await t.finishAllScheduledFunctions(() => {});

    const connections = await t.run((ctx) => ctx.db.query("calendarConnections").collect());
    const byProvider = Object.fromEntries(connections.map((c) => [c.provider, c]));
    // Only the iCal connection got a sync touch.
    expect(byProvider.ical.lastSyncedAt).toBeTruthy();
    expect(byProvider.apple.lastSyncedAt).toBeUndefined();
    expect(byProvider.outlook.lastSyncedAt).toBeUndefined();
  });
});
