import type { Id } from "@convex/_generated/dataModel";
import type { ViewableProfile } from "@shared/profile/viewableProfile";
import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { LinksSection } from "./LinksSection";

const baseCrew = {
  userId: "user_1" as Id<"users">,
  firstName: "Ada",
  lastName: "Lovelace",
  profilePictureUrl: undefined,
  userType: "crew" as const,
  nickname: undefined,
  department: "Camera" as const,
  roles: ["Director of Photography"],
  bio: undefined,
};

const selfWithBoth: ViewableProfile = {
  mode: "self",
  ...baseCrew,
  website: "https://adalovelace.com",
  imdbId: "nm0000123",
};

const selfWithWebsiteOnly: ViewableProfile = {
  mode: "self",
  ...baseCrew,
  website: "https://adalovelace.com",
  imdbId: undefined,
};

const selfEmpty: ViewableProfile = {
  mode: "self",
  ...baseCrew,
  website: undefined,
  imdbId: undefined,
};

const contactWithBoth: ViewableProfile = {
  mode: "contact",
  ...baseCrew,
  website: "https://adalovelace.com",
  imdbId: "nm0000123",
};

const meta = {
  title: "Profile/LinksSection",
  component: LinksSection,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, padding: 16 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
  args: { profile: selfWithBoth },
} satisfies Meta<typeof LinksSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SelfWithBoth: Story = { args: { profile: selfWithBoth } };
export const SelfWithWebsiteOnly: Story = { args: { profile: selfWithWebsiteOnly } };
export const SelfEmpty: Story = { args: { profile: selfEmpty } };
export const ContactWithBoth: Story = { args: { profile: contactWithBoth } };
