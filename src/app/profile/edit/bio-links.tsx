import { api } from "@convex/_generated/api";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Button, Card, FieldError, Input, Label, Spinner, TextField } from "heroui-native";
import { ScrollView, View } from "react-native";

import { Title } from "@/components/ui/Title";

export default function EditBioLinksScreen() {
  const router = useRouter();
  const profile = useQuery(api.users.queries.getMyProfile);
  const updateProfileBioLinks = useMutation(
    api.users.mutations.updateProfileBioLinks.updateProfileBioLinks,
  );

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

  const bio = profile.mode === "self" || profile.mode === "contact" ? profile.bio : undefined;
  const website =
    profile.mode === "self" || profile.mode === "contact" ? profile.website : undefined;
  const imdbId = profile.mode === "self" || profile.mode === "contact" ? profile.imdbId : undefined;

  return (
    <EditBioLinksForm
      initialBio={bio ?? ""}
      initialWebsite={website ?? ""}
      initialImdbId={imdbId ?? ""}
      onDone={() => router.back()}
      onSubmit={updateProfileBioLinks}
    />
  );
}

type FormProps = {
  initialBio: string;
  initialWebsite: string;
  initialImdbId: string;
  onDone: () => void;
  onSubmit: (args: { bio?: string; website?: string; imdbId?: string }) => Promise<unknown>;
};

function EditBioLinksForm({
  initialBio,
  initialWebsite,
  initialImdbId,
  onDone,
  onSubmit,
}: FormProps) {
  const form = useForm({
    defaultValues: {
      bio: initialBio,
      website: initialWebsite,
      imdbId: initialImdbId,
    },
    onSubmit: async ({ value }) => {
      await onSubmit({
        bio: value.bio,
        website: value.website,
        imdbId: value.imdbId,
      });
      onDone();
    },
  });

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-4 gap-6">
      <Card className="gap-4">
        <Card.Body className="gap-4">
          <form.Field name="bio">
            {(field) => (
              <TextField>
                <Label>Bio</Label>
                <Input
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  maxLength={280}
                  multiline
                  numberOfLines={4}
                  placeholder="Tell people about yourself"
                  returnKeyType="default"
                />
                <FieldError isInvalid={!!field.state.meta.errors.length}>
                  {field.state.meta.errors[0]}
                </FieldError>
              </TextField>
            )}
          </form.Field>

          <form.Field name="website">
            {(field) => (
              <TextField>
                <Label>Website</Label>
                <Input
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  placeholder="example.com"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="done"
                />
                <FieldError isInvalid={!!field.state.meta.errors.length}>
                  {field.state.meta.errors[0]}
                </FieldError>
              </TextField>
            )}
          </form.Field>

          <form.Field name="imdbId">
            {(field) => (
              <TextField>
                <Label>IMDB</Label>
                <Input
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  placeholder="nm1234567 or full IMDB URL"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                />
                <FieldError isInvalid={!!field.state.meta.errors.length}>
                  {field.state.meta.errors[0]}
                </FieldError>
              </TextField>
            )}
          </form.Field>
        </Card.Body>

        <Card.Footer className="flex-col gap-4">
          <form.Subscribe
            selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
          >
            {({ canSubmit, isSubmitting }) => (
              <Button
                variant="primary"
                onPress={() => form.handleSubmit()}
                isDisabled={!canSubmit || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            )}
          </form.Subscribe>
        </Card.Footer>
      </Card>
    </ScrollView>
  );
}
