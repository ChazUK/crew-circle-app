import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { ListGroup, PressableFeedback, Spinner } from "heroui-native";
import { ChevronRightIcon, UserIcon } from "lucide-react-native";
import { ScrollView, View } from "react-native";

import { Title } from "@/components/ui/Title";

export default function EditProfileHubScreen() {
  const router = useRouter();
  const profile = useQuery(api.users.queries.getMyProfile);

  if (profile === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }

  if (profile === null) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Title title="Sign in to edit your profile" />
      </View>
    );
  }

  const identityPreview = profile.nickname ?? "Not added";

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4">
      <ListGroup>
        <PressableFeedback animation={false} onPress={() => router.push("/profile/edit/identity")}>
          <PressableFeedback.Scale>
            <ListGroup.Item>
              <ListGroup.ItemPrefix>
                <UserIcon size={20} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Identity</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>{identityPreview}</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <ChevronRightIcon size={16} />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </PressableFeedback.Scale>
        </PressableFeedback>
      </ListGroup>
    </ScrollView>
  );
}
