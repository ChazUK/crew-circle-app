import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Button } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { SelectSheet } from "./SelectSheet";

const meta = {
  title: "UI/SelectSheet",
  component: SelectSheet,
  decorators: [
    (Story) => (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView>
          <BottomSheetModalProvider>
            <View style={{ flex: 1, padding: 16, backgroundColor: "#f9f9f9" }}>
              <Story />
            </View>
          </BottomSheetModalProvider>
        </SafeAreaView>
      </GestureHandlerRootView>
    ),
  ],
  tags: ["autodocs"],
  args: {
    options: [],
    onChange: () => {},
    isOpen: false,
    onOpenChange: () => {},
  },
} satisfies Meta<typeof SelectSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

const FRUIT_OPTIONS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "grape", label: "Grape" },
  { value: "mango", label: "Mango" },
  { value: "orange", label: "Orange" },
];

const COUNTRY_OPTIONS = [
  { value: "au", label: "Australia" },
  { value: "ca", label: "Canada" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "gb", label: "United Kingdom" },
  { value: "jp", label: "Japan" },
  { value: "us", label: "United States" },
];

const ControlledRender: Story["render"] = (args) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View className="gap-3">
      <Button variant="secondary" onPress={() => setIsOpen(true)}>
        {selected ? `Selected: ${selected}` : "Open sheet"}
      </Button>
      <SelectSheet
        {...args}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onChange={(value) => {
          setSelected(value);
          setIsOpen(false);
        }}
      />
    </View>
  );
};

export const Default: Story = {
  args: { options: FRUIT_OPTIONS, listLabel: "Select a fruit" },
  render: ControlledRender,
};

export const WithSearch: Story = {
  args: {
    options: COUNTRY_OPTIONS,
    listLabel: "Select a country",
    searchable: true,
    searchPlaceholder: "Search countries...",
    snapPoints: ["60%"],
  },
  render: ControlledRender,
};

export const SmallList: Story = {
  args: {
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "maybe", label: "Maybe" },
    ],
    listLabel: "Choose an option",
  },
  render: ControlledRender,
};
