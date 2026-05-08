import { Button, Dialog } from "heroui-native";
import type { LucideIcon } from "lucide-react-native";
import { CheckIcon } from "lucide-react-native";
import { Text, View } from "react-native";

export type PermissionBenefit = {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  title: string;
  reason: string;
  benefits: PermissionBenefit[];
  continueLabel?: string;
  cancelLabel?: string;
};

export function PermissionRequestDialog({
  isOpen,
  onClose,
  onContinue,
  title,
  reason,
  benefits,
  continueLabel = "Continue",
  cancelLabel = "Not now",
}: Props) {
  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="gap-4">
          <Dialog.Close className="absolute top-3 right-2.5 z-50" variant="ghost" />
          <View className="gap-1">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Description className="text-sm">{reason}</Dialog.Description>
          </View>

          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What you'll get
          </Text>

          <View className="gap-3">
            {benefits.map((benefit, i) => (
              <BenefitRow
                key={i}
                title={benefit.title}
                description={benefit.description}
                icon={benefit.icon}
              />
            ))}
          </View>

          <View className="mt-2 gap-2">
            <Button
              onPress={() => {
                onClose();
                onContinue();
              }}
              accessibilityLabel={continueLabel}
            >
              {continueLabel}
            </Button>
            <Button variant="tertiary" onPress={onClose} accessibilityLabel={cancelLabel}>
              {cancelLabel}
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

type BenefitRowProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
};

function BenefitRow({ title, description, icon: Icon = CheckIcon }: BenefitRowProps) {
  return (
    <View className="flex-row gap-3">
      <View className="h-7 w-7 items-center justify-center rounded-full bg-accent">
        <Icon size={14} color="white" />
      </View>
      <View className="flex-1 gap-0.5">
        {typeof title === "string" ? (
          <Text className="text-base font-semibold text-foreground">{title}</Text>
        ) : (
          title
        )}
        {description !== undefined ? (
          typeof description === "string" ? (
            <Text className="text-sm leading-5 text-muted-foreground">{description}</Text>
          ) : (
            description
          )
        ) : null}
      </View>
    </View>
  );
}
