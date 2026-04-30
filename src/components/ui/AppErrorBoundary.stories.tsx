import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { AppErrorBoundary, ErrorFallback } from "./AppErrorBoundary";

const meta = {
  title: "UI/AppErrorBoundary",
  component: ErrorFallback,
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: {
    onReset: () => {},
  },
} satisfies Meta<typeof ErrorFallback>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FallbackScreen: Story = {};

export const FallbackWithResetCallback: Story = {
  args: {
    onReset: () => {
      // no-op: demonstrates callback wiring
    },
  },
};

// Demonstrates the boundary wrapping healthy children (no error state)
export const WithHealthyChildren: StoryObj<typeof AppErrorBoundary> = {
  render: () => (
    <AppErrorBoundary>
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        accessible
        accessibilityLabel="Healthy child content"
      />
    </AppErrorBoundary>
  ),
};
