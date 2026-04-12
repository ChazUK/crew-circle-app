import type { Meta, StoryObj } from "@storybook/react-native";
import { useState } from "react";
import { View } from "react-native";

import { TagInput } from "./TagInput";

const meta = {
  title: "UI/TagInput",
  component: TagInput,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16, backgroundColor: "#f9f9f9" }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: {
    tags: [],
    onChange: () => {},
    placeholder: "Add a tag...",
  },
} satisfies Meta<typeof TagInput>;

export default meta;

type Story = StoryObj<typeof meta>;

const InteractiveRender: Story["render"] = (args) => {
  const [tags, setTags] = useState<string[]>(args.tags ?? []);
  return <TagInput {...args} tags={tags} onChange={setTags} />;
};

export const Default: Story = {
  render: InteractiveRender,
};

export const WithLabel: Story = {
  args: {
    label: "Special Skills",
    placeholder: "e.g. Drone operator",
  },
  render: InteractiveRender,
};

export const WithPrefilledTags: Story = {
  args: {
    label: "Kit",
    placeholder: "e.g. ARRI ALEXA Mini LF",
    tags: ["Sony FX6", "DJI RS 3 Pro", "Tilta Nucleus-M"],
  },
  render: InteractiveRender,
};

export const SkillsExample: Story = {
  args: {
    label: "Special Skills",
    placeholder: "Add a skill...",
    tags: ["Drone operator", "Underwater camera", "Steadicam"],
  },
  render: InteractiveRender,
};

export const EmptyWithPlaceholder: Story = {
  args: {
    placeholder: "Type a skill and press return or Add",
    tags: [],
  },
  render: InteractiveRender,
};
