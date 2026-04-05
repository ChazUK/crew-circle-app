import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api } from "../../_generated/api";
import { modules } from "../../_testModule";
import schema from "../../schema";

describe("upsertUser", () => {
  test("throws when not authenticated", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.users.mutations.upsertUser.mutate, {})).rejects.toThrow(
      "Not authenticated",
    );
  });

  test("creates a new user when authenticated", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({
      subject: "clerk_abc123",
      email: "test@example.com",
      givenName: "John",
      familyName: "Doe",
    });
    const userId = await asUser.mutation(api.users.mutations.upsertUser.mutate, {});
    expect(userId).toBeDefined();
  });

  test("returns existing user id on repeat call", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "clerk_abc123", email: "test@example.com" });
    const firstId = await asUser.mutation(api.users.mutations.upsertUser.mutate, {});
    const secondId = await asUser.mutation(api.users.mutations.upsertUser.mutate, {});
    expect(firstId).toEqual(secondId);
  });

  test("sets hasCompletedOnboarding to false on creation", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "clerk_new", email: "new@example.com" });
    await asUser.mutation(api.users.mutations.upsertUser.mutate, {});
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", "clerk_new"))
        .unique(),
    );
    expect(user?.hasCompletedOnboarding).toBe(false);
  });

  test("sets isPublic to false on creation", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "clerk_pub", email: "pub@example.com" });
    await asUser.mutation(api.users.mutations.upsertUser.mutate, {});
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", "clerk_pub"))
        .unique(),
    );
    expect(user?.isPublic).toBe(false);
  });

  test("stores name from identity", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({
      subject: "clerk_named",
      email: "named@example.com",
      givenName: "Alice",
      familyName: "Smith",
    });
    await asUser.mutation(api.users.mutations.upsertUser.mutate, {});
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", "clerk_named"))
        .unique(),
    );
    expect(user?.firstName).toBe("Alice");
    expect(user?.lastName).toBe("Smith");
  });
});
