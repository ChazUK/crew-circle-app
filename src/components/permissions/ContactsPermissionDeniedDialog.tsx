import { Platform } from "react-native";

import { isContactsPermissionGranted } from "@/lib/permissions/isContactsPermissionGranted";

import {
  PermissionDeniedDialog,
  StepHighlight,
  StepTitle,
  type PermissionStep,
} from "./PermissionDeniedDialog";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const steps: PermissionStep[] =
  Platform.OS === "ios"
    ? [
        {
          title: (
            <StepTitle>
              Tap <StepHighlight>Contacts</StepHighlight>
            </StepTitle>
          ),
          description: "Look for the Contacts row in the CrewCircle list.",
        },
        {
          title: (
            <StepTitle>
              Select <StepHighlight>Full Access</StepHighlight>
            </StepTitle>
          ),
          description: "Choose Full Access so CrewCircle can find your crew.",
        },
      ]
    : [
        {
          title: (
            <StepTitle>
              Tap <StepHighlight>Permissions</StepHighlight>
            </StepTitle>
          ),
          description: "Open the Permissions section in CrewCircle's app info.",
        },
        {
          title: (
            <StepTitle>
              Tap <StepHighlight>Contacts</StepHighlight>
            </StepTitle>
          ),
          description: "Find the Contacts permission entry.",
        },
        {
          title: (
            <StepTitle>
              Select <StepHighlight>Allow</StepHighlight>
            </StepTitle>
          ),
          description: "Switch the contacts permission to Allow.",
        },
      ];

export function ContactsPermissionDeniedDialog({ isOpen, onClose }: Props) {
  return (
    <PermissionDeniedDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Contacts access required"
      reason="CrewCircle needs access to your contacts to help you find and invite the people to your circles and share job posts with them."
      steps={steps}
      checkPermission={isContactsPermissionGranted}
    />
  );
}
