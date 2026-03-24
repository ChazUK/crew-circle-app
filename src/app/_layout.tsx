import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { layout } from "@/styles/layout";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
if (!publishableKey) throw new Error("Add your Clerk Publishable Key to the .env file");

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <RootNavigator />
    </ClerkProvider>
  );
}

function RootNavigator() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    console.log({ isLoaded, isSignedIn });
    if (isLoaded) {
      SplashScreen.hide();
    }
  }, [isLoaded]);

  if (!isLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen name="(home)" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
