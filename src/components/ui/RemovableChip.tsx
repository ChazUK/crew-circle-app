import { Chip, CloseButton } from "heroui-native";
import { View } from "react-native";

type Props = {
  label: string;
  onRemove: () => void;
  accessibilityLabel?: string;
};

export function RemovableChip({ label, onRemove, accessibilityLabel }: Props) {
  return (
    <Chip animation="disable-all" color="default" variant="soft">
      <View className="flex-row items-center gap-1 pl-1">
        <Chip.Label>{label}</Chip.Label>
        <CloseButton
          onPress={onRemove}
          accessibilityLabel={accessibilityLabel ?? `Remove ${label}`}
        />
      </View>
    </Chip>
  );
}
