import { v } from "convex/values";

import { internalMutation } from "../_generated/server";
import { createUser, deleteUser, updateUser } from "./domain/syncUser";

export const userCreated = internalMutation({
  args: {
    externalAuthId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
  },
  handler: (ctx, args) => createUser(ctx, args),
});

export const userUpdated = internalMutation({
  args: {
    externalAuthId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
  },
  handler: (ctx, args) => updateUser(ctx, args),
});

export const userDeleted = internalMutation({
  args: { externalAuthId: v.string() },
  handler: (ctx, args) => deleteUser(ctx, args),
});
