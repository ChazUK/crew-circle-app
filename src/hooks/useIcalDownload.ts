import { useAuth } from "@clerk/expo";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useState } from "react";
import { Platform, Share } from "react-native";

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL!;

export function useIcalDownload() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const download = useCallback(
    async (crewEventId: string) => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken({ template: "convex" });
        if (!token) throw new Error("Not authenticated");

        const url = `${CONVEX_URL}/calendar/event/${crewEventId}.ics`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) throw new Error("Not authenticated");
        if (response.status === 403) throw new Error("Access denied");
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);

        const icsContent = await response.text();
        const fileUri = `${FileSystem.cacheDirectory}event-${crewEventId}.ics`;
        await FileSystem.writeAsStringAsync(fileUri, icsContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (Platform.OS === "ios") {
          // On iOS, Share with a file:// URL shows the system share sheet;
          // Calendar.app appears as an option for .ics files.
          await Share.share({ url: fileUri });
        } else {
          // On Android, message-based sharing opens the intent chooser, which
          // routes .ics files to the default calendar app.
          await Share.share({ message: fileUri });
        }
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setLoading(false);
      }
    },
    [getToken],
  );

  return { download, loading, error };
}
