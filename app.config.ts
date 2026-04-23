// Google OAuth on iOS redirects back to the app using a URL scheme that is the
// reverse-DNS form of the iOS client id (e.g. com.googleusercontent.apps.xxxxx).
// The scheme must be declared in Info.plist so the system routes the callback
// to us; register it via CFBundleURLTypes below when the env var is set.
const googleIosUrlScheme = process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME;

export default {
  expo: {
    name: "crew-circle-app",
    slug: "crew-circle-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./src/assets/icons/ios-light.png",
    scheme: "crew-circle",
    userInterfaceStyle: "light",
    splash: {
      image: "./src/assets/icons/splash-icon-light.png",
      resizeMode: "contain",
      backgroundColor: "#232323",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.crewcircle.crewcircle",
      usesAppleSignIn: true,
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          "CrewCircle needs access to your photo library to upload a profile photo.",
        NSCameraUsageDescription: "CrewCircle needs access to your camera to take a profile photo.",
        NSCalendarsUsageDescription:
          "CrewCircle needs full calendar access to view when you're busy and add events to your schedule.",
        NSCalendarsFullAccessUsageDescription:
          "CrewCircle needs full calendar access to view when you're busy and add events to your schedule.",
        ...(googleIosUrlScheme
          ? { CFBundleURLTypes: [{ CFBundleURLSchemes: [googleIosUrlScheme] }] }
          : {}),
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./src/assets/icons/adaptive-icon.png",
        backgroundColor: "#FFFFFF",
      },
      predictiveBackGestureEnabled: false,
      package: "com.crewcircle.crewcircle",
    },
    plugins: [
      "@clerk/expo",
      "@react-native-community/datetimepicker",
      "expo-apple-authentication",
      "expo-calendar",
      "expo-image",
      "expo-router",
      "expo-secure-store",
      "expo-web-browser",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#232323",
          image: "./src/assets/icons/splash-icon-light.png",
          dark: {
            image: "./src/assets/icons/splash-icon-dark.png",
            backgroundColor: "#000000",
          },
          imageWidth: 200,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME: process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME,
    },
  },
};
