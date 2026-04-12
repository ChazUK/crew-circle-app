import { Select } from "heroui-native";
import { type ReactNode, useState } from "react";
import { Text, View } from "react-native";

import { SelectSheetContent } from "./SelectSheetContent";

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
  searchable?: boolean;
  searchPlaceholder?: string;
  renderItem?: (option: PickerOption) => ReactNode;
};

export function Picker({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  label,
  listLabel,
  snapPoints = ["50%"],
  searchable = false,
  searchPlaceholder = "Search...",
  renderItem,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = value !== null ? (options.find((o) => o.value === value) ?? null) : null;

  const handleValueChange = (option: (PickerOption | undefined) | (PickerOption | undefined)[]) => {
    const opt = Array.isArray(option) ? option[0] : option;
    if (opt) onChange(opt.value);
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
        onOpenChange={setIsOpen}
        presentation="bottom-sheet"
      >
        <Select.Trigger>
          <Select.Value placeholder={placeholder} />
          <Select.TriggerIndicator />
        </Select.Trigger>
        <SelectSheetContent
          options={options}
          isOpen={isOpen}
          listLabel={listLabel}
          snapPoints={snapPoints}
          searchable={searchable}
          searchPlaceholder={searchPlaceholder}
          renderItem={renderItem}
        />
      </Select>
    </View>
  );
}
