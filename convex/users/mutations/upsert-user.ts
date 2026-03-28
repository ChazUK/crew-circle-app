import { mutation } from "../../_generated/server";
import { upsertUserRecord } from "../_helpers";

export const upsertUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return upsertUserRecord(ctx, {
      externalAuthId: identity.subject,
      email: identity.email ?? "",
      firstName: identity.givenName,
      lastName: identity.familyName,
    });
  },
});
