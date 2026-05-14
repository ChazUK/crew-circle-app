import { Button } from "heroui-native";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { reportError } from "@/lib/observability/reportError";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export type ErrorFallbackProps = {
  onReset: () => void;
};

export function ErrorFallback({ onReset }: ErrorFallbackProps) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold mb-3 text-center" accessibilityRole="header">
          Something went wrong
        </Text>
        <Text className="text-base text-center mb-8 text-default-500">
          An unexpected error occurred. Please try again.
        </Text>
        <Button variant="primary" onPress={onReset} accessibilityLabel="Try again">
          Try again
        </Button>
      </View>
    </SafeAreaView>
  );
}

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    reportError(error, {
      tags: { area: "ui.errorBoundary" },
      extra: { componentStack: info.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
