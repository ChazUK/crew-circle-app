// @vitest-environment node
import { convexTest, type TestConvex } from "convex-test";
import { afterEach, describe, expect, test, vi } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";
import { encryptJson } from "./domain/crypto";

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

    // Route responses by URL so Google API calls get JSON and iCal fetches
    // get iCalendar text. Without this split, one or the other would fail.
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("googleapis.com")) {
        // Google events.list — one event, already in the enabled sub-calendar.
        return new Response(
          JSON.stringify({
            items: [
              {
                id: "g-1",
                summary: "From Google",
                start: { dateTime: "2026-05-01T09:00:00Z" },
                end: { dateTime: "2026-05-01T10:00:00Z" },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response("BEGIN:VCALENDAR\r\nEND:VCALENDAR", {
        status: 200,
        headers: { "Content-Type": "text/calendar" },
      });
    });
    vi.stubGlobal("fetch", fetchFn);

    const t = convexTest(schema, modules);
    const userId = await insertUser(t, "all");
    const tokens = encryptJson({ accessToken: "a", refreshToken: "r" });

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
        provider: "google",
        label: "Google",
        oauthClientId: "client-id",
        encryptedTokens: tokens,
        tokenExpiresAt: Date.now() + 60 * 60 * 1000,
        enabledSubCalendarIds: ["me@google.test"],
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
    expect(byProvider.ical.lastSyncedAt).toBeTruthy();
    expect(byProvider.google.lastSyncedAt).toBeTruthy();
    expect(byProvider.apple.lastSyncedAt).toBeUndefined();
    expect(byProvider.outlook.lastSyncedAt).toBeUndefined();

    // The Google sync actually pulled the stubbed event into the cache.
    const googleEvents = await t.run((ctx) =>
      ctx.db
        .query("calendarEvents")
        .withIndex("byConnection", (q) => q.eq("connectionId", byProvider.google._id))
        .collect(),
    );
    expect(googleEvents.map((e) => e.externalId)).toEqual(["me@google.test::g-1"]);
  });
});
