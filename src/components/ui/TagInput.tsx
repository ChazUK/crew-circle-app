import { Button, Chip, CloseButton, Input, Label, TextField } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";

type Props = {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
};

export function TagInput({ tags, onChange, placeholder = "Add a tag...", label }: Props) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (raw: string) => {
    const trimmed = raw.replace(/,/g, "").trim();
    if (!trimmed) return;
    const isDuplicate = tags.some((t) => t.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      setInputValue("");
      return;
    }
    onChange([...tags, trimmed]);
    setInputValue("");
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleChangeText = (text: string) => {
    if (text.includes(",")) {
      addTag(text);
    } else {
      setInputValue(text);
    }
  };

  return (
    <View>
      {label ? <Label accessibilityRole="text">{label}</Label> : null}
      <View className="flex-row gap-2 items-center">
        <View className="flex-1">
          <TextField>
            <Input
              value={inputValue}
              onChangeText={handleChangeText}
              onSubmitEditing={() => addTag(inputValue)}
              placeholder={placeholder}
              returnKeyType="done"
              blurOnSubmit={false}
              accessibilityLabel={label ?? placeholder}
            />
          </TextField>
        </View>
        <Button
          variant="secondary"
          size="sm"
          onPress={() => addTag(inputValue)}
          isDisabled={!inputValue.trim()}
          accessibilityLabel="Add tag"
        >
          Add
        </Button>
      </View>
      {tags.length > 0 && (
        <View
          className="flex-row flex-wrap gap-2 mt-2"
          accessibilityRole="list"
          accessibilityLabel="Tags"
        >
          {tags.map((tag) => (
            <View key={tag} className="flex-row items-center">
              <Chip animation="disable-all" color="default" variant="soft">
                <View className="flex-row items-center gap-1 pl-1">
                  <Chip.Label>{tag}</Chip.Label>
                  <CloseButton
                    onPress={() => removeTag(tag)}
                    accessibilityLabel={`Remove ${tag}`}
                  />
                </View>
              </Chip>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
