import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import schema from "../../schema";
import { upsertCurrentUser } from "./upsertCurrentUser";

const modules = import.meta.glob("../../**/*.ts");

describe("upsertCurrentUser", () => {
  test("creates a new user from identity", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx) =>
      upsertCurrentUser(ctx, { subject: "clerk_abc123", email: "test@example.com" }),
    );
    expect(id).toBeDefined();
  });

  test("returns existing user id on repeat call (idempotent)", async () => {
    const t = convexTest(schema, modules);
    const identity = { subject: "clerk_abc123", email: "test@example.com" };
    const firstId = await t.run((ctx) => upsertCurrentUser(ctx, identity));
    const secondId = await t.run((ctx) => upsertCurrentUser(ctx, identity));
    expect(firstId).toEqual(secondId);
  });

  test("maps givenName and familyName to firstName and lastName", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx) =>
      upsertCurrentUser(ctx, {
        subject: "clerk_named",
        email: "named@example.com",
        givenName: "Alice",
        familyName: "Smith",
      }),
    );
    const user = await t.run((ctx) => ctx.db.get(id));
    expect(user?.firstName).toBe("Alice");
    expect(user?.lastName).toBe("Smith");
  });

  test("falls back to empty string when email is null", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx) =>
      upsertCurrentUser(ctx, { subject: "clerk_noemail", email: null }),
    );
    const user = await t.run((ctx) => ctx.db.get(id));
    expect(user?.email).toBe("");
  });
});
