import {
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { InputGroup, ScrollShadow, Select, Separator, useThemeColor } from "heroui-native";
import parsePhoneNumberFromString, { CountryCode, getExampleNumber } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import { memo, useCallback, useMemo, useState } from "react";
import { ListRenderItem, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheetSearch } from "@/components/form/BottomSheetSearch";
import { COUNTRIES, Country } from "@/lib/countries/countries";

import { CountryFlag } from "../ui/icons/CountryFlag";

type DialCodeOption = Country & {
  value: string;
  label: string;
};

type Props = {
  value: string | null;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  isInvalid?: boolean;
};

const DIAL_CODES: DialCodeOption[] = COUNTRIES.map((country) => ({
  ...country,
  value: country.code,
  label: country.name,
}));

const DEFAULT_DIAL_CODE =
  DIAL_CODES.find((option) => option.code === getDeviceCountry()) ?? DIAL_CODES[0];

export const PhoneNumberInput = ({ value, onChange, onBlur, isInvalid }: Props) => {
  const initial = useMemo(() => parseInitial(value), []);
  const [national, setNational] = useState(initial.national);
  const [dialCode, setDialCode] = useState<DialCodeOption>(initial.dialCode);
  const [searchValue, setSearchValue] = useState("");
  const themeColorOverlay = useThemeColor("overlay");
  const insets = useSafeAreaInsets();

  const filteredOptions = useMemo(() => {
    const q = searchValue.trim().toLocaleLowerCase();
    if (!q) return DIAL_CODES;
    return DIAL_CODES.filter((option) => option.name.toLowerCase().includes(q));
  }, [searchValue]);

  const emit = useCallback(
    (nextNational: string, nextCountry: CountryCode) => {
      onChange(toE164(nextNational, nextCountry));
    },
    [onChange],
  );

  const handleNationalChange = useCallback(
    (next: string) => {
      setNational(next);
      emit(next, dialCode.code as CountryCode);
    },
    [dialCode, emit],
  );

  const handleDialCodeChange = useCallback(
    (option: { value: string; label: string } | undefined) => {
      if (!option) return;
      const found = DIAL_CODES.find((d) => d.value === option.value);
      if (!found) return;
      setDialCode(found);
      emit(national, found.code as CountryCode);
    },
    [national, emit],
  );

  const renderItem = useCallback<ListRenderItem<DialCodeOption>>(
    ({ item }) => (
      <Select.Item value={item.value} label={item.label}>
        <View className="flex-row items-center gap-2 flex-1">
          <CountryFlag iso2={item.code} size={20} />
          <Select.ItemLabel />
        </View>
        <Text className="text-muted">{item.dialCode}</Text>
        <Select.ItemIndicator />
      </Select.Item>
    ),
    [],
  );

  const keyExtractor = useCallback((item: DialCodeOption) => item.value, []);

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom - 16}>
        <View
          className="px-8 py-4"
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
        >
          <FooterSearch onChange={setSearchValue} placeholder="Search dial code..." />
        </View>
      </BottomSheetFooter>
    ),
    [insets.bottom],
  );

  return (
    <InputGroup>
      <InputGroup.Prefix className="flex-row">
        <Select presentation="bottom-sheet" value={dialCode} onValueChange={handleDialCodeChange}>
          <Select.Trigger variant="unstyled" className="flex-row items-center gap-1">
            <CountryFlag iso2={dialCode.code} size={20} />
            <Text className="text-sm font-medium text-foreground">{dialCode.dialCode}</Text>
          </Select.Trigger>
          <Select.Portal>
            <Select.Overlay className="bg-black/50" />
            <Select.Content
              presentation="bottom-sheet"
              snapPoints={["75%", "90%"]}
              keyboardBehavior="extend"
              enableDynamicSizing={false}
              enableOverDrag={false}
              contentContainerClassName="flex-1 h-full"
              footerComponent={renderFooter}
            >
              <ScrollShadow LinearGradientComponent={LinearGradient} color={themeColorOverlay}>
                <BottomSheetFlatList
                  data={filteredOptions}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 80 }}
                  initialNumToRender={20}
                  windowSize={10}
                  removeClippedSubviews
                />
              </ScrollShadow>
            </Select.Content>
          </Select.Portal>
        </Select>
        <Separator orientation="vertical" className="h-5" />
      </InputGroup.Prefix>
      <InputGroup.Input
        value={national}
        onChangeText={handleNationalChange}
        onBlur={onBlur}
        placeholder={phoneNumberPlaceholder(dialCode.code as CountryCode)}
        keyboardType="phone-pad"
        isInvalid={isInvalid}
      />
    </InputGroup>
  );
};

const FooterSearch = memo(function FooterSearch({
  onChange,
  placeholder,
}: {
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  return (
    <BottomSheetSearch
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      placeholder={placeholder}
    />
  );
});

function parseInitial(value: string | null): { national: string; dialCode: DialCodeOption } {
  if (!value) return { national: "", dialCode: DEFAULT_DIAL_CODE };
  const parsed = parsePhoneNumberFromString(value);
  if (!parsed?.country) return { national: "", dialCode: DEFAULT_DIAL_CODE };
  const dialCode = DIAL_CODES.find((d) => d.code === parsed.country) ?? DEFAULT_DIAL_CODE;
  return { national: parsed.formatNational(), dialCode };
}

function toE164(national: string, country: CountryCode): string | null {
  if (!national) return null;
  const phone = parsePhoneNumberFromString(national, country);
  return phone?.isValid() ? phone.number : null;
}

function getDeviceCountry(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = new Intl.Locale(locale).region;
    if (region && /^[A-Za-z]{2}$/.test(region)) return region.toUpperCase();
    return "GB";
  } catch {
    return "GB";
  }
}

function phoneNumberPlaceholder(country: CountryCode): string {
  try {
    const example = getExampleNumber(country, examples as Parameters<typeof getExampleNumber>[1]);
    return example?.formatNational() ?? "";
  } catch {
    return "";
  }
}
