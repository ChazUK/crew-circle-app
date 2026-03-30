import { v } from "convex/values";

import { internalMutation } from "../../_generated/server";
import { upsertUserRecord } from "../_helpers";

export const userCreated = internalMutation({
  args: {
    externalAuthId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
  },
  handler: (ctx, args) => upsertUserRecord(ctx, args),
});
