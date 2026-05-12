import Constants from "expo-constants";
import { Image } from "expo-image";
import * as StoreReview from "expo-store-review";
import { ListGroup, PressableFeedback, Separator } from "heroui-native";
import { ShareIcon, StarIcon } from "lucide-react-native";
import { Alert, Linking, Platform, ScrollView, Share, Text, View } from "react-native";

const APP_TAGLINE = "Build the crew you need.";
const APP_DESCRIPTION =
  "CrewCircle helps you schedule shifts, fill gaps, and hire trusted pros — all in one place.";

function getShareUrl(): string {
  const extra = Constants.expoConfig?.extra as
    | { appStoreId?: string; websiteUrl?: string }
    | undefined;
  if (Platform.OS === "ios" && extra?.appStoreId) {
    return `https://apps.apple.com/app/id${extra.appStoreId}`;
  }
  const androidPackage = Constants.expoConfig?.android?.package;
  if (Platform.OS === "android" && androidPackage) {
    return `https://play.google.com/store/apps/details?id=${androidPackage}`;
  }
  return extra?.websiteUrl ?? "https://crewcircle.app";
}

function getReviewUrl(): string | null {
  const appStoreId = (Constants.expoConfig?.extra as { appStoreId?: string } | undefined)
    ?.appStoreId;
  if (Platform.OS === "ios") {
    return appStoreId ? `itms-apps://apps.apple.com/app/id${appStoreId}?action=write-review` : null;
  }
  const androidPackage = Constants.expoConfig?.android?.package;
  return androidPackage ? `market://details?id=${androidPackage}` : null;
}

export default function AboutSettings() {
  const version = Constants.expoConfig?.version ?? "—";
  const buildNumber =
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode?.toString();

  const handleRate = async () => {
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
        return;
      }
      const url = getReviewUrl();
      if (url) {
        await Linking.openURL(url);
        return;
      }
      Alert.alert("Coming soon", "Rating will be available once CrewCircle is on the store.");
    } catch (error) {
      Alert.alert(
        "Couldn't open rating",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const handleShare = async () => {
    const url = getShareUrl();
    try {
      await Share.share(
        Platform.OS === "ios"
          ? { title: "CrewCircle", url, message: `Check out CrewCircle — ${APP_TAGLINE}` }
          : { title: "CrewCircle", message: `Check out CrewCircle — ${APP_TAGLINE} ${url}` },
      );
    } catch (error) {
      Alert.alert("Couldn't share", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 gap-6">
      <View className="items-center gap-3 pt-4 pb-2">
        <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-blue-500">
          <Image
            source={require("@/assets/icons/splash-icon-dark.png")}
            style={{ width: 96, height: 96 }}
          />
        </View>
        <View className="items-center gap-1">
          <Text className="text-2xl font-bold text-foreground">CrewCircle</Text>
          <Text className="text-base text-muted">{APP_TAGLINE}</Text>
        </View>
        <Text className="text-sm text-muted">
          Version {version}
          {buildNumber ? ` (${buildNumber})` : ""}
        </Text>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-muted uppercase">About</Text>
        <ListGroup>
          <ListGroup.Item>
            <ListGroup.ItemContent>
              <Text className="text-base text-foreground leading-6">{APP_DESCRIPTION}</Text>
            </ListGroup.ItemContent>
          </ListGroup.Item>
        </ListGroup>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-semibold text-muted uppercase">Spread the word</Text>
        <ListGroup>
          <PressableFeedback animation={false} onPress={handleShare}>
            <PressableFeedback.Scale>
              <ListGroup.Item disabled>
                <ListGroup.ItemPrefix>
                  <ShareIcon size={20} />
                </ListGroup.ItemPrefix>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>Share with friends</ListGroup.ItemTitle>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix />
              </ListGroup.Item>
            </PressableFeedback.Scale>
            <PressableFeedback.Ripple />
          </PressableFeedback>

          <Separator className="mx-4" />

          <PressableFeedback animation={false} onPress={handleRate}>
            <PressableFeedback.Scale>
              <ListGroup.Item disabled>
                <ListGroup.ItemPrefix>
                  <StarIcon size={20} />
                </ListGroup.ItemPrefix>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>Rate CrewCircle</ListGroup.ItemTitle>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix />
              </ListGroup.Item>
            </PressableFeedback.Scale>
            <PressableFeedback.Ripple />
          </PressableFeedback>
        </ListGroup>
      </View>

      <View className="items-center gap-1 pt-2 pb-6">
        <Text className="text-xs text-muted">Made with care for shift workers.</Text>
        <Text className="text-xs text-muted">© {new Date().getFullYear()} CrewCircle</Text>
      </View>
    </ScrollView>
  );
}
