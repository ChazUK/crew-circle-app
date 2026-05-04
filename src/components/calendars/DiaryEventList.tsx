import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { addDays, format, parseISO, startOfDay } from "date-fns";
import { Spinner } from "heroui-native";
import { Text, View } from "react-native";

export type DiaryEvent = {
  _id: string;
  title: string;
  startsAt: number;
  endsAt: number;
  isAllDay: boolean;
  color: string;
};

type ContentProps = {
  events: DiaryEvent[] | undefined;
};

export function DiaryEventListContent({ events }: ContentProps) {
  if (events === undefined) {
    return (
      <View className="items-center py-8">
        <Spinner />
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-sm text-foreground/60">No events</Text>
      </View>
    );
  }

  return (
    <View className="gap-1">
      {events.map((event) => (
        <View key={event._id} className="flex-row items-start gap-3 px-4 py-2">
          <View
            style={{
              backgroundColor: event.color,
              width: 8,
              height: 8,
              borderRadius: 4,
              marginTop: 5,
              flexShrink: 0,
            }}
            accessibilityLabel={`Calendar colour indicator`}
          />
          <View className="flex-1">
            {event.isAllDay ? (
              <>
                <Text className="text-xs text-foreground/60">All day</Text>
                <Text className="text-sm text-foreground">{event.title}</Text>
              </>
            ) : (
              <>
                <Text className="text-xs text-foreground/60">
                  {format(new Date(event.startsAt), "h:mm a")} –{" "}
                  {format(new Date(event.endsAt), "h:mm a")}
                </Text>
                <Text className="text-sm text-foreground">{event.title}</Text>
              </>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

type Props = {
  selectedDate: string;
};

export function DiaryEventList({ selectedDate }: Props) {
  const dayStart = startOfDay(parseISO(selectedDate));
  const startMs = dayStart.getTime();
  const endMs = addDays(dayStart, 1).getTime();

  const events = useQuery(api.calendars.queries.getEventsForDate, { startMs, endMs });

  return <DiaryEventListContent events={events} />;
}
