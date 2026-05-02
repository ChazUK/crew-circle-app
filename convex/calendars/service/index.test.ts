import type {
  CalendarConnectContext,
  CalendarConnectParams,
  CalendarProvider,
  CalendarProviderRegistry,
} from "@shared/calendars";
/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, test } from "vitest";

import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";
import { createCalendarService } from "./index";

const modules = import.meta.glob("/convex/**/*.ts");

const identity = {
  subject: "clerk_user_42",
  issuer: "https://example.clerk.test",
  tokenIdentifier: "https://example.clerk.test|clerk_user_42",
};

async function insertUser(t: TestConvex<typeof schema>, externalAuthId: string) {
  return t.run((ctx) =>
    ctx.db.insert("users", {
      externalAuthId,
      email: `${externalAuthId}@example.com`,
      hasCompletedOnboarding: false,
      isPublic: false,
    }),
  );
}

async function insertConnection(
  t: TestConvex<typeof schema>,
  userId: Id<"users">,
  overrides: {
    color?: string;
    label?: string;
    provider?: "google" | "microsoft" | "ical" | "native";
  } = {},
) {
  return t.run((ctx) =>
    ctx.db.insert("calendarConnections", {
      userId,
      provider: overrides.provider ?? "ical",
      label: overrides.label ?? "Existing",
      color: overrides.color ?? "#6366f1",
      createdAt: Date.now(),
      syncErrorCount: 0,
    }),
  );
}

type StubCall = {
  params: CalendarConnectParams;
  context: CalendarConnectContext;
};

function makeStubProvider(returnId: () => string, calls: StubCall[]): CalendarProvider {
  return {
    capabilities: {
      serverSidePullable: true,
      writable: false,
      hasSubCalendars: false,
    },
    async connect(_ctx, params, context) {
      calls.push({ params, context });
      return returnId();
    },
  };
}

function buildRegistry(returnId: () => string, calls: StubCall[]): CalendarProviderRegistry {
  const provider = makeStubProvider(returnId, calls);
  return {
    google: provider,
    microsoft: provider,
    ical: provider,
    native: provider,
  };
}

describe("CalendarService.connect", () => {
  test("throws when the caller is not authenticated", async () => {
    const t = convexTest(schema, modules);
    const calls: StubCall[] = [];
    const service = createCalendarService(buildRegistry(() => "irrelevant", calls));

    await expect(
      t.action(async (ctx) =>
        service.connect(ctx, {
          provider: "ical",
          url: "https://example.com/cal.ics",
          label: "Mine",
        }),
      ),
    ).rejects.toThrow("Not authenticated");
    expect(calls).toEqual([]);
  });

  test("assigns a palette colour and forwards it to the provider via context", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, identity.subject);
    // Pre-create the row that the stub provider will "return" — using a non-palette colour
    // so it does not pollute the assignPaletteColour input.
    const newConnectionId = await insertConnection(t, userId, {
      provider: "google",
      label: "New",
      color: "#000000",
    });

    const calls: StubCall[] = [];
    const service = createCalendarService(buildRegistry(() => newConnectionId, calls));

    await t.withIdentity(identity).action(async (ctx) =>
      service.connect(ctx, {
        provider: "google",
        authCode: "code",
        codeVerifier: "verifier",
        clientId: "client-1",
        redirectUri: "https://app.example/callback",
        label: "Work",
      }),
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].context.userId).toBe(userId);
    expect(calls[0].context.color).toBe("#6366f1");
  });

  test("picks the next unused palette colour when the user already has connections", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, identity.subject);
    await insertConnection(t, userId, { color: "#6366f1" });
    await insertConnection(t, userId, { color: "#10b981" });
    const newConnectionId = await insertConnection(t, userId, {
      provider: "google",
      label: "New",
      color: "#000000",
    });

    const calls: StubCall[] = [];
    const service = createCalendarService(buildRegistry(() => newConnectionId, calls));

    await t.withIdentity(identity).action(async (ctx) =>
      service.connect(ctx, {
        provider: "google",
        authCode: "code",
        codeVerifier: "verifier",
        clientId: "client-1",
        redirectUri: "https://app.example/callback",
        label: "Work",
      }),
    );

    expect(calls[0].context.color).toBe("#f59e0b");
  });

  test("creates a synthetic sub-calendar row for iCal connections", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, identity.subject);
    const newConnectionId = await insertConnection(t, userId, {
      provider: "ical",
      label: "Family iCloud",
      color: "#000000",
    });

    const calls: StubCall[] = [];
    const service = createCalendarService(buildRegistry(() => newConnectionId, calls));

    await t.withIdentity(identity).action(async (ctx) =>
      service.connect(ctx, {
        provider: "ical",
        url: "https://example.com/cal.ics",
        label: "Family iCloud",
      }),
    );

    const subCalendars = await t.run((ctx) =>
      ctx.db
        .query("calendarSubCalendars")
        .withIndex("byConnection", (q) => q.eq("connectionId", newConnectionId))
        .collect(),
    );
    expect(subCalendars).toHaveLength(1);
    expect(subCalendars[0]).toMatchObject({
      connectionId: newConnectionId,
      externalId: newConnectionId,
      label: "Family iCloud",
      showAsBusy: true,
    });
  });

  test("does not create a sub-calendar row for non-iCal providers", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, identity.subject);
    const newConnectionId = await insertConnection(t, userId, {
      provider: "google",
      label: "Work",
      color: "#000000",
    });

    const calls: StubCall[] = [];
    const service = createCalendarService(buildRegistry(() => newConnectionId, calls));

    await t.withIdentity(identity).action(async (ctx) =>
      service.connect(ctx, {
        provider: "google",
        authCode: "code",
        codeVerifier: "verifier",
        clientId: "client-1",
        redirectUri: "https://app.example/callback",
        label: "Work",
      }),
    );

    const subCalendars = await t.run((ctx) => ctx.db.query("calendarSubCalendars").collect());
    expect(subCalendars).toEqual([]);
  });

  test("returns the connectionId returned by the provider", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, identity.subject);
    const newConnectionId = await insertConnection(t, userId, {
      provider: "native",
      label: "Phone",
      color: "#000000",
    });

    const calls: StubCall[] = [];
    const service = createCalendarService(buildRegistry(() => newConnectionId, calls));

    const returned = await t.withIdentity(identity).action(async (ctx) =>
      service.connect(ctx, {
        provider: "native",
        deviceCalendarId: "device-cal-1",
        label: "Phone",
      }),
    );

    expect(returned).toBe(newConnectionId);
  });

  test("delegates to the provider matching the params.provider discriminant", async () => {
    const t = convexTest(schema, modules);
    const userId = await insertUser(t, identity.subject);
    const newConnectionId = await insertConnection(t, userId, {
      provider: "microsoft",
      label: "Outlook",
      color: "#000000",
    });

    const microsoftCalls: StubCall[] = [];
    const otherCalls: StubCall[] = [];
    const microsoftProvider = makeStubProvider(() => newConnectionId, microsoftCalls);
    const otherProvider = makeStubProvider(() => "should-not-be-called", otherCalls);

    const service = createCalendarService({
      google: otherProvider,
      microsoft: microsoftProvider,
      ical: otherProvider,
      native: otherProvider,
    });

    await t.withIdentity(identity).action(async (ctx) =>
      service.connect(ctx, {
        provider: "microsoft",
        authCode: "code",
        codeVerifier: "verifier",
        clientId: "client-1",
        redirectUri: "https://app.example/callback",
        label: "Outlook",
      }),
    );

    expect(microsoftCalls).toHaveLength(1);
    expect(otherCalls).toEqual([]);
  });
});
