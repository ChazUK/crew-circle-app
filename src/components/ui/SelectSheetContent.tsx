import { BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Select } from "heroui-native";
import { type ReactNode, useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";

import { type PickerOption } from "./Picker";

type Props = {
  options: PickerOption[];
  isOpen: boolean;
  listLabel?: string;
  snapPoints?: string[];
  searchable?: boolean;
  searchPlaceholder?: string;
  renderItem?: (option: PickerOption) => ReactNode;
};

export function SelectSheetContent({
  options,
  isOpen,
  listLabel,
  snapPoints,
  searchable = false,
  searchPlaceholder = "Search...",
  renderItem,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();
  // Searchable sheets must use a fixed snap point — dynamic sizing would
  // shrink the sheet as filtered results reduce, making it unusable.
  const dynamicSizing = snapPoints === undefined && !searchable;
  const resolvedSnapPoints = dynamicSizing ? undefined : (snapPoints ?? ["70%"]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isOpen) setSearchTerm("");
  }, [isOpen]);

  const visibleOptions =
    searchable && searchTerm
      ? options.filter((o) => o.label.toLowerCase().includes(searchTerm.toLowerCase()))
      : options;

  return (
    <Select.Portal>
      <Select.Overlay />
      <Select.Content
        presentation="bottom-sheet"
        snapPoints={resolvedSnapPoints}
        enableDynamicSizing={dynamicSizing}
      >
        {listLabel ? <Select.ListLabel className="mb-2">{listLabel}</Select.ListLabel> : null}
        {searchable ? (
          <BottomSheetTextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder={searchPlaceholder}
            className="mx-4 mb-2 px-3 py-2 rounded-lg border border-default-200 text-foreground bg-default-100"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="none"
          />
        ) : null}
        <BottomSheetScrollView
          style={dynamicSizing ? { maxHeight: windowHeight * 0.7 } : undefined}
        >
          {visibleOptions.map((option) => (
            <Select.Item key={option.value} value={option.value} label={option.label}>
              {renderItem ? renderItem(option) : <Select.ItemLabel />}
              <Select.ItemIndicator />
            </Select.Item>
          ))}
        </BottomSheetScrollView>
      </Select.Content>
    </Select.Portal>
  );
}
