import type { Meta, StoryObj } from "@storybook/react-native";
import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  LinkButton,
  Separator,
  TextField,
} from "heroui-native";
import { View } from "react-native";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

import { VerifyCodeScreen } from "@/components/ui/VerifyCodeScreen";

// The sign-in page depends on Clerk and Expo Router providers unavailable in Storybook.
// These stand-ins render the visual states so reviewers can inspect appearance without
// running a live auth flow.

const StyledSafeAreaView = withUniwind(SafeAreaView);

function OrDivider() {
  return (
    <View className="flex-row items-center">
      <Separator />
      <Text className="mx-2 text-muted">OR</Text>
      <Separator />
    </View>
  );
}

function SignInFormVisual({
  emailAddress = "",
  password = "",
  globalError,
  identifierError,
  passwordError,
  isSubmitting = false,
}: {
  emailAddress?: string;
  password?: string;
  globalError?: string;
  identifierError?: string;
  passwordError?: string;
  isSubmitting?: boolean;
}) {
  return (
    <StyledSafeAreaView className="flex-1">
      <View className="flex-1 justify-center gap-6">
        <View className="mx-4">
          <Text className="text-4xl mb-2 font-bold leading-none">Welcome back</Text>
          <Text className="text-base">
            Sign in to pick up your next shift, find a replacement, or manage your crew.
          </Text>
        </View>

        <View className="gap-4 mx-4">
          <Card className="gap-4">
            <Card.Body className="gap-4">
              <TextField isInvalid={!!identifierError}>
                <Label>Email</Label>
                <Input
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  value={emailAddress}
                  onChangeText={() => {}}
                  keyboardType="email-address"
                />
                <FieldError isInvalid={!!identifierError}>{identifierError}</FieldError>
              </TextField>

              <TextField isRequired isInvalid={!!passwordError}>
                <View className="flex-row justify-between items-center">
                  <Label>Password</Label>
                  <LinkButton size="sm">
                    <LinkButton.Label className="text-accent">Forgot password?</LinkButton.Label>
                  </LinkButton>
                </View>
                <Input
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  value={password}
                  secureTextEntry
                  onChangeText={() => {}}
                />
                <FieldError isInvalid={!!passwordError}>{passwordError}</FieldError>
              </TextField>
            </Card.Body>

            <Card.Footer className="flex-col gap-4">
              {globalError && <Text className="text-danger text-sm text-left">{globalError}</Text>}
              <Button
                variant="primary"
                onPress={() => {}}
                isDisabled={!emailAddress || !password || isSubmitting}
                className="w-full"
              >
                Sign In
              </Button>
            </Card.Footer>
          </Card>

          <OrDivider />
          <Button variant="outline" className="w-full" onPress={() => {}}>
            <Button.Label>Sign in with Google</Button.Label>
          </Button>
          <Button variant="outline" className="w-full" onPress={() => {}}>
            <Button.Label>Sign in with Apple</Button.Label>
          </Button>
        </View>
      </View>

      <View className="items-end flex-row gap-1 justify-center">
        <Text className="text-base text-muted">Don't have an account?</Text>
        <LinkButton>
          <LinkButton.Label className="text-accent">Sign up</LinkButton.Label>
        </LinkButton>
      </View>
    </StyledSafeAreaView>
  );
}

const meta = {
  title: "Auth/SignInPage",
  component: SignInFormVisual,
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof SignInFormVisual>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithEmailEntered: Story = {
  args: {
    emailAddress: "crew@example.com",
  },
};

export const WithCredentials: Story = {
  args: {
    emailAddress: "crew@example.com",
    password: "password123",
  },
};

export const IdentifierError: Story = {
  args: {
    emailAddress: "notfound@example.com",
    identifierError: "Couldn't find your account.",
  },
};

export const PasswordError: Story = {
  args: {
    emailAddress: "crew@example.com",
    password: "wrongpass",
    passwordError: "Password is incorrect. Try again, or use another method.",
  },
};

export const GlobalError: Story = {
  args: {
    emailAddress: "crew@example.com",
    password: "wrongpass",
    globalError: "Too many failed attempts. Please try again later.",
  },
};

export const Submitting: Story = {
  args: {
    emailAddress: "crew@example.com",
    password: "password123",
    isSubmitting: true,
  },
};

export const TwoFactorTOTP: Story = {
  render: () => (
    <StyledSafeAreaView className="flex-1">
      <View className="flex-1 gap-6">
        <VerifyCodeScreen
          title="Two-factor authentication"
          subtitle="Enter the 6-digit code from your authenticator app"
          value=""
          onChange={() => {}}
          onBlur={() => {}}
          onSubmit={() => {}}
          isLoading={false}
          isDisabled={false}
        />
      </View>
    </StyledSafeAreaView>
  ),
};

export const TwoFactorEmailCode: Story = {
  render: () => (
    <StyledSafeAreaView className="flex-1">
      <View className="flex-1 gap-6">
        <VerifyCodeScreen
          title="Two-factor authentication"
          subtitle="Enter the 6-digit code sent to your email"
          value=""
          onChange={() => {}}
          onBlur={() => {}}
          onSubmit={() => {}}
          isLoading={false}
          isDisabled={false}
          onResend={() => {}}
        />
      </View>
    </StyledSafeAreaView>
  ),
};

export const TwoFactorPhoneCode: Story = {
  render: () => (
    <StyledSafeAreaView className="flex-1">
      <View className="flex-1 gap-6">
        <VerifyCodeScreen
          title="Two-factor authentication"
          subtitle="Enter the 6-digit code sent to your phone"
          value=""
          onChange={() => {}}
          onBlur={() => {}}
          onSubmit={() => {}}
          isLoading={false}
          isDisabled={false}
          onResend={() => {}}
        />
      </View>
    </StyledSafeAreaView>
  ),
};

export const ClientTrust: Story = {
  render: () => (
    <StyledSafeAreaView className="flex-1">
      <View className="flex-1 gap-6">
        <VerifyCodeScreen
          title="Verify your account"
          subtitle="Enter the 6-digit code sent to your email"
          value=""
          onChange={() => {}}
          onBlur={() => {}}
          onSubmit={() => {}}
          isLoading={false}
          isDisabled={false}
          onResend={() => {}}
        />
      </View>
    </StyledSafeAreaView>
  ),
};
