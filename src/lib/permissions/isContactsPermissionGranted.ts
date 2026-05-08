import * as Contacts from "expo-contacts";

export async function isContactsPermissionGranted(): Promise<boolean> {
  const { status } = await Contacts.getPermissionsAsync();
  return status === "granted";
}
