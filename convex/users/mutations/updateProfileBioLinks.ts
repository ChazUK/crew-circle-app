import { ConvexError, v } from "convex/values";
import { z } from "zod";

import { mutation } from "../../_generated/server";
import { getUserByExternalId } from "../db/getUser";

function normalizeWebsiteUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function extractImdbId(input: string): string | null {
  const match = input.match(/nm\d+/);
  return match ? match[0] : null;
}

export const updateProfileBioLinks = mutation({
  args: {
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    imdbId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await getUserByExternalId(ctx, identity.subject);
    if (!user) throw new ConvexError("User not found");

    const patch: Record<string, string | undefined> = {};

    if (args.bio !== undefined) {
      const trimmed = args.bio.trim();
      if (trimmed.length > 280) {
        throw new ConvexError("Bio must be 280 characters or fewer");
      }
      patch.bio = trimmed === "" ? undefined : trimmed;
    }

    if (args.website !== undefined) {
      const trimmed = args.website.trim();
      if (trimmed === "") {
        patch.website = undefined;
      } else {
        const normalized = normalizeWebsiteUrl(trimmed);
        const result = z.string().url().safeParse(normalized);
        if (!result.success) {
          throw new ConvexError("Invalid website URL");
        }
        patch.website = normalized;
      }
    }

    if (args.imdbId !== undefined) {
      const trimmed = args.imdbId.trim();
      if (trimmed === "") {
        patch.imdbId = undefined;
      } else {
        const id = extractImdbId(trimmed);
        if (!id) {
          throw new ConvexError("Invalid IMDB ID — expected an nm-prefixed identifier");
        }
        patch.imdbId = id;
      }
    }

    await ctx.db.patch(user._id, patch);
  },
});
