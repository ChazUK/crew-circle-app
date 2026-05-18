import type { ViewableProfile } from "@shared/profile/viewableProfile";
import { Card } from "heroui-native";
import { Text, View } from "react-native";

type Props = {
  profile: ViewableProfile;
};

function hasBio(
  profile: ViewableProfile,
): profile is Extract<ViewableProfile, { bio: string | undefined }> & { bio: string } {
  return "bio" in profile && typeof profile.bio === "string" && profile.bio.length > 0;
}

export function BioSection({ profile }: Props) {
  if (hasBio(profile)) {
    return (
      <View className="gap-1">
        <Text className="text-sm font-medium text-muted">Bio</Text>
        <Text className="text-base text-foreground">{profile.bio}</Text>
      </View>
    );
  }

  if (profile.mode === "self") {
    return (
      <Card variant="secondary">
        <Card.Body>
          <Text className="text-sm text-muted">Add a short bio to let people know about you</Text>
        </Card.Body>
      </Card>
    );
  }

  return null;
}
