import { httpRouter } from "convex/server";

import { handleClerkWebhook } from "./users/clerkWebhook";

const http = httpRouter();

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: handleClerkWebhook,
});

export default http;
