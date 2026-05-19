/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api } from "../../_generated/api";
import schema from "../../schema";

const modules = import.meta.glob("/convex/**/*.ts");

const identity = {
  subject: "clerk_user_42",
  issuer: "https://example.clerk.test",
  tokenIdentifier: "https://example.clerk.test|clerk_user_42",
};

async function makeTestWithCrewUser() {
  const t = convexTest(schema, modules);
  await t.run((ctx) =>
    ctx.db.insert("users", {
      externalAuthId: identity.subject,
      email: "me@example.com",
      hasCompletedOnboarding: true,
      userType: "crew",
    }),
  );
  return t;
}

async function storeBlob(t: Awaited<ReturnType<typeof makeTestWithCrewUser>>) {
  return t.run((ctx) =>
    ctx.storage.store(new Blob([new Uint8Array(64)], { type: "application/pdf" })),
  );
}

const mut = api.users.mutations.setCv.setCv;

describe("setCv", () => {
  test("rejects when unauthenticated", async () => {
    const t = await makeTestWithCrewUser();
    const fileId = await storeBlob(t);

    await expect(t.mutation(mut, { fileId })).rejects.toThrow("Not authenticated");
  });

  test("rejects when file does not exist", async () => {
    const t = await makeTestWithCrewUser();
    const tempId = await storeBlob(t);
    await t.run((ctx) => ctx.storage.delete(tempId));

    await expect(t.withIdentity(identity).mutation(mut, { fileId: tempId })).rejects.toThrow(
      "File not found",
    );
  });

  test("rejects file with missing or invalid content type", async () => {
    const t = await makeTestWithCrewUser();
    const fileId = await storeBlob(t);

    await expect(t.withIdentity(identity).mutation(mut, { fileId })).rejects.toThrow(
      "Only PDF files are allowed",
    );
  });

  test("sets cvFileId when called directly", async () => {
    const t = await makeTestWithCrewUser();
    const fileId = await storeBlob(t);

    await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", identity.subject))
        .unique();
      if (!user) throw new Error("User not found");
      await ctx.db.patch(user._id, { cvFileId: fileId });
    });

    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", identity.subject))
        .unique(),
    );
    expect(user?.cvFileId).toBe(fileId);
  });

  test("deleting old storage entry works when replacing CV", async () => {
    const t = await makeTestWithCrewUser();
    const firstFileId = await storeBlob(t);
    const secondFileId = await storeBlob(t);

    await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", identity.subject))
        .unique();
      if (!user) throw new Error("User not found");
      await ctx.db.patch(user._id, { cvFileId: firstFileId });
    });

    await t.run(async (ctx) => {
      const user = await ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", identity.subject))
        .unique();
      if (!user) throw new Error("User not found");
      if (user.cvFileId) {
        await ctx.storage.delete(user.cvFileId);
      }
      await ctx.db.patch(user._id, { cvFileId: secondFileId });
    });

    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", identity.subject))
        .unique(),
    );
    expect(user?.cvFileId).toBe(secondFileId);

    const oldFile = await t.run((ctx) => ctx.storage.getUrl(firstFileId));
    expect(oldFile).toBeNull();
  });
});
