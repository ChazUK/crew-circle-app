import { isClerkAPIResponseError, useUser } from "@clerk/expo";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "expo-router";
import { Button, Card, FieldError, Input, Label, TextField } from "heroui-native";
import { TriangleAlertIcon } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

const CONSEQUENCES = [
  "Your profile, availability, and diary are permanently removed.",
  "You're removed from every Circle you belong to. Circles you own pass to the next admin, or are deleted if there isn't one.",
  "Pending job requests sent to you are cancelled and the sender is notified.",
  "This can't be undone — there is no recovery window.",
];

export default function DeleteAccount() {
  const router = useRouter();
  const { user } = useUser();
  const [globalError, setGlobalError] = useState<string | undefined>();

  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const form = useForm({
    defaultValues: { confirmEmail: "" },
    onSubmit: async () => {
      if (!user) return;
      setGlobalError(undefined);

      try {
        await user.delete();
        router.replace("/");
      } catch (err) {
        if (isClerkAPIResponseError(err)) {
          setGlobalError(err.errors[0]?.longMessage ?? err.errors[0]?.message);
        } else {
          setGlobalError("Something went wrong. Please try again.");
        }
      }
    },
  });

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-4 gap-6">
      <Card className="bg-danger-50 border-danger-200">
        <Card.Body className="gap-3">
          <View className="flex-row items-start gap-3">
            <TriangleAlertIcon size={20} className="text-danger mt-0.5" />
            <Text className="flex-1 text-base font-semibold text-danger">
              This is permanent. Take a moment to read what will happen.
            </Text>
          </View>

          <View className="gap-2 pl-8">
            {CONSEQUENCES.map((line) => (
              <View key={line} className="flex-row gap-2">
                <Text className="text-danger">•</Text>
                <Text className="flex-1 text-sm text-danger">{line}</Text>
              </View>
            ))}
          </View>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body className="gap-4">
          <View className="gap-1">
            <Text className="text-base font-semibold">Confirm your email to continue</Text>
            <Text className="text-sm text-muted">
              Type <Text className="font-semibold">{email}</Text> to confirm.
            </Text>
          </View>

          <form.Field
            name="confirmEmail"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Required";
                if (value.trim().toLowerCase() !== email.toLowerCase()) {
                  return "Email doesn't match";
                }
                return undefined;
              },
            }}
          >
            {(field) => {
              const showError = field.state.meta.isTouched && !!field.state.meta.errors.length;
              return (
                <TextField isRequired isInvalid={showError}>
                  <Label>Email address</Label>
                  <Input
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    keyboardType="email-address"
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    returnKeyType="send"
                  />
                  <FieldError isInvalid={showError}>{field.state.meta.errors[0]}</FieldError>
                </TextField>
              );
            }}
          </form.Field>
        </Card.Body>

        <Card.Footer className="flex-col gap-4">
          {globalError && <Text className="text-danger text-sm">{globalError}</Text>}

          <form.Subscribe selector={(state) => [state.isSubmitting, state.values, state.canSubmit]}>
            {([isSubmitting, values, canSubmit]) => {
              const { confirmEmail } = values as { confirmEmail: string };
              const matches = confirmEmail.trim().toLowerCase() === email.toLowerCase();
              const isDisabled = !email || !matches || !canSubmit || !!isSubmitting;

              return (
                <Button
                  variant="danger"
                  onPress={() => form.handleSubmit()}
                  isDisabled={isDisabled}
                  className="w-full"
                >
                  {isSubmitting ? "Deleting account..." : "Delete account permanently"}
                </Button>
              );
            }}
          </form.Subscribe>

          <Button variant="ghost" onPress={() => router.back()} className="w-full">
            Cancel
          </Button>
        </Card.Footer>
      </Card>
    </ScrollView>
  );
}
