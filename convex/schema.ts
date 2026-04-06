import { defineSchema } from "convex/server";

import { kitSchema } from "./kit/schema";
import { usersSchema } from "./users/schema";

export default defineSchema({
  ...usersSchema,
  ...kitSchema,
});
