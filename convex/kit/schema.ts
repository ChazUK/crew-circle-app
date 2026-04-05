import { defineTable } from "convex/server";
import { v } from "convex/values";

export const KitTag = {
  name: v.string(),
};

export const kitTagShema = {
  kitTags: defineTable(KitTag).index("byName", ["name"]),
};
