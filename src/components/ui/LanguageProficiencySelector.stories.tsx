import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import type { Meta, StoryObj } from "@storybook/react-native";
import { useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { type LanguageEntry, LanguageProficiencySelector } from "./LanguageProficiencySelector";

const meta = {
  title: "UI/LanguageProficiencySelector",
  component: LanguageProficiencySelector,
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
    value: [],
    onChange: () => {},
  },
} satisfies Meta<typeof LanguageProficiencySelector>;

export default meta;

type Story = StoryObj<typeof meta>;

const InteractiveRender: Story["render"] = (args) => {
  const [value, setValue] = useState<LanguageEntry[]>(args.value);

  return <LanguageProficiencySelector {...args} value={value} onChange={setValue} />;
};

export const Empty: Story = {
  render: InteractiveRender,
};

export const SingleEntry: Story = {
  args: {
    value: [{ language: "English", proficiency: "Native" }],
  },
  render: InteractiveRender,
};

export const MultipleEntries: Story = {
  args: {
    value: [
      { language: "English", proficiency: "Native" },
      { language: "French", proficiency: "Conversational" },
      { language: "Spanish", proficiency: "Basic" },
    ],
  },
  render: InteractiveRender,
};

export const AllProficiencyLevels: Story = {
  args: {
    value: [
      { language: "English", proficiency: "Native" },
      { language: "French", proficiency: "Fluent" },
      { language: "German", proficiency: "Conversational" },
      { language: "Italian", proficiency: "Basic" },
    ],
  },
  render: InteractiveRender,
};
