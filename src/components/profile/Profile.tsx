import type { ViewableProfile } from "@shared/profile/viewableProfile";
import { Button } from "heroui-native";
import { ScrollView } from "react-native";

import { IdentitySection } from "./sections/IdentitySection";

type Props = {
  profile: ViewableProfile;
  onEditProfile?: () => void;
};

export function Profile({ profile, onEditProfile }: Props) {
  const isSelf = profile.mode === "self" || profile.mode === "pm-self";
  const showEdit = isSelf && onEditProfile !== undefined;

  return (
    <ScrollView contentContainerClassName="gap-4 p-4">
      {showEdit ? (
        <Button variant="secondary" onPress={onEditProfile} className="w-full">
          <Button.Label>Edit Profile</Button.Label>
        </Button>
      ) : null}
      <IdentitySection profile={profile} />
    </ScrollView>
  );
}
