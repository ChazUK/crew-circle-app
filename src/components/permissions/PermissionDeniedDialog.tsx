import { Button, Dialog } from "heroui-native";
import { Linking, Text, View } from "react-native";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  reason: string;
  steps: string[];
};

export function PermissionDeniedDialog({ isOpen, onClose, title, reason, steps }: Props) {
  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <View className="mb-4 gap-1.5">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Description className="text-sm">{reason}</Dialog.Description>
          </View>

          <View className="mb-5 gap-3">
            <Step number={1}>
              <Button
                size="sm"
                onPress={async () => {
                  await Linking.openSettings();
                }}
                accessibilityLabel="Open Settings"
              >
                Open Settings
              </Button>
            </Step>
            {steps.map((step, i) => (
              <Step key={step} number={i + 2}>
                <Text className="text-sm text-foreground">{step}</Text>
              </Step>
            ))}
          </View>

          <View className="flex-row justify-end">
            <Button size="sm" variant="tertiary" onPress={onClose} accessibilityLabel="Done">
              Done
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-6 w-6 items-center justify-center rounded-full bg-default-100">
        <Text className="text-xs font-semibold text-foreground">{number}</Text>
      </View>
      <View className="flex-1">{children}</View>
    </View>
  );
}
