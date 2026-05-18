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

const mut = api.users.mutations.updateProfileBioLinks.updateProfileBioLinks;

describe("updateProfileBioLinks", () => {
  test("happy path: sets bio, website, and imdbId", async () => {
    const t = await makeTestWithCrewUser();
    await t.withIdentity(identity).mutation(mut, {
      bio: "Camera operator based in London",
      website: "example.com",
      imdbId: "https://www.imdb.com/name/nm0000123/",
    });
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", identity.subject))
        .unique(),
    );
    expect(user?.bio).toBe("Camera operator based in London");
    expect(user?.website).toBe("https://example.com");
    expect(user?.imdbId).toBe("nm0000123");
  });

  test("rejects bio longer than 280 characters", async () => {
    const t = await makeTestWithCrewUser();
    await expect(
      t.withIdentity(identity).mutation(mut, {
        bio: "x".repeat(281),
      }),
    ).rejects.toThrow("Bio must be 280 characters or fewer");
  });

  test("rejects invalid URL", async () => {
    const t = await makeTestWithCrewUser();
    await expect(
      t.withIdentity(identity).mutation(mut, {
        website: "not a url at all !!!",
      }),
    ).rejects.toThrow("Invalid website URL");
  });

  test("normalises IMDB full URL to bare id", async () => {
    const t = await makeTestWithCrewUser();
    await t.withIdentity(identity).mutation(mut, {
      imdbId: "https://www.imdb.com/name/nm1234567/bio",
    });
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", identity.subject))
        .unique(),
    );
    expect(user?.imdbId).toBe("nm1234567");
  });

  test("rejects invalid IMDB input", async () => {
    const t = await makeTestWithCrewUser();
    await expect(
      t.withIdentity(identity).mutation(mut, {
        imdbId: "not-an-imdb-id",
      }),
    ).rejects.toThrow("Invalid IMDB ID");
  });

  test("rejects when unauthenticated", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(mut, {
        bio: "Hello",
      }),
    ).rejects.toThrow("Not authenticated");
  });

  test("clears fields when given empty strings", async () => {
    const t = await makeTestWithCrewUser();
    await t.withIdentity(identity).mutation(mut, {
      bio: "Something",
      website: "example.com",
      imdbId: "nm0000123",
    });
    await t.withIdentity(identity).mutation(mut, {
      bio: "",
      website: "",
      imdbId: "",
    });
    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", identity.subject))
        .unique(),
    );
    expect(user?.bio).toBeUndefined();
    expect(user?.website).toBeUndefined();
    expect(user?.imdbId).toBeUndefined();
  });
});
