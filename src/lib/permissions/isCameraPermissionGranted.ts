import * as ImagePicker from "expo-image-picker";

export async function isCameraPermissionGranted(): Promise<boolean> {
  const { status } = await ImagePicker.getCameraPermissionsAsync();
  return status === "granted";
}
