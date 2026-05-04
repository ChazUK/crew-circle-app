import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import type { Meta, StoryObj } from "@storybook/react-native";
import { useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { CountrySelect } from "./CountrySelect";

const meta = {
  title: "UI/Phone/CountrySelect",
  component: CountrySelect,
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
    value: "GB",
    onChange: () => {},
    disabled: false,
  },
} satisfies Meta<typeof CountrySelect>;

export default meta;

type Story = StoryObj<typeof meta>;

const InteractiveRender: Story["render"] = (args) => {
  const [selected, setSelected] = useState(args.value);
  return <CountrySelect {...args} value={selected} onChange={setSelected} />;
};

export const Default: Story = {
  render: InteractiveRender,
};

export const UnitedStates: Story = {
  render: InteractiveRender,
  args: {
    value: "US",
  },
};

export const France: Story = {
  render: InteractiveRender,
  args: {
    value: "FR",
  },
};

export const Disabled: Story = {
  args: {
    value: "GB",
    disabled: true,
  },
};

export const NoSelection: Story = {
  render: InteractiveRender,
  args: {
    value: "XX",
  },
};
