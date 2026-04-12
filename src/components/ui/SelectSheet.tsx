import { Select } from "heroui-native";
import { type ReactNode } from "react";

import { type PickerOption } from "./Picker";
import { SelectSheetContent } from "./SelectSheetContent";

type Props = {
  options: PickerOption[];
  onChange: (value: string) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  listLabel?: string;
  snapPoints?: string[];
  searchable?: boolean;
  searchPlaceholder?: string;
  renderItem?: (option: PickerOption) => ReactNode;
};

export function SelectSheet({
  options,
  onChange,
  isOpen,
  onOpenChange,
  listLabel,
  snapPoints,
  searchable = false,
  searchPlaceholder = "Search...",
  renderItem,
}: Props) {
  const handleValueChange = (option: (PickerOption | undefined) | (PickerOption | undefined)[]) => {
    const opt = Array.isArray(option) ? option[0] : option;
    if (opt) onChange(opt.value);
  };

  return (
    <Select
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onValueChange={handleValueChange}
      presentation="bottom-sheet"
    >
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
  );
}
