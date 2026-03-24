import { Text, View } from "react-native";

import { layout } from "@/styles/layout";

export default function WelcomeScreen() {
  return (
    <View style={layout.centered}>
      <Text>Welcome to CircleCrew!</Text>
    </View>
  );
}
