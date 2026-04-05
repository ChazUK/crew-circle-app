import { defineSchema } from "convex/server";

import { kitTagShema } from "./kit/schema";
import { usersSchema } from "./users/schema";

export default defineSchema({
  ...usersSchema,
  ...kitTagShema,
});
