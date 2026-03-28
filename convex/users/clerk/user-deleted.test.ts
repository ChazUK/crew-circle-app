import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { internal } from "../../_generated/api";
import schema from "../../schema";
import { modules } from "../../test-modules";

describe("userDeleted", () => {
  test("removes the user from the database", async () => {
    const t = convexTest(schema, modules);
    const externalAuthId = "clerk_del_1";
    await t.mutation(internal.users.clerk.userCreated, {
      externalAuthId,
      email: "delete@example.com",
    });
    await t.mutation(internal.users.clerk.userDeleted, { externalAuthId });
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", externalAuthId))
        .unique(),
    );
    expect(user).toBeNull();
  });

  test("does nothing when user does not exist", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(internal.users.clerk.userDeleted, { externalAuthId: "nonexistent" }),
    ).resolves.toBeNull();
  });
});
