import { internal } from "@convex/api";
import { httpAction } from "@convex/server";
import { httpRouter } from "convex/server";
import { Webhook } from "svix";

// Minimal types for the Clerk webhook payloads we handle.
// Using explicit interfaces rather than @clerk/types keeps this dependency-free.
interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUserPayload {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
}

interface ClerkDeletedPayload {
  id: string;
  deleted: boolean;
}

type ClerkWebhookEvent =
  | { type: "user.created"; data: ClerkUserPayload }
  | { type: "user.updated"; data: ClerkUserPayload }
  | { type: "user.deleted"; data: ClerkDeletedPayload };

const http = httpRouter();

const handleClerkWebhook = httpAction(async (ctx, request) => {
  // -------------------------------------------------------------------------
  // 1. Verify the webhook signature using svix.
  //    This confirms the request genuinely originated from Clerk and has not
  //    been tampered with. Requests that fail verification are rejected with
  //    a 400 before any database work is done.
  // -------------------------------------------------------------------------
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Read raw body first — svix verifies against the original bytes.
  const body = await request.text();

  let event: ClerkWebhookEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  // -------------------------------------------------------------------------
  // 2. Dispatch to the appropriate internal mutation.
  //    Internal mutations are not callable by clients — only by server-side
  //    actions like this one.
  // -------------------------------------------------------------------------
  switch (event.type) {
    case "user.created": {
      const { id, email_addresses, primary_email_address_id, first_name, last_name, image_url } =
        event.data;
      const primaryEmail = email_addresses.find((e) => e.id === primary_email_address_id);

      await ctx.runMutation(internal.users.webhooks.userCreated, {
        externalAuthId: id,
        email: primaryEmail?.email_address ?? "",
        firstName: first_name ?? undefined,
        lastName: last_name ?? undefined,
        profilePictureUrl: image_url ?? undefined,
      });
      break;
    }

    case "user.updated": {
      const { id, email_addresses, primary_email_address_id, first_name, last_name, image_url } =
        event.data;
      const primaryEmail = email_addresses.find((e) => e.id === primary_email_address_id);

      await ctx.runMutation(internal.users.webhooks.userUpdated, {
        externalAuthId: id,
        email: primaryEmail?.email_address,
        firstName: first_name ?? undefined,
        lastName: last_name ?? undefined,
        profilePictureUrl: image_url ?? undefined,
      });
      break;
    }

    case "user.deleted": {
      await ctx.runMutation(internal.users.webhooks.userDeleted, {
        externalAuthId: event.data.id,
      });
      break;
    }
  }

  return new Response(null, { status: 200 });
});

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: handleClerkWebhook,
});

export default http;
