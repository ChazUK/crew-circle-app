import type { Meta, StoryObj } from "@storybook/react-native";
import { View } from "react-native";

import { DiaryEventListContent, type DiaryEvent } from "./DiaryEventList";

const now = Date.now();
const todayNoon = new Date();
todayNoon.setHours(12, 0, 0, 0);
const todayNoonMs = todayNoon.getTime();

const allDayEvent: DiaryEvent = {
  _id: "evt_allday_1",
  title: "Company Away Day",
  startsAt: todayNoonMs,
  endsAt: todayNoonMs + 86_400_000,
  isAllDay: true,
  color: "#6366f1",
};

const morningEvent: DiaryEvent = {
  _id: "evt_timed_1",
  title: "Crew Call — Set Dressing",
  startsAt: todayNoonMs - 3 * 3600_000, // 9:00 AM
  endsAt: todayNoonMs - 3 * 3600_000 + 90 * 60_000, // 10:30 AM
  isAllDay: false,
  color: "#22c55e",
};

const afternoonEvent: DiaryEvent = {
  _id: "evt_timed_2",
  title: "Director's Prep Meeting",
  startsAt: todayNoonMs + 2 * 3600_000, // 2:00 PM
  endsAt: todayNoonMs + 3 * 3600_000, // 3:00 PM
  isAllDay: false,
  color: "#f59e0b",
};

const eveningEvent: DiaryEvent = {
  _id: "evt_timed_3",
  title: "Wrap Party",
  startsAt: todayNoonMs + 6 * 3600_000, // 6:00 PM
  endsAt: todayNoonMs + 9 * 3600_000, // 9:00 PM
  isAllDay: false,
  color: "#ef4444",
};

const decorator = (Story: React.ComponentType) => (
  <View style={{ flex: 1, padding: 16, backgroundColor: "#ffffff" }}>
    <Story />
  </View>
);

const meta = {
  title: "Calendars/DiaryEventList",
  component: DiaryEventListContent,
  decorators: [decorator],
  tags: ["autodocs"],
} satisfies Meta<typeof DiaryEventListContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    events: undefined,
  },
};

export const NoEvents: Story = {
  args: {
    events: [],
  },
};

export const AllDayOnly: Story = {
  args: {
    events: [allDayEvent],
  },
};

export const TimedOnly: Story = {
  args: {
    events: [morningEvent, afternoonEvent],
  },
};

export const Mixed: Story = {
  args: {
    events: [allDayEvent, morningEvent, afternoonEvent, eveningEvent],
  },
};

export const SingleTimedEvent: Story = {
  args: {
    events: [morningEvent],
  },
};

export const MultipleAllDay: Story = {
  args: {
    events: [
      allDayEvent,
      {
        _id: "evt_allday_2",
        title: "Bank Holiday",
        startsAt: now,
        endsAt: now + 86_400_000,
        isAllDay: true,
        color: "#8b5cf6",
      },
    ],
  },
};
