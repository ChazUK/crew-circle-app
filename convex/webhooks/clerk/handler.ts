import { httpAction } from "@convex/server";
import { ClerkWebhookEvent } from "@convex/users/domain/parseClerkWebhook";
import { Webhook } from "svix";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export const handleClerkWebhook = httpAction(async (ctx, request) => {});

async function verifySignature(request: Request) {}
