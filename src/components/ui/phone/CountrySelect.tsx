import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollShadow, Select, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { COUNTRIES } from "@/lib/countries/countries";

import { CountryFlag } from "./CountryFlag";

type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (iso2: string) => void;
  disabled?: boolean;
};

export function CountrySelect({ value, onChange, disabled = false }: Props) {
  const themeColorOverlay = useThemeColor("overlay");

  const selectedCountry = COUNTRIES.find(({ code }) => code === value);

  const selectedOption: SelectOption | undefined = selectedCountry
    ? { value: selectedCountry.code, label: selectedCountry.name }
    : undefined;

  return (
    <Select
      value={selectedOption}
      onValueChange={(option) => {
        if (option) onChange(option.value);
      }}
      isDisabled={disabled}
      presentation="bottom-sheet"
      accessibilityLabel="Select country code"
    >
      <Select.Trigger>
        <View className="flex-row items-center gap-2 flex-1">
          <CountryFlag iso2={value} size={20} />
          <Text>{selectedCountry?.dialCode ?? ""}</Text>
        </View>
        <Select.TriggerIndicator />
      </Select.Trigger>
      <Select.Portal>
        <Select.Overlay className="bg-black/50" />
        <Select.Content
          presentation="bottom-sheet"
          snapPoints={["50%", "90%"]}
          keyboardBehavior="extend"
          enableDynamicSizing={false}
          enableOverDrag={false}
          contentContainerClassName="flex-1 h-full"
        >
          <ScrollShadow LinearGradientComponent={LinearGradient} color={themeColorOverlay}>
            <BottomSheetScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {COUNTRIES.map(({ code, name, dialCode }) => (
                <Select.Item key={code} value={code} label={name}>
                  <View className="flex-row items-center gap-2 flex-1">
                    <CountryFlag iso2={code} size={20} />
                    <Select.ItemLabel />
                  </View>
                  <Text style={{ color: "#888" }}>{dialCode}</Text>
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </BottomSheetScrollView>
          </ScrollShadow>
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}
