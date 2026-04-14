import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Button, Select } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { SelectSheetContent } from "./SelectSheetContent";

const meta = {
  title: "UI/SelectSheetContent",
  component: SelectSheetContent,
  decorators: [
    (Story) => (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <View style={{ flex: 1, padding: 16, backgroundColor: "#f9f9f9" }}>
            <Story />
          </View>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    ),
  ],
  tags: ["autodocs"],
  args: {
    options: [],
    isOpen: false,
  },
} satisfies Meta<typeof SelectSheetContent>;

export default meta;

type Story = StoryObj<typeof meta>;

const COUNTRY_OPTIONS = [
  { value: "au", label: "Australia" },
  { value: "ca", label: "Canada" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "gb", label: "United Kingdom" },
  { value: "jp", label: "Japan" },
  { value: "nz", label: "New Zealand" },
  { value: "us", label: "United States" },
];

const ControlledRender: Story["render"] = (args) => {
  return (
    <Select presentation="bottom-sheet" className="flex-1">
      <Select.Trigger>
        <Select.Value placeholder="Select..." />
        <Select.TriggerIndicator />
      </Select.Trigger>
      <Select.Portal>
        <Select.Overlay className="bg-black/10" />
        <SelectSheetContent {...args} />
      </Select.Portal>
    </Select>
  );
};

export const Default: Story = {
  args: {
    options: COUNTRY_OPTIONS,
  },
  render: ControlledRender,
};

export const ShortList: Story = {
  args: {
    options: [
      { value: "1", label: "Option 1" },
      { value: "2", label: "Option 2" },
      { value: "3", label: "Option 3" },
    ],
  },
  render: ControlledRender,
};

export const LongList: Story = {
  args: {
    scrollable: true,
    options: Array.from({ length: 100 }, (_, i) => ({
      value: `item-${i}`,
      label: `Item ${i}`,
    })),
  },
  render: ControlledRender,
};

export const Searchable: Story = {
  args: {
    options: COUNTRY_OPTIONS,
    searchable: true,
  },
  render: ControlledRender,
};

export const WithSearchPlaceholder: Story = {
  args: {
    options: COUNTRY_OPTIONS,
    searchable: true,
    searchPlaceholder: "Search countries...",
  },
  render: ControlledRender,
};

export const WithCustomRender: Story = {
  args: {
    options: COUNTRY_OPTIONS,
    renderItem: (option) => (
      <View className="flex-row items-center gap-2">
        <Text>{option.value.toUpperCase()}</Text>
        <Select.ItemLabel />
      </View>
    ),
  },
  render: ControlledRender,
};

export const WithCustomFilter: Story = {
  args: {
    options: COUNTRY_OPTIONS,
    searchable: true,
    filterFn: (option, searchValue) => {
      const search = searchValue.toLowerCase();

      return [option.value, option.label].some((field) => field.toLowerCase().includes(search));
    },
  },
  render: ControlledRender,
};
