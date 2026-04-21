import { Image } from "expo-image";
import { Text, View } from "react-native";

export function LogoMark() {
  return (
    <View className="items-center justify-center flex-row gap-0">
      <Image
        source={require("@/assets/icons/splash-icon-dark.png")}
        style={{ width: 40, height: 40 }}
      />
      <Text className="ml-2 text-xl font-bold">CrewCircle</Text>
    </View>
  );
}
