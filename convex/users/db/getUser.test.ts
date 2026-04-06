import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import schema from "../../schema";
import { getUserByExternalId, getUserById } from "./getUser";

const modules = import.meta.glob("../../**/*.ts");

describe("getUserByExternalId", () => {
  test("returns null when user does not exist", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run((ctx) => getUserByExternalId(ctx, "nonexistent"));
    expect(result).toBeNull();
  });

  test("returns user matching the external auth id", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) =>
      ctx.db.insert("users", {
        externalAuthId: "clerk_123",
        email: "test@example.com",
        hasCompletedOnboarding: false,
        isPublic: false,
      }),
    );
    const result = await t.run((ctx) => getUserByExternalId(ctx, "clerk_123"));
    expect(result?.email).toBe("test@example.com");
  });
});

describe("getUserById", () => {
  test("returns null for an unknown id", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run((ctx) =>
      getUserById(ctx, "jn7b4r8ape7qfmtkxbwj8d5j8h6x4yhg" as never),
    );
    expect(result).toBeNull();
  });

  test("returns user matching the id", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx) =>
      ctx.db.insert("users", {
        externalAuthId: "clerk_id_test",
        email: "id@example.com",
        hasCompletedOnboarding: false,
        isPublic: false,
      }),
    );
    const result = await t.run((ctx) => getUserById(ctx, id));
    expect(result?.email).toBe("id@example.com");
  });
});
