import { useClerk, useUser } from "@clerk/expo";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { layout } from "@/styles/layout";

export default function Home() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <View style={layout.centered}>
      <Text>Welcome to CrewCircle!</Text>
      <Text>Hello {user?.emailAddresses[0].emailAddress}</Text>
      <Pressable onPress={() => signOut()}>
        <Text>Sign out</Text>
      </Pressable>
      {__DEV__ && <Link href="/storybook">Open Storybook</Link>}
    </View>
  );
}
