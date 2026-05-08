import { Platform } from "react-native";

import { PermissionDeniedDialog } from "./PermissionDeniedDialog";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const steps =
  Platform.OS === "ios"
    ? ["Tap Calendars", "Select Full Access"]
    : ["Tap Permissions", "Tap Calendar", "Select Allow"];

export function CalendarPermissionDeniedDialog({ isOpen, onClose }: Props) {
  return (
    <PermissionDeniedDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Calendar access required"
      reason="CrewCircle needs full calendar access to view when you're busy and add events to your schedule."
      steps={steps}
    />
  );
}
