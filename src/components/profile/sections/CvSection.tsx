import type { ViewableProfile } from "@shared/profile/viewableProfile";
import { Card } from "heroui-native";
import { FileTextIcon } from "lucide-react-native";
import { Linking, Pressable, Text, View } from "react-native";

type Props = {
  profile: ViewableProfile;
};

function hasCv(
  profile: ViewableProfile,
): profile is Extract<ViewableProfile, { cvUrl: string | undefined }> & { cvUrl: string } {
  return "cvUrl" in profile && typeof profile.cvUrl === "string" && profile.cvUrl.length > 0;
}

function hasCvField(
  profile: ViewableProfile,
): profile is Extract<ViewableProfile, { cvUrl: string | undefined }> {
  return "cvUrl" in profile;
}

export function CvSection({ profile }: Props) {
  if (hasCv(profile)) {
    return (
      <View className="gap-2">
        <Text className="text-sm font-medium text-muted">CV</Text>
        <Pressable
          className="flex-row items-center gap-2"
          onPress={() => Linking.openURL(profile.cvUrl)}
          accessibilityRole="link"
        >
          <FileTextIcon size={16} className="text-primary" />
          <Text className="text-primary text-base">View CV</Text>
        </Pressable>
      </View>
    );
  }

  if (profile.mode === "self" && hasCvField(profile)) {
    return (
      <Card variant="secondary">
        <Card.Body>
          <Text className="text-sm text-muted">Upload your CV to share with contacts</Text>
        </Card.Body>
      </Card>
    );
  }

  return null;
}
