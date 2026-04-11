import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Select } from "heroui-native";
import React from "react";
import { Text, View } from "react-native";

export type PickerOption = {
  value: string;
  label: string;
};

type Props = {
  value: string | null;
  onChange: (value: string) => void;
  options: PickerOption[];
  placeholder?: string;
  label?: string;
  listLabel?: string;
  snapPoints?: string[];
};

export function Picker({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  label,
  listLabel,
  snapPoints = ["50%"],
}: Props) {
  const selectedOption = value ? (options.find((o) => o.value === value) ?? null) : null;

  const handleValueChange = (option: (PickerOption | undefined) | (PickerOption | undefined)[]) => {
    const opt = Array.isArray(option) ? option[0] : option;
    if (opt?.value) onChange(opt.value);
  };

  return (
    <View>
      {label ? (
        <Text className="text-sm font-medium text-foreground mb-1.5" accessibilityRole="text">
          {label}
        </Text>
      ) : null}
      <Select
        value={selectedOption ?? undefined}
        onValueChange={handleValueChange}
        presentation="bottom-sheet"
      >
        <Select.Trigger>
          <Select.Value placeholder={placeholder} />
          <Select.TriggerIndicator />
        </Select.Trigger>
        <Select.Portal>
          <Select.Overlay />
          <Select.Content presentation="bottom-sheet" snapPoints={snapPoints}>
            {listLabel ? <Select.ListLabel className="mb-2">{listLabel}</Select.ListLabel> : null}
            <BottomSheetScrollView>
              {options.map((option) => (
                <Select.Item key={option.value} value={option.value} label={option.label} />
              ))}
            </BottomSheetScrollView>
          </Select.Content>
        </Select.Portal>
      </Select>
    </View>
  );
}
