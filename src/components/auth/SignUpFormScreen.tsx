import { Button, FieldError, Input, Label, TextField } from "heroui-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Path, Svg } from "react-native-svg";

export const CC = {
  bg: "#0C0C20",
  surface: "#121212",
  border: "rgba(255,255,255,0.08)",
  text: "#FFFFFF",
  muted: "rgba(235,235,245,0.6)",
  dim: "rgba(235,235,245,0.3)",
  accent: "#FF7A1A",
} as const;

export type SignUpFormScreenProps = {
  emailValue: string;
  onEmailChange: (value: string) => void;
  onEmailBlur: () => void;
  emailError?: string | null;

  passwordValue: string;
  onPasswordChange: (value: string) => void;
  onPasswordBlur: () => void;
  passwordError?: string | null;

  showPassword: boolean;
  onToggleShowPassword: () => void;

  isSubmitting: boolean;
  isDisabled: boolean;
  globalError?: string | null;

  onSubmit: () => void;
  onBack: () => void;
};

function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) || /[^a-zA-Z0-9]/.test(password)) score++;
  return Math.min(4, Math.max(score, 1));
}

function strengthLabel(strength: number): string {
  if (strength === 1) return "Weak";
  if (strength === 2) return "Fair";
  if (strength === 3) return "Good";
  return "Strong";
}

function strengthColor(strength: number): string {
  if (strength <= 1) return "#EF4444";
  if (strength === 2) return "#F59E0B";
  if (strength === 3) return CC.accent;
  return "#22C55E";
}

export function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 4, flex: 1 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            backgroundColor: i < step ? CC.accent : "rgba(255,255,255,0.12)",
          }}
        />
      ))}
    </View>
  );
}

type FloatFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: string;
  autoCorrect?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  secureTextEntry?: boolean;
  returnKeyType?: "next" | "send" | "done" | "go";
  trailing?: React.ReactNode;
  error?: string | null;
};

export function FloatField({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  autoCapitalize,
  autoComplete,
  autoCorrect,
  keyboardType,
  secureTextEntry,
  returnKeyType,
  trailing,
  error,
}: FloatFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextField isInvalid={!!error}>
      <View
        style={{
          paddingHorizontal: 14,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: CC.surface,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: error ? "#EF4444" : focused ? CC.accent : "transparent",
          shadowColor: CC.accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: focused ? 0.35 : 0,
          shadowRadius: 6,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Label className="text-[11px] leading-[14px] font-normal text-[rgba(235,235,245,0.6)] mb-0.5 px-0">
            {label}
          </Label>
          <Input
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              onBlur();
            }}
            placeholder={placeholder}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete as any}
            autoCorrect={autoCorrect}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            returnKeyType={returnKeyType}
            placeholderColorClassName="text-[rgba(235,235,245,0.3)]"
            style={{
              padding: 0,
              margin: 0,
              backgroundColor: "transparent",
              borderWidth: 0,
              fontSize: 17,
              fontWeight: "500",
              color: CC.text,
              letterSpacing: -0.3,
            }}
          />
        </View>
        {trailing}
      </View>
      {error && (
        <FieldError styles={{ container: { marginTop: 4, marginLeft: 4 } }}>{error}</FieldError>
      )}
    </TextField>
  );
}

