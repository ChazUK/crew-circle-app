import "../src/global.css";
import type { Preview } from "@storybook/react-native";
import { HeroUINativeProvider, type HeroUINativeConfig } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const config: HeroUINativeConfig = {
  devInfo: {
    stylingPrinciples: false,
  },
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story) => (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <HeroUINativeProvider config={config}>
          <Story />
        </HeroUINativeProvider>
      </GestureHandlerRootView>
    ),
  ],
};

export default preview;
