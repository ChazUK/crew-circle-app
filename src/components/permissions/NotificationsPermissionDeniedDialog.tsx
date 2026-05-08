import { Platform } from "react-native";

import { PermissionDeniedDialog } from "./PermissionDeniedDialog";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const steps =
  Platform.OS === "ios"
    ? ["Tap Notifications", "Turn on Allow Notifications"]
    : ["Tap Notifications", "Turn on All notifications"];

export function NotificationsPermissionDeniedDialog({ isOpen, onClose }: Props) {
  return (
    <PermissionDeniedDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Notifications disabled"
      reason="CrewCircle uses notifications to let you know when crew members respond to invitations and when shared events change."
      steps={steps}
    />
  );
}
