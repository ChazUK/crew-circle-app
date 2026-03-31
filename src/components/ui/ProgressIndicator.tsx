import React from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  currentStep: number;
  totalSteps: number;
};

export function ProgressIndicator({ currentStep, totalSteps }: Props) {
  const safeTotalSteps = Math.min(5, Math.max(1, Math.trunc(totalSteps)));
  const safeCurrentStep = Math.min(safeTotalSteps, Math.max(1, Math.trunc(currentStep)));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${safeCurrentStep} of ${safeTotalSteps}`}
      accessibilityValue={{ min: 1, max: safeTotalSteps, now: safeCurrentStep }}
      style={styles.container}
    >
      {Array.from({ length: safeTotalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < safeCurrentStep;
        const isActive = step === safeCurrentStep;

        return (
          <View
            key={step}
            style={[
              styles.dot,
              isCompleted && styles.dotCompleted,
              isActive && styles.dotActive,
              !isCompleted && !isActive && styles.dotUpcoming,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotCompleted: {
    backgroundColor: "#0a7ea4",
  },
  dotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0a7ea4",
    opacity: 1,
  },
  dotUpcoming: {
    backgroundColor: "#ccc",
  },
});
