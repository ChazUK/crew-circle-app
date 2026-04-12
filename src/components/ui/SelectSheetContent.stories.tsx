import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Button, Select } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";
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

const SKILL_OPTIONS = [
  { value: "drone", label: "Drone operator" },
  { value: "steadicam", label: "Steadicam" },
  { value: "underwater", label: "Underwater camera" },
  { value: "aerial", label: "Aerial photography" },
  { value: "timelapse", label: "Timelapse" },
];

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
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View className="gap-3">
      <Button variant="secondary" onPress={() => setIsOpen(true)}>
        {selected ? `Selected: ${selected}` : "Open sheet"}
      </Button>
      <Select
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onValueChange={(opt) => {
          const o = Array.isArray(opt) ? opt[0] : opt;
          if (o) {
            setSelected(o.value);
            setIsOpen(false);
          }
        }}
        presentation="bottom-sheet"
      >
        <SelectSheetContent {...args} isOpen={isOpen} />
      </Select>
    </View>
  );
};

export const Default: Story = {
  args: { options: SKILL_OPTIONS, listLabel: "Select a skill" },
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

export const SmallSnapPoint: Story = {
  args: {
    options: SKILL_OPTIONS,
    listLabel: "Select a skill",
    snapPoints: ["30%"],
  },
  render: ControlledRender,
};
