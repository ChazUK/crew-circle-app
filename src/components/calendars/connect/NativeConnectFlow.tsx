import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { SubCalendar } from "@shared/calendars";
import { useAction } from "convex/react";
import { Button, Spinner } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { CalendarPermissionDeniedDialog } from "@/components/permissions/CalendarPermissionDeniedDialog";
import { useSubCalendarConfirm } from "@/hooks/calendars/useSubCalendarConfirm";
import { listNativeSubCalendars } from "@/lib/calendars/listNativeSubCalendars";
import { requestNativeCalendarPermission } from "@/lib/calendars/requestNativeCalendarPermission";

import { SubCalendarList } from "../SubCalendarPicker";

type Step = "idle" | "requesting-permission" | "picking-subcalendars";

type Props = {
  onBack: () => void;
};

export function NativeConnectFlow({ onBack }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [connectionId, setConnectionId] = useState<Id<"calendarConnections"> | null>(null);
  const [connectionColor, setConnectionColor] = useState<string>("#6366f1");
  const [deviceCalendars, setDeviceCalendars] = useState<SubCalendar[]>([]);

  const connectNative = useAction(api.calendars.actions.connectNative);
  const confirm = useSubCalendarConfirm(connectionId);

  const handleConnect = async () => {
    setStep("requesting-permission");
    setError(null);

    const permission = await requestNativeCalendarPermission();
    if (permission === "denied") {
      setPermissionDenied(true);
      setStep("idle");
      return;
    }

    try {
      const [result, calendars] = await Promise.all([
        connectNative({ label: "Device Calendar" }),
        listNativeSubCalendars(),
      ]);
      setConnectionId(result.connectionId);
      setConnectionColor(result.color);
      setDeviceCalendars(calendars);
      setStep("picking-subcalendars");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setStep("idle");
    }
  };

  const handleConfirm = async (selected: { externalId: string; label: string }[]) => {
    try {
      await confirm(selected);
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save calendar selection");
      setStep("idle");
    }
  };

  if (step === "picking-subcalendars" && connectionId !== null) {
    return (
      <SubCalendarList
        subCalendars={deviceCalendars}
        provider="native"
        connectionColor={connectionColor}
        onConfirm={handleConfirm}
        onBack={onBack}
      />
    );
  }

  return (
    <>
      <CalendarPermissionDeniedDialog
        isOpen={permissionDenied}
        onClose={() => setPermissionDenied(false)}
      />

      <View className="flex-1 gap-6 py-4">
        <View className="flex-row items-center gap-2 px-1">
          <Button
            variant="tertiary"
            size="sm"
            onPress={onBack}
            accessibilityLabel="Back to calendars"
          >
            ← Back
          </Button>
          <Text className="text-base font-semibold text-foreground">Device Calendar</Text>
        </View>

        <View className="items-center gap-3 py-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-default-100">
            <Text className="text-2xl">📱</Text>
          </View>
        </View>

        {error !== null && (
          <View className="rounded-lg bg-danger/10 px-3 py-2">
            <Text className="text-sm text-danger">{error}</Text>
          </View>
        )}

        {step === "requesting-permission" ? (
          <View className="items-center py-4">
            <Spinner />
          </View>
        ) : (
          <View className="gap-3">
            <Button
              onPress={handleConnect}
              className="w-full"
              accessibilityLabel="Connect Device Calendar"
            >
              Connect Device Calendar
            </Button>
            <Text className="px-1 text-center text-xs text-muted-foreground">
              We'll ask for permission to read your device calendar.
            </Text>
          </View>
        )}
      </View>
    </>
  );
}
