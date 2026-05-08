import { Platform } from "react-native";

import { PermissionDeniedDialog } from "./PermissionDeniedDialog";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const steps =
  Platform.OS === "ios" ? ["Toggle Camera on"] : ["Tap Permissions", "Tap Camera", "Select Allow"];

export function CameraPermissionDeniedDialog({ isOpen, onClose }: Props) {
  return (
    <PermissionDeniedDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Camera access required"
      reason="CrewCircle needs access to your camera to take a profile photo."
      steps={steps}
    />
  );
}
