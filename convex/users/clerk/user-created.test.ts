import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { internal } from "../../_generated/api";
import schema from "../../schema";
import { modules } from "../../test-modules";

describe("userCreated", () => {
  test("creates a new user and returns their id", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.mutation(internal.users.clerk.userCreated, {
      externalAuthId: "clerk_wh_1",
      email: "webhook@example.com",
      firstName: "Jane",
      lastName: "Smith",
    });
    expect(userId).toBeDefined();
  });

  test("returns existing id if called twice with same externalAuthId", async () => {
    const t = convexTest(schema, modules);
    const args = { externalAuthId: "clerk_wh_2", email: "existing@example.com" };
    const first = await t.mutation(internal.users.clerk.userCreated, args);
    const second = await t.mutation(internal.users.clerk.userCreated, args);
    expect(first).toEqual(second);
  });

  test("persists all optional fields", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.users.clerk.userCreated, {
      externalAuthId: "clerk_wh_full",
      email: "full@example.com",
      firstName: "Full",
      lastName: "User",
      profilePictureUrl: "https://example.com/pic.jpg",
    });
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", "clerk_wh_full"))
        .unique(),
    );
    expect(user?.profilePictureUrl).toBe("https://example.com/pic.jpg");
  });
});
