import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { Button, Card, Spinner } from "heroui-native";
import { useState } from "react";
import { Alert, Linking, Text, View } from "react-native";

import { Title } from "@/components/ui/Title";

export default function EditCvScreen() {
  const router = useRouter();
  const profile = useQuery(api.users.queries.getMyProfile);
  const generateUploadUrl = useMutation(
    api.users.mutations.generateCvUploadUrl.generateCvUploadUrl,
  );
  const setCv = useMutation(api.users.mutations.setCv.setCv);
  const [uploading, setUploading] = useState(false);

  if (profile === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }

  if (profile === null) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Title title="Sign in to edit your profile" />
      </View>
    );
  }

  const cvUrl = profile.mode === "self" || profile.mode === "contact" ? profile.cvUrl : undefined;

  async function pickAndUpload() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });

    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await uploadResponse.json();
      await setCv({ fileId: storageId });
      router.back();
    } catch {
      Alert.alert("Upload failed", "Could not upload your CV. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <View className="flex-1 gap-4 p-4">
      <Card className="gap-4">
        <Card.Body className="gap-4">
          {cvUrl ? (
            <View className="gap-3">
              <Text className="text-sm font-medium text-muted">Current CV</Text>
              <Button variant="secondary" onPress={() => Linking.openURL(cvUrl)}>
                View CV
              </Button>
            </View>
          ) : (
            <Text className="text-sm text-muted">No CV uploaded yet</Text>
          )}
        </Card.Body>

        <Card.Footer className="flex-col gap-4">
          <Button
            variant="primary"
            onPress={pickAndUpload}
            isDisabled={uploading}
            className="w-full"
          >
            {uploading ? "Uploading..." : cvUrl ? "Replace CV" : "Upload CV"}
          </Button>
        </Card.Footer>
      </Card>
    </View>
  );
}
