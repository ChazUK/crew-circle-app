import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { ProgressIndicator } from "./ProgressIndicator";

const meta = {
  title: "UI/ProgressIndicator",
  component: ProgressIndicator,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: {
    totalSteps: 5,
    currentStep: 1,
  },
} satisfies Meta<typeof ProgressIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FirstStep: Story = {
  args: {
    currentStep: 1,
    totalSteps: 5,
  },
};

export const MiddleStep: Story = {
  args: {
    currentStep: 3,
    totalSteps: 5,
  },
};

export const LastStep: Story = {
  args: {
    currentStep: 5,
    totalSteps: 5,
  },
};

export const ThreeSteps: Story = {
  args: {
    currentStep: 2,
    totalSteps: 3,
  },
};
