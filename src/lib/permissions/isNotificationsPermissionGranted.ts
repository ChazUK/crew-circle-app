import * as Notifications from "expo-notifications";

export async function isNotificationsPermissionGranted(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}
