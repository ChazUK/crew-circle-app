import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { addDays, format, parseISO, startOfDay } from "date-fns";
import { Spinner, Surface } from "heroui-native";
import { ClockIcon, PinIcon } from "lucide-react-native";
import { Text, View } from "react-native";

export type DiaryEvent = {
  _id: string;
  title: string;
  startsAt: number;
  endsAt: number;
  isAllDay: boolean;
  color: string;
  provider: string;
  connectionLabel: string;
  location?: string;
};

type ContentProps = {
  events: DiaryEvent[] | undefined;
};

function formatTimeRange(startsAt: number, endsAt: number) {
  return `${format(new Date(startsAt), "H:mm")}–${format(new Date(endsAt), "H:mm")}`;
}

function DiaryEventRow({ event }: { event: DiaryEvent }) {
  const heading = `${event.provider} – ${event.connectionLabel}`.toUpperCase();

  return (
    <Surface className="flex-row p-2.5 px-3 pl-3.5 rounded-xl">
      <View className="my-0.5 w-0.75 rounded-full" style={{ backgroundColor: event.color }} />
      <View className="flex-1 ml-2.5 gap-1">
        <Text
          numberOfLines={1}
          style={{ color: event.color }}
          className="text-xs font-normal tracking-wider"
        >
          {heading}
        </Text>
        <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
          {event.title}
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1">
            <ClockIcon size={12} strokeWidth={1.5} className="text-muted" />
            <Text className="text-xs text-muted">
              {event.isAllDay ? "All day" : formatTimeRange(event.startsAt, event.endsAt)}
            </Text>
          </View>
          {event.location ? (
            <View className="flex-1 flex-row items-center gap-1">
              <PinIcon size={12} strokeWidth={1} className="text-muted" />
              <Text numberOfLines={1} className="flex-1 text-xs text-muted">
                {event.location}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Surface>
  );
}

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
        <Text className="text-sm text-muted">No events</Text>
      </View>
    );
  }

  return (
    <View className="gap-2 px-4">
      {events.map((event) => (
        <DiaryEventRow key={event._id} event={event} />
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
