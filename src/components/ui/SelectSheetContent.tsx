import { BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import {
  ScrollShadow,
  SearchField,
  Select,
  useBottomSheetAwareHandlers,
  useThemeColor,
} from "heroui-native";
import { Fragment, type ReactNode, useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import { type PickerOption } from "./Picker";

type Props = {
  options: PickerOption[];
  isOpen: boolean;
  scrollable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  snapPoints?: string[];
  filterFn?: (option: PickerOption, searchValue: string) => boolean;
  renderItem?: (option: PickerOption) => ReactNode;
};

export const SelectSheetContent = ({
  options,
  isOpen,
  scrollable = false,
  searchable = false,
  searchPlaceholder,
  snapPoints,
  filterFn,
  renderItem,
}: Props) => {
  const [searchValue, setSearchValue] = useState("");
  const dynamicSizing = snapPoints === undefined && !scrollable;
  const resolvedSnapPoints = dynamicSizing ? undefined : (snapPoints ?? ["60%", "90%"]);

  const defaultFilterFn = (option: PickerOption, searchValue: string) => {
    return option.label.toLowerCase().includes(searchValue.toLowerCase());
  };

  useEffect(() => {
    if (!isOpen) setSearchValue("");
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const q = searchValue.trim();

    if (!q) return options;

    const filter = filterFn || defaultFilterFn;
    return options.filter((option) => filter(option, q));
  }, [searchValue, options, filterFn]);

  return (
    <Select.Content
      presentation="bottom-sheet"
      snapPoints={resolvedSnapPoints}
      keyboardBehavior="extend"
      enableDynamicSizing={dynamicSizing}
      enableOverDrag={false}
      contentContainerClassName="flex-1 h-full"
    >
      <View>
        {searchable ? (
          <BottomSheetSearchField
            value={searchValue}
            onChange={setSearchValue}
            placeholder={searchPlaceholder}
          />
        ) : null}
        <BottomSheetContentView scrollable={scrollable}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <Fragment key={option.value}>
                <Select.Item value={option.value} label={option.label}>
                  {renderItem ? renderItem(option) : <Select.ItemLabel />}
                  <Select.ItemIndicator />
                </Select.Item>
              </Fragment>
            ))
          ) : (
            <View className="items-center justify-center py-10">
              <Select.ListLabel className="text-muted">
                No results for "{searchValue}"
              </Select.ListLabel>
            </View>
          )}
        </BottomSheetContentView>
      </View>
    </Select.Content>
  );
};

const BottomSheetContentView = ({
  scrollable,
  children,
}: {
  scrollable: boolean;
  children: ReactNode;
}) => {
  const themeColorOverlay = useThemeColor("overlay");

  if (scrollable) {
    return (
      <ScrollShadow LinearGradientComponent={LinearGradient} color={themeColorOverlay}>
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {children}
        </BottomSheetScrollView>
      </ScrollShadow>
    );
  }

  return <BottomSheetView className="pb-8 px-4">{children}</BottomSheetView>;
};

const BottomSheetSearchField = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  return (
    <SearchField value={value} onChange={onChange} className="mb-3 px-4 pt-3">
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input
          autoCapitalize="sentences"
          autoCorrect={true}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
        />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
};
