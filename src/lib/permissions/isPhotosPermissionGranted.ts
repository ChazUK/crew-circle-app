import * as ImagePicker from "expo-image-picker";

export async function isPhotosPermissionGranted(): Promise<boolean> {
  const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
  return status === "granted";
}
