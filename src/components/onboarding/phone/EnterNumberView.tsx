import { useUser } from "@clerk/expo";
import { Button, Spinner } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { PhoneNumberInput } from "@/components/form/PhoneNumberInput";
import { addAndStartVerification } from "@/lib/phone/clerk/addAndStartVerification";

const DISCLOSURE =
  "We use your phone number to help fellow crew find you and to send job alerts and time-sensitive updates. It is never shown on your profile.";

type Props = {
  onCodeSent: (e164: string) => void;
};

export function EnterNumberView({ onCodeSent }: Props) {
  const { user } = useUser();
  const [e164, setE164] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: string | null) {
    setE164(next);
    setError(null);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    if (!user) {
      setError("You must be signed in.");
      setLoading(false);
      return;
    }

    if (!e164) {
      setError("Enter a valid phone number.");
      setLoading(false);
      return;
    }

    const result = await addAndStartVerification({ user, phoneNumber: e164 });

    if (result.ok) {
      onCodeSent(e164);
    } else {
      setError(result.message);
      setLoading(false);
    }
  }

  return (
    <View className="gap-6">
      <Text className="text-4xl font-bold">Verify your phone number</Text>
      <View className="gap-3">
        <PhoneNumberInput value={e164} onChange={handleChange} isInvalid={!!error} />
        <Text className="text-sm text-muted">{DISCLOSURE}</Text>
        {error ? <Text className="text-sm text-danger">{error}</Text> : null}
      </View>
      <Button
        variant="primary"
        isDisabled={!e164 || loading}
        onPress={handleSubmit}
        accessibilityLabel="Send verification code"
      >
        {loading ? <Spinner /> : "Send code"}
      </Button>
    </View>
  );
}