export function SignUpFormScreen({
  emailValue,
  onEmailChange,
  onEmailBlur,
  emailError,
  passwordValue,
  onPasswordChange,
  onPasswordBlur,
  passwordError,
  showPassword,
  onToggleShowPassword,
  isSubmitting,
  isDisabled,
  globalError,
  onSubmit,
  onBack,
}: SignUpFormScreenProps) {
  const strength = getPasswordStrength(passwordValue);
  const hasPassword = passwordValue.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: CC.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }}>
            {/* Top bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                height: 44,
                marginBottom: 24,
              }}
            >
              <Button
                isIconOnly
                variant="ghost"
                className="w-9 h-9 rounded-full bg-white/6"
                onPress={onBack}
              >
                <Svg width={10} height={16} viewBox="0 0 10 16" fill="none">
                  <Path
                    d="M8 2L2 8l6 6"
                    stroke={CC.text}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Button>
              <StepBar step={2} total={5} />
            </View>

            {/* Title */}
            <View style={{ marginBottom: 28 }}>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "700",
                  letterSpacing: -0.8,
                  lineHeight: 35,
                  marginBottom: 10,
                  color: CC.text,
                }}
              >
                Create your account
              </Text>
              <Text style={{ fontSize: 15, color: CC.muted, lineHeight: 21, letterSpacing: -0.2 }}>
                We'll use this to sign you in and send important updates.
              </Text>
            </View>

            {/* Fields */}
            <View style={{ gap: 10, marginBottom: 14 }}>
              <FloatField
                label="Email"
                value={emailValue}
                onChangeText={onEmailChange}
                onBlur={onEmailBlur}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                error={emailError}
              />

              <FloatField
                label="Password"
                value={passwordValue}
                onChangeText={onPasswordChange}
                onBlur={onPasswordBlur}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                secureTextEntry={!showPassword}
                returnKeyType="send"
                error={passwordError}
                trailing={
                  <Button variant="ghost" size="sm" onPress={onToggleShowPassword}>
                    <Button.Label className="text-[#FF7A1A] text-[13px] font-semibold">
                      {showPassword ? "Hide" : "Show"}
                    </Button.Label>
                  </Button>
                }
              />

              {hasPassword && (
                <>
                  <View style={{ flexDirection: "row", gap: 4, paddingHorizontal: 4 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <View
                        key={i}
                        style={{
                          flex: 1,
                          height: 3,
                          borderRadius: 2,
                          backgroundColor:
                            i < strength ? strengthColor(strength) : "rgba(255,255,255,0.12)",
                        }}
                      />
                    ))}
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text
                      style={{ fontSize: 12, color: strengthColor(strength), letterSpacing: -0.1 }}
                    >
                      {strengthLabel(strength)}
                    </Text>
                    <Text style={{ fontSize: 12, color: CC.dim, letterSpacing: -0.1 }}>
                      Min 8 characters
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Terms */}
            <Text
              style={{
                fontSize: 13,
                color: CC.muted,
                lineHeight: 18,
                letterSpacing: -0.1,
                marginBottom: 32,
              }}
            >
              By continuing, you agree to our{" "}
              <Text style={{ color: CC.text, textDecorationLine: "underline" }}>Terms</Text> and{" "}
              <Text style={{ color: CC.text, textDecorationLine: "underline" }}>
                Privacy Policy
              </Text>
              .
            </Text>

            {globalError && (
              <View style={{ marginBottom: 16 }}>
                <FieldError>{globalError}</FieldError>
              </View>
            )}

            {/* Actions */}
            <View style={{ gap: 10, marginTop: "auto" }}>
              <Button
                variant="primary"
                onPress={onSubmit}
                isDisabled={isDisabled}
                className="w-full"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </Button>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 4,
                }}
              >
                <View style={{ flex: 1, height: 1, backgroundColor: CC.border }} />
                <Text
                  style={{
                    fontSize: 12,
                    color: CC.muted,
                    letterSpacing: 0.2,
                    textTransform: "uppercase",
                  }}
                >
                  or
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: CC.border }} />
              </View>

              <Button variant="outline" className="w-full h-12 rounded-xl border-white/8 flex-row">
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path
                    d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9c-.3 1.4-1 2.6-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.2z"
                    fill="#4285F4"
                  />
                  <Path
                    d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8C3.9 20.5 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <Path
                    d="M5.8 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7.1H2.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.1 4.9l3.7-2.8z"
                    fill="#FBBC05"
                  />
                  <Path
                    d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.1-3.1C17.4 2 14.9 1 12 1 7.7 1 3.9 3.5 2.1 7.1l3.7 2.9c.9-2.6 3.3-4.6 6.2-4.6z"
                    fill="#EA4335"
                  />
                </Svg>
                <Button.Label className="text-white text-base font-medium">
                  Continue with Google
                </Button.Label>
              </Button>

              <Button variant="outline" className="w-full h-12 rounded-xl border-white/8 flex-row">
                <Svg width={18} height={18} viewBox="0 0 24 24" fill={CC.text}>
                  <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.41-1.09-.47-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.41C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </Svg>
                <Button.Label className="text-white text-base font-medium">
                  Continue with Apple
                </Button.Label>
              </Button>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 4,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ fontSize: 15, color: CC.muted, letterSpacing: -0.2 }}>
                  Already have an account?
                </Text>
                <Button variant="ghost" size="sm" onPress={onBack}>
                  <Button.Label className="text-[#FF7A1A] font-semibold">Sign in</Button.Label>
                </Button>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
