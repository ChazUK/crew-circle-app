import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { Tabs } from "expo-router";
import {
  BookOpenIcon,
  BookOpenTextIcon,
  BriefcaseBusinessIcon,
  CirclePileIcon,
  HomeIcon,
  UserIcon,
} from "lucide-react-native";

import { PushTokenRegistrar } from "@/components/contacts/PushTokenRegistrar";

export default function HomeLayout() {
  const incomingCount = useQuery(api.notifications.queries.myUnreadIncomingInviteCount, {}) ?? 0;

  return (
    <>
      <PushTokenRegistrar />
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="diary"
          options={{
            title: "My Diary",
            tabBarIcon: ({ focused, color, size }) =>
              focused ? (
                <BookOpenTextIcon color={color} size={size} />
              ) : (
                <BookOpenIcon color={color} size={size} />
              ),
          }}
        />
        <Tabs.Screen
          name="circles"
          options={{
            title: "Circles",
            tabBarIcon: ({ color, size }) => <CirclePileIcon color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="requests"
          options={{
            title: "Requests",
            tabBarIcon: ({ color, size }) => <BriefcaseBusinessIcon color={color} size={size} />,
            tabBarBadge: incomingCount > 0 ? incomingCount : undefined,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
          }}
        />
      </Tabs>
    </>
  );
}
