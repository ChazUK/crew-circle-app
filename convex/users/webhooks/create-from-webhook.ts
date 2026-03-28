import { internalMutation } from "@convex/_generated/server";
import { v } from "convex/values";

import { upsertUserRecord } from "../_helpers";

export const createFromWebhook = internalMutation({
  args: {
    externalAuthId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
  },
  handler: (ctx, args) => upsertUserRecord(ctx, args),
});
