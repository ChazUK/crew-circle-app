import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Button, Select } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { type PickerOption } from "./Picker";
import { SelectSheet } from "./SelectSheet";

const meta = {
  title: "UI/SelectSheet",
  component: SelectSheet,
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

const PRIORITY_OPTIONS: PickerOption[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const PRIORITY_EMOJI: Record<string, string> = {
  urgent: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🟢",
};

const LANGUAGE_OPTIONS: PickerOption[] = [
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "dart", label: "Dart" },
  { value: "elixir", label: "Elixir" },
  { value: "go", label: "Go" },
  { value: "haskell", label: "Haskell" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "kotlin", label: "Kotlin" },
  { value: "lua", label: "Lua" },
  { value: "ocaml", label: "OCaml" },
  { value: "php", label: "PHP" },
  { value: "python", label: "Python" },
  { value: "ruby", label: "Ruby" },
  { value: "rust", label: "Rust" },
  { value: "scala", label: "Scala" },
  { value: "swift", label: "Swift" },
  { value: "typescript", label: "TypeScript" },
  { value: "zig", label: "Zig" },
];

const ControlledRender: Story["render"] = (args) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View className="gap-3">
      <Button variant="secondary" onPress={() => setIsOpen(true)}>
        Open sheet
      </Button>
      <Text>{selected ? `Selected: ${selected}` : "No selection"}</Text>
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
  args: { options: FRUIT_OPTIONS },
  render: ControlledRender,
};

export const WithLabel: Story = {
  args: { options: FRUIT_OPTIONS, listLabel: "Select a fruit" },
  render: ControlledRender,
};

export const WithSearch: Story = {
  args: {
    options: FRUIT_OPTIONS,
    searchable: true,
    searchPlaceholder: "Search fruits...",
  },
  render: ControlledRender,
};

export const CustomRendererItems: Story = {
  args: {
    options: PRIORITY_OPTIONS,
    renderItem: (option) => (
      <View className="flex-row items-center gap-2">
        <Text>{PRIORITY_EMOJI[option.value]}</Text>
        <Select.ItemLabel />
      </View>
    ),
  },
  render: ControlledRender,
};

export const Scrollable: Story = {
  args: {
    options: LANGUAGE_OPTIONS,
  },
  render: ControlledRender,
};
