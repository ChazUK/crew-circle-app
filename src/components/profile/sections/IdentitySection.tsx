import type { ViewableProfile } from "@shared/profile/viewableProfile";
import { Avatar } from "heroui-native";
import { Text, View } from "react-native";

type Props = {
  profile: ViewableProfile;
};

function getInitials(profile: ViewableProfile) {
  const first = profile.firstName?.[0] ?? "";
  const last = profile.lastName?.[0] ?? "";
  const combined = `${first}${last}`.trim();
  if (combined) return combined.toUpperCase();
  return "?";
}

function getDisplayName(profile: ViewableProfile) {
  const parts: string[] = [];
  if (profile.firstName) parts.push(profile.firstName);
  if (profile.lastName) parts.push(profile.lastName);
  const fullName = parts.join(" ");
  if (profile.nickname) return `${fullName} (${profile.nickname})`.trim();
  return fullName;
}

export function IdentitySection({ profile }: Props) {
  const displayName = getDisplayName(profile);

  return (
    <View className="items-center gap-3">
      <Avatar size="lg" alt={displayName || "Profile"}>
        {profile.profilePictureUrl ? (
          <Avatar.Image source={{ uri: profile.profilePictureUrl }} />
        ) : null}
        <Avatar.Fallback>{getInitials(profile)}</Avatar.Fallback>
      </Avatar>
      {displayName ? (
        <Text className="text-lg font-semibold text-foreground">{displayName}</Text>
      ) : null}
    </View>
  );
}
