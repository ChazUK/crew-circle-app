import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalendarConnectionsSheet } from "@/components/ui/CalendarConnectionsSheet";
import { GearIcon } from "@/components/ui/icons/GearIcon";

const today = new Date().toISOString().split("T")[0];

function startOfDayMs(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

function formatTimeRange(startsAt: number, endsAt: number, isAllDay: boolean): string {
  if (isAllDay) return "All day";
  const start = format(new Date(startsAt), "HH:mm");
  const end = format(new Date(endsAt), "HH:mm");
  return `${start} – ${end}`;
}

export default function Diary() {
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const { startsAtMs, endsAtMs } = useMemo(() => {
    const start = startOfDayMs(selectedDate);
    return { startsAtMs: start, endsAtMs: start + 24 * 60 * 60 * 1000 };
  }, [selectedDate]);

  const events = useQuery(api.calendars.queries.listEventsInRange, {
    startsAtMs,
    endsAtMs,
  });

  const sortedEvents = useMemo(
    () => (events ? [...events].sort((a, b) => a.startsAt - b.startsAt) : undefined),
    [events],
  );

  return (
    <ScrollView style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-1">
        <View className="flex-row items-center justify-between px-4">
          <Text className="text-2xl font-bold text-foreground">My Diary</Text>
          <Pressable
            onPress={() => setIsConnectionsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Link external calendars"
            hitSlop={10}
            className="p-1"
          >
            <GearIcon size={22} />
          </Pressable>
        </View>

        <Calendar
          current={today}
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: { selected: true, selectedColor: "#6366f1" },
          }}
          theme={{
            backgroundColor: "transparent",
            calendarBackground: "transparent",
            selectedDayBackgroundColor: "#6366f1",
            selectedDayTextColor: "#ffffff",
            todayTextColor: "#6366f1",
            dayTextColor: "#1f2937",
            textDisabledColor: "#d1d5db",
            monthTextColor: "#1f2937",
            arrowColor: "#6366f1",
            textDayFontWeight: "400",
            textMonthFontWeight: "600",
            textDayHeaderFontWeight: "500",
          }}
          style={{ marginHorizontal: 8 }}
        />

        <View className="px-4 mt-4">
          <Text className="text-sm text-foreground/60">
            {format(new Date(selectedDate), "EEEE")}
          </Text>
          <Text className="text-sm text-foreground/60">
            {format(new Date(selectedDate), "d MMMM")}
          </Text>
        </View>

        <View className="px-4 mt-4 mb-8 gap-2">
          {sortedEvents === undefined ? (
            <Text className="text-sm text-foreground/60">Loading events…</Text>
          ) : sortedEvents.length === 0 ? (
            <Text className="text-sm text-foreground/60">No events for this day.</Text>
          ) : (
            sortedEvents.map((event) => (
              <View
                key={event._id}
                className="rounded-xl border border-default-200 bg-default-100/50 p-3"
              >
                <Text className="text-xs font-semibold uppercase text-foreground/60">
                  {formatTimeRange(event.startsAt, event.endsAt, event.isAllDay)}
                </Text>
                <Text className="text-base font-medium text-foreground" numberOfLines={2}>
                  {event.title}
                </Text>
                {event.location ? (
                  <Text className="text-xs text-foreground/60" numberOfLines={1}>
                    {event.location}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </View>
      <CalendarConnectionsSheet isOpen={isConnectionsOpen} onOpenChange={setIsConnectionsOpen} />
    </ScrollView>
  );
}
