import { v } from "convex/values";

import { Doc, Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { getUserByExternalId } from "../users/db/getUser";
import { findContactPair } from "./db/findContactPair";
import { listContactsForOwner } from "./db/listContactsForOwner";

export const listMyContacts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const me = await getUserByExternalId(ctx, identity.subject);
    if (!me) return [];

    const rows = await listContactsForOwner(ctx, me._id);
    const enriched: Array<{
      contactId: Id<"contacts">;
      user: Doc<"users">;
      nickname?: string;
      createdAt: number;
    }> = [];
    for (const row of rows) {
      const user = await ctx.db.get(row.contactUserId);
      if (user) {
        enriched.push({
          contactId: row._id,
          user,
          ...(row.nickname && { nickname: row.nickname }),
          createdAt: row.createdAt,
        });
      }
    }
    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listMyIncomingInvites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const me = await getUserByExternalId(ctx, identity.subject);
    if (!me) return [];

    const invites = await ctx.db
      .query("contactInvites")
      .withIndex("byTargetUserAndStatus", (q) =>
        q.eq("targetUserId", me._id).eq("status", "pending"),
      )
      .collect();

    const enriched: Array<{ invite: Doc<"contactInvites">; from: Doc<"users"> | null }> = [];
    for (const invite of invites) {
      const from = await ctx.db.get(invite.fromUserId);
      enriched.push({ invite, from });
    }
    return enriched.sort((a, b) => b.invite.createdAt - a.invite.createdAt);
  },
});

export const listMyOutgoingInvites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const me = await getUserByExternalId(ctx, identity.subject);
    if (!me) return [];

    const invites = await ctx.db
      .query("contactInvites")
      .withIndex("byFromUserAndStatus", (q) => q.eq("fromUserId", me._id).eq("status", "pending"))
      .collect();

    const enriched: Array<{
      invite: Doc<"contactInvites">;
      targetUser: Doc<"users"> | null;
    }> = [];
    for (const invite of invites) {
      const targetUser = invite.targetUserId ? await ctx.db.get(invite.targetUserId) : null;
      enriched.push({ invite, targetUser });
    }
    return enriched.sort((a, b) => b.invite.createdAt - a.invite.createdAt);
  },
});

export const searchUsers = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const me = await getUserByExternalId(ctx, identity.subject);
    if (!me) return [];

    const needle = args.query.trim().toLowerCase();
    if (needle.length < 2) return [];
    const limit = Math.min(args.limit ?? 20, 50);

    const candidates = await ctx.db.query("users").take(200);
    const results: Array<{ user: Doc<"users">; state: "none" | "pending" | "contact" }> = [];
    for (const user of candidates) {
      if (user._id === me._id) continue;
      const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase().trim();
      const email = user.email.toLowerCase();
      if (!name.includes(needle) && !email.includes(needle)) continue;

      const contact = await findContactPair(ctx, me._id, user._id);
      let state: "none" | "pending" | "contact" = "none";
      if (contact) {
        state = "contact";
      } else {
        const pending = await ctx.db
          .query("contactInvites")
          .withIndex("byFromUserAndStatus", (q) =>
            q.eq("fromUserId", me._id).eq("status", "pending"),
          )
          .collect();
        if (pending.some((row) => row.targetUserId === user._id)) {
          state = "pending";
        } else {
          const incoming = await ctx.db
            .query("contactInvites")
            .withIndex("byTargetUserAndStatus", (q) =>
              q.eq("targetUserId", me._id).eq("status", "pending"),
            )
            .collect();
          if (incoming.some((row) => row.fromUserId === user._id)) {
            state = "pending";
          }
        }
      }
      results.push({ user, state });
      if (results.length >= limit) break;
    }
    return results;
  },
});
