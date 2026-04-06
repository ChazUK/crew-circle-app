import { defineTable } from "convex/server";
import { v } from "convex/values";

export const Kit = {
  name: v.string(),
};

export const kitSchema = {
  kit: defineTable(Kit).index("byName", ["name"]),
};
