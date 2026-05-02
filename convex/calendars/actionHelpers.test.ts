import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("/convex/**/*.ts");

async function seed() {
  const t = convexTest(schema, modules);
  const owner = await t.run((ctx) =>
    ctx.db.insert("users", {
      externalAuthId: "owner",
      email: "owner@example.com",
      hasCompletedOnboarding: false,
      isPublic: false,
    }),
  );
  const other = await t.run((ctx) =>
    ctx.db.insert("users", {
      externalAuthId: "other",
      email: "other@example.com",
      hasCompletedOnboarding: false,
      isPublic: false,
    }),
  );
  const connectionId = await t.run((ctx) =>
    ctx.db.insert("calendarConnections", {
      userId: owner,
      provider: "ical",
      label: "Mine",
      createdAt: Date.now(),
      color: "#6366f1",
      syncErrorCount: 0,
    }),
  );
  return { t, owner, other, connectionId };
}

describe("getConnectionForOwner", () => {
  test("returns the doc when the caller owns it", async () => {
    const { t, owner, connectionId } = await seed();
    const result = await t.query(internal.calendars.actionHelpers.getConnectionForOwner, {
      connectionId,
      userId: owner,
    });
    expect(result?.label).toBe("Mine");
  });

  test("returns null when another user asks", async () => {
    const { t, other, connectionId } = await seed();
    const result = await t.query(internal.calendars.actionHelpers.getConnectionForOwner, {
      connectionId,
      userId: other,
    });
    expect(result).toBeNull();
  });

  test("returns null for a connection that has been deleted", async () => {
    const { t, owner, connectionId } = await seed();
    await t.run((ctx) => ctx.db.delete(connectionId));
    const result = await t.query(internal.calendars.actionHelpers.getConnectionForOwner, {
      connectionId,
      userId: owner,
    });
    expect(result).toBeNull();
  });
});

describe("getConnectionInternal", () => {
  test("returns the doc regardless of owner", async () => {
    const { t, connectionId } = await seed();
    const result = await t.query(internal.calendars.actionHelpers.getConnectionInternal, {
      connectionId,
    });
    expect(result?.label).toBe("Mine");
  });

  test("returns null for a connection that has been deleted", async () => {
    const { t, connectionId } = await seed();
    await t.run((ctx) => ctx.db.delete(connectionId));
    const result = await t.query(internal.calendars.actionHelpers.getConnectionInternal, {
      connectionId,
    });
    expect(result).toBeNull();
  });
});

describe("getConnectionColoursForUser", () => {
  test("returns an empty array when the user has no connections", async () => {
    const { t, other } = await seed();
    const result = await t.query(internal.calendars.actionHelpers.getConnectionColoursForUser, {
      userId: other,
    });
    expect(result).toEqual([]);
  });

  test("returns the colour values of every connection owned by the user", async () => {
    const { t, owner } = await seed();
    await t.run((ctx) =>
      ctx.db.insert("calendarConnections", {
        userId: owner,
        provider: "google",
        label: "Work",
        createdAt: Date.now(),
        color: "#10b981",
        syncErrorCount: 0,
      }),
    );
    await t.run((ctx) =>
      ctx.db.insert("calendarConnections", {
        userId: owner,
        provider: "microsoft",
        label: "Outlook",
        createdAt: Date.now(),
        color: "#f59e0b",
        syncErrorCount: 0,
      }),
    );

    const result = await t.query(internal.calendars.actionHelpers.getConnectionColoursForUser, {
      userId: owner,
    });
    expect(result.sort()).toEqual(["#10b981", "#6366f1", "#f59e0b"]);
  });

  test("does not return colours from another user's connections", async () => {
    const { t, owner, other } = await seed();
    await t.run((ctx) =>
      ctx.db.insert("calendarConnections", {
        userId: other,
        provider: "google",
        label: "Theirs",
        createdAt: Date.now(),
        color: "#ec4899",
        syncErrorCount: 0,
      }),
    );

    const result = await t.query(internal.calendars.actionHelpers.getConnectionColoursForUser, {
      userId: owner,
    });
    expect(result).toEqual(["#6366f1"]);
  });
});
