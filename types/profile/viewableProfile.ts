import type { Id } from "@convex/_generated/dataModel";

type ProfileBase = {
  userId: Id<"users">;
  firstName: string | undefined;
  lastName: string | undefined;
  nickname: string | undefined;
  profilePictureUrl: string | undefined;
  userType: "crew" | "production-manager";
};

export type ViewableProfile =
  | ({ mode: "self" } & ProfileBase)
  | ({ mode: "contact" } & ProfileBase)
  | ({ mode: "public-card" } & ProfileBase)
  | ({ mode: "pm-self" } & ProfileBase)
  | ({ mode: "pm-job-linked" } & ProfileBase);
