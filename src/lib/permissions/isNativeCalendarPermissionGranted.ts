import * as Calendar from "expo-calendar";

export async function isNativeCalendarPermissionGranted(): Promise<boolean> {
  const { status } = await Calendar.getCalendarPermissionsAsync();
  return status === "granted";
}
