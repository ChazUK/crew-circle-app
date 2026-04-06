import { Id } from "@convex/_generated/dataModel";
import { QueryCtx } from "@convex/_generated/server";

export const getUserById = (ctx: QueryCtx, id: Id<"users">) => ctx.db.get(id);

export const getUserByExternalId = (ctx: QueryCtx, externalAuthId: string) =>
  ctx.db
    .query("users")
    .withIndex("byExternalAuthId", (q) => q.eq("externalAuthId", externalAuthId))
    .unique();
