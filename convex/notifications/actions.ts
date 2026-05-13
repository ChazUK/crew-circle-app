import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export const sendExpoPush = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const token: string | null = await ctx.runQuery(
      internal.notifications.queries.getPushTokenForUser,
      { userId: args.userId },
    );
    if (!token) return;

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: token,
          title: args.title,
          body: args.body,
          sound: "default",
          data: args.data ?? {},
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`Expo push failed (${response.status}): ${text}`);
      }
    } catch (err) {
      console.error("Expo push error:", err);
    }
  },
});
