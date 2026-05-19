import { ConvexError, v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";
import { getUserByExternalId } from "../db/getUser";

const MAX_SIZE = 10 * 1024 * 1024;

type FileMetadata = {
  _id: Id<"_storage">;
  _creationTime: number;
  contentType?: string;
  sha256: string;
  size: number;
};

export const setCv = mutation({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const user = await getUserByExternalId(ctx, identity.subject);
    if (!user) throw new ConvexError("User not found");

    const metadata: FileMetadata | null = await ctx.db.system.get(args.fileId);
    if (!metadata) throw new ConvexError("File not found");

    if (metadata.contentType !== "application/pdf") {
      throw new ConvexError("Only PDF files are allowed");
    }
    if (metadata.size > MAX_SIZE) {
      throw new ConvexError("CV must be 10 MB or smaller");
    }

    const previousFileId = user.cvFileId;
    if (previousFileId === args.fileId) return;

    await ctx.db.patch(user._id, { cvFileId: args.fileId });

    if (previousFileId) {
      await ctx.storage.delete(previousFileId);
    }
  },
});
