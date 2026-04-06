import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@convex/server", () => ({
  httpAction: (fn: unknown) => fn,
}));

vi.mock("@convex/api", () => ({
  internal: {
    users: {
      webhooks: {
        userCreated: "users:webhooks:userCreated",
        userUpdated: "users:webhooks:userUpdated",
        userDeleted: "users:webhooks:userDeleted",
      },
    },
  },
}));

const mockVerify = vi.hoisted(() => vi.fn());
vi.mock("svix", () => ({
  Webhook: class {
    verify = mockVerify;
  },
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type HandlerFn = (
  ctx: { runMutation: ReturnType<typeof vi.fn> },
  request: Request,
) => Promise<Response>;

const { handleClerkWebhook } = await import("./handler");
const handler = handleClerkWebhook as unknown as HandlerFn;

const SVIX_HEADERS = {
  "svix-id": "msg_123",
  "svix-timestamp": "1234567890",
  "svix-signature": "v1,abc123",
};

function makeRequest(body: string, headerOverrides: Record<string, string> = {}) {
  return new Request("https://example.com/webhooks/clerk", {
    method: "POST",
    body,
    headers: { ...SVIX_HEADERS, ...headerOverrides },
  });
}

const userPayload = {
  id: "user_abc",
  email_addresses: [{ id: "email_1", email_address: "test@example.com" }],
  primary_email_address_id: "email_1",
  first_name: "Alice",
  last_name: "Smith",
  image_url: "https://example.com/pic.jpg",
};

describe("handleClerkWebhook", () => {
  let ctx: { runMutation: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    ctx = { runMutation: vi.fn() };
    mockVerify.mockReset();
    vi.stubEnv("CLERK_WEBHOOK_SECRET", "whsec_test");
  });

  describe("error cases", () => {
    test("returns 500 when webhook secret is not configured", async () => {
      vi.stubEnv("CLERK_WEBHOOK_SECRET", "");
      const response = await handler(ctx, makeRequest("{}"));
      expect(response.status).toBe(500);
    });

    test("returns 400 when svix-id header is missing", async () => {
      const response = await handler(ctx, makeRequest("{}", { "svix-id": "" }));
      expect(response.status).toBe(400);
    });

    test("returns 400 when svix-timestamp header is missing", async () => {
      const response = await handler(ctx, makeRequest("{}", { "svix-timestamp": "" }));
      expect(response.status).toBe(400);
    });

    test("returns 400 when svix-signature header is missing", async () => {
      const response = await handler(ctx, makeRequest("{}", { "svix-signature": "" }));
      expect(response.status).toBe(400);
    });

    test("returns 400 when webhook signature verification fails", async () => {
      mockVerify.mockImplementation(() => {
        throw new Error("Invalid signature");
      });
      const response = await handler(ctx, makeRequest("{}"));
      expect(response.status).toBe(400);
    });
  });

  describe("user.created", () => {
    test("calls userCreated mutation and returns 200", async () => {
      mockVerify.mockReturnValue({ type: "user.created", data: userPayload });
      const response = await handler(
        ctx,
        makeRequest(JSON.stringify({ type: "user.created", data: userPayload })),
      );
      expect(response.status).toBe(200);
      expect(ctx.runMutation).toHaveBeenCalledOnce();
      expect(ctx.runMutation).toHaveBeenCalledWith("users:webhooks:userCreated", {
        externalAuthId: "user_abc",
        email: "test@example.com",
        firstName: "Alice",
        lastName: "Smith",
        profilePictureUrl: "https://example.com/pic.jpg",
      });
    });
  });

  describe("user.updated", () => {
    test("calls userUpdated mutation and returns 200", async () => {
      mockVerify.mockReturnValue({ type: "user.updated", data: userPayload });
      const response = await handler(
        ctx,
        makeRequest(JSON.stringify({ type: "user.updated", data: userPayload })),
      );
      expect(response.status).toBe(200);
      expect(ctx.runMutation).toHaveBeenCalledOnce();
      expect(ctx.runMutation).toHaveBeenCalledWith(
        "users:webhooks:userUpdated",
        expect.objectContaining({
          externalAuthId: "user_abc",
          email: "test@example.com",
        }),
      );
    });
  });

  describe("user.deleted", () => {
    test("calls userDeleted mutation and returns 200", async () => {
      mockVerify.mockReturnValue({ type: "user.deleted", data: { id: "user_del", deleted: true } });
      const response = await handler(
        ctx,
        makeRequest(
          JSON.stringify({ type: "user.deleted", data: { id: "user_del", deleted: true } }),
        ),
      );
      expect(response.status).toBe(200);
      expect(ctx.runMutation).toHaveBeenCalledOnce();
      expect(ctx.runMutation).toHaveBeenCalledWith("users:webhooks:userDeleted", {
        externalAuthId: "user_del",
      });
    });
  });
});
