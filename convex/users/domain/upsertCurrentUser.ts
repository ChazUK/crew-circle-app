import { MutationCtx } from "@convex/_generated/server";

import { upsertUser } from "../db/upsertUser";

export interface UserIdentity {
  subject: string;
  email?: string | null;
  givenName?: string | null;
  familyName?: string | null;
}

export const upsertCurrentUser = (ctx: MutationCtx, identity: UserIdentity) =>
  upsertUser(ctx, {
    externalAuthId: identity.subject,
    email: identity.email ?? "",
    firstName: identity.givenName ?? undefined,
    lastName: identity.familyName ?? undefined,
  });
