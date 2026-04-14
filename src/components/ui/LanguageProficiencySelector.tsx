import { Button } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";

import { LANGUAGES } from "@/data/languages";

import { RemovableChip } from "./RemovableChip";
import { SelectSheet } from "./SelectSheet";

export type ProficiencyLevel = "Native" | "Fluent" | "Conversational" | "Basic";

export type LanguageEntry = {
  language: string;
  proficiency: ProficiencyLevel;
};

const ALL_LANGUAGE_OPTIONS = LANGUAGES.map(({ name, nativeName }) => ({
  value: name,
  label: name === nativeName ? name : `${name} (${nativeName})`,
}));

const PROFICIENCY_OPTIONS: { value: ProficiencyLevel; label: string }[] = [
  { value: "Native", label: "Native" },
  { value: "Fluent", label: "Fluent" },
  { value: "Conversational", label: "Conversational" },
  { value: "Basic", label: "Basic" },
];

type Step = "idle" | "language" | "proficiency";

type Props = {
  value: LanguageEntry[];
  onChange: (entries: LanguageEntry[]) => void;
};

export function LanguageProficiencySelector({ value, onChange }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);

  const selectedLanguages = new Set(value.map((e) => e.language));
  const availableOptions = ALL_LANGUAGE_OPTIONS.filter((o) => !selectedLanguages.has(o.value));
  const canAdd = availableOptions.length > 0;

  const handleAddPress = () => {
    setPendingLanguage(null);
    setStep("language");
  };

  const handleLanguageChange = (language: string) => {
    setPendingLanguage(language);
    setTimeout(() => setStep("proficiency"), 400);
  };

  const handleProficiencyChange = (proficiency: string) => {
    if (!pendingLanguage) return;

    if (!PROFICIENCY_OPTIONS.some((o) => o.value === proficiency)) return;

    onChange([
      ...value,
      { language: pendingLanguage, proficiency: proficiency as ProficiencyLevel },
    ]);
    setPendingLanguage(null);
    setStep("idle");
  };

  const handleLanguageOpenChange = (isOpen: boolean) => {
    if (!isOpen && step === "language") setStep("idle");
  };

  const handleProficiencyOpenChange = (isOpen: boolean) => {
    if (!isOpen && step === "proficiency") {
      setPendingLanguage(null);
      setStep("idle");
    }
  };

  const removeLanguage = (language: string) => {
    onChange(value.filter((e) => e.language !== language));
  };

  return (
    <View className="flex-row flex-wrap gap-2 p-3 rounded-xl border border-default-200 items-center min-h-[52px]">
      {value.map((entry) => (
        <RemovableChip
          key={entry.language}
          label={`${entry.language} (${entry.proficiency})`}
          onRemove={() => removeLanguage(entry.language)}
        />
      ))}
      {canAdd && (
        <Button
          variant="secondary"
          size="sm"
          onPress={handleAddPress}
          accessibilityLabel="Add language"
        >
          + Add
        </Button>
      )}
      <SelectSheet
        options={availableOptions}
        onChange={handleLanguageChange}
        isOpen={step === "language"}
        onOpenChange={handleLanguageOpenChange}
        listLabel="Select language"
        snapPoints={["60%"]}
        searchable
        searchPlaceholder="Search languages..."
      />
      <SelectSheet
        options={PROFICIENCY_OPTIONS}
        onChange={handleProficiencyChange}
        isOpen={step === "proficiency"}
        onOpenChange={handleProficiencyOpenChange}
        listLabel="Select proficiency"
        snapPoints={["40%"]}
      />
    </View>
  );
}
