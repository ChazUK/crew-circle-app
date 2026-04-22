import { useAuth, useSignUp } from "@clerk/expo";
import { useForm } from "@tanstack/react-form";
import { Button } from "heroui-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

import { ProgressIndicator } from "@/components/ui/ProgressIndicator";

const StyledSafeAreaView = withUniwind(SafeAreaView);
const totalSteps = 5;

export default function Page() {
  const [currentStep, setCurrentStep] = useState(1);
  const { signUp, errors: clerkErrors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    return () => {
      signUp.reset();
    };
  }, []);

  return (
    <StyledSafeAreaView className="flex-1">
      <View className="flex-row gap-4 mx-4 my-4">
        <Pressable onPress={() => setCurrentStep((prev) => Math.max(1, prev - 1))}>
          <Text>Back</Text>
        </Pressable>
        <ProgressIndicator className="flex-1" currentStep={currentStep} totalSteps={totalSteps} />
      </View>
      <ScrollView contentContainerStyle={{ flex: 1, flexDirection: "column" }}></ScrollView>
      <Button
        className="mx-4"
        isDisabled={currentStep >= totalSteps}
        onPress={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1))}
      >
        Continue
      </Button>
    </StyledSafeAreaView>
  );
}
