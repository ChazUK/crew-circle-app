import { QueryCtx } from "@convex/_generated/server";

export async function userByExternalId(ctx: QueryCtx, externalAuthId: string) {
  return ctx.db
    .query("users")
    .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", externalAuthId))
    .unique();
}
