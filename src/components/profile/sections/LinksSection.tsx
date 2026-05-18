import type { ViewableProfile } from "@shared/profile/viewableProfile";
import { Card } from "heroui-native";
import { GlobeIcon, FilmIcon } from "lucide-react-native";
import { Linking, Pressable, Text, View } from "react-native";

type Props = {
  profile: ViewableProfile;
};

type ProfileWithLinks = Extract<ViewableProfile, { website: string | undefined }>;

function hasLinks(profile: ViewableProfile): profile is ProfileWithLinks {
  return "website" in profile || "imdbId" in profile;
}

function hasAnyLink(profile: ProfileWithLinks): boolean {
  return !!profile.website || !!profile.imdbId;
}

function imdbUrl(id: string): string {
  return `https://www.imdb.com/name/${id}/`;
}

export function LinksSection({ profile }: Props) {
  if (!hasLinks(profile)) return null;

  if (!hasAnyLink(profile)) {
    if (profile.mode === "self") {
      return (
        <Card variant="secondary">
          <Card.Body>
            <Text className="text-sm text-muted">Add your website or IMDB profile</Text>
          </Card.Body>
        </Card>
      );
    }
    return null;
  }

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-muted">Links</Text>
      {profile.website ? (
        <Pressable
          className="flex-row items-center gap-2"
          onPress={() => Linking.openURL(profile.website!)}
          accessibilityRole="link"
        >
          <GlobeIcon size={16} className="text-primary" />
          <Text className="text-primary text-base">{profile.website}</Text>
        </Pressable>
      ) : null}
      {profile.imdbId ? (
        <Pressable
          className="flex-row items-center gap-2"
          onPress={() => Linking.openURL(imdbUrl(profile.imdbId!))}
          accessibilityRole="link"
        >
          <FilmIcon size={16} className="text-primary" />
          <Text className="text-primary text-base">IMDB Profile</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
