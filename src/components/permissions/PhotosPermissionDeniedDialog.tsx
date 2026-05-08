import { Platform } from "react-native";

import { PermissionDeniedDialog } from "./PermissionDeniedDialog";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const steps =
  Platform.OS === "ios"
    ? ["Tap Photos", "Select Full Access"]
    : ["Tap Permissions", "Tap Photos and videos", "Select Allow"];

export function PhotosPermissionDeniedDialog({ isOpen, onClose }: Props) {
  return (
    <PermissionDeniedDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Photo library access required"
      reason="CrewCircle needs access to your photo library to upload a profile photo."
      steps={steps}
    />
  );
}
