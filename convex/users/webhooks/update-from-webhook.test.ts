import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { internal } from "../../_generated/api";
import schema from "../../schema";
import { modules } from "../../test-modules";

describe("updateFromWebhook", () => {
  test("updates email and firstName", async () => {
    const t = convexTest(schema, modules);
    const externalAuthId = "clerk_upd_1";
    await t.mutation(internal.users.webhooks.createFromWebhook, {
      externalAuthId,
      email: "before@example.com",
    });
    await t.mutation(internal.users.webhooks.updateFromWebhook, {
      externalAuthId,
      email: "after@example.com",
      firstName: "Updated",
    });
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", externalAuthId))
        .unique(),
    );
    expect(user?.email).toBe("after@example.com");
    expect(user?.firstName).toBe("Updated");
  });

  test("does not overwrite fields when value is undefined", async () => {
    const t = convexTest(schema, modules);
    const externalAuthId = "clerk_upd_2";
    await t.mutation(internal.users.webhooks.createFromWebhook, {
      externalAuthId,
      email: "keep@example.com",
      firstName: "KeepMe",
    });
    await t.mutation(internal.users.webhooks.updateFromWebhook, {
      externalAuthId,
      email: "changed@example.com",
    });
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", externalAuthId))
        .unique(),
    );
    expect(user?.firstName).toBe("KeepMe");
  });

  test("does nothing when user does not exist", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(internal.users.webhooks.updateFromWebhook, {
        externalAuthId: "nonexistent",
        email: "ghost@example.com",
      }),
    ).resolves.toBeNull();
  });
});
