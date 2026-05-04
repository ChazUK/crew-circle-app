/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { internal } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("/convex/**/*.ts");

describe("userCreated phone handling", () => {
  test("creates user with phone when provided", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.users.webhooks.userCreated, {
      externalAuthId: "clerk_ph_1",
      email: "phone@example.com",
      phone: "+447700900123",
    });
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", "clerk_ph_1"))
        .unique(),
    );
    expect(user?.phone).toBe("+447700900123");
  });

  test("creates user without phone field when phone arg is omitted", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.users.webhooks.userCreated, {
      externalAuthId: "clerk_ph_2",
      email: "nophone@example.com",
    });
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", "clerk_ph_2"))
        .unique(),
    );
    expect(user?.phone).toBeUndefined();
  });
});

describe("userUpdated phone handling", () => {
  test("updates phone on existing user when provided", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.users.webhooks.userCreated, {
      externalAuthId: "clerk_upd_ph_1",
      email: "clerk_upd_ph_1@example.com",
    });
    await t.mutation(internal.users.webhooks.userUpdated, {
      externalAuthId: "clerk_upd_ph_1",
      phone: "+12025550143",
    });
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", "clerk_upd_ph_1"))
        .unique(),
    );
    expect(user?.phone).toBe("+12025550143");
  });

  test("clears phone on existing user when empty string provided", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.users.webhooks.userCreated, {
      externalAuthId: "clerk_upd_ph_2",
      email: "clerk_upd_ph_2@example.com",
      phone: "+447700900000",
    });
    await t.mutation(internal.users.webhooks.userUpdated, {
      externalAuthId: "clerk_upd_ph_2",
      phone: "",
    });
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", "clerk_upd_ph_2"))
        .unique(),
    );
    expect(user?.phone).toBeUndefined();
  });

  test("leaves phone unchanged when phone arg is omitted", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.users.webhooks.userCreated, {
      externalAuthId: "clerk_upd_ph_3",
      email: "clerk_upd_ph_3@example.com",
      phone: "+447700900111",
    });
    await t.mutation(internal.users.webhooks.userUpdated, {
      externalAuthId: "clerk_upd_ph_3",
    });
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", "clerk_upd_ph_3"))
        .unique(),
    );
    expect(user?.phone).toBe("+447700900111");
  });
});
