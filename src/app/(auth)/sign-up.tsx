import { useAuth, useSignUp } from "@clerk/expo";
import { useForm } from "@tanstack/react-form";
import { type Href, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { SignUpFormScreen } from "@/components/auth/SignUpFormScreen";
import { VerifyCodeScreen } from "@/components/ui/VerifyCodeScreen";

export default function Page() {
  const { signUp, errors: clerkErrors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [pendingVerification, setPendingVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    return () => {
      signUp.reset();
    };
  }, []);

  const signUpForm = useForm({
    defaultValues: {
      emailAddress: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const { error } = await signUp.password({
        emailAddress: value.emailAddress,
        password: value.password,
      });

      if (error) {
        console.error(JSON.stringify(error, null, 2));
        return;
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();

      if (sendError) {
        console.error(JSON.stringify(sendError, null, 2));
        return;
      }

      setPendingVerification(true);
    },
  });

  const verifyForm = useForm({
    defaultValues: {
      code: "",
    },
    onSubmit: async ({ value }) => {
      await signUp.verifications.verifyEmailCode({ code: value.code });

      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask);
              return;
            }
            router.replace(decorateUrl("/") as Href);
          },
        });
      } else {
        console.error("Sign-up attempt not complete:", signUp);
      }
    },
  });

  if (signUp.status === "complete" || isSignedIn) {
    return null;
  }

  if (pendingVerification) {
    return (
      <verifyForm.Field name="code">
        {(field) => (
          <verifyForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <VerifyCodeScreen
                title="Verify your email"
                subtitle="Enter the 6-digit code sent to your email"
                value={field.state.value}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
                onSubmit={() => verifyForm.handleSubmit()}
                onBack={() => setPendingVerification(false)}
                isLoading={!!isSubmitting}
                isDisabled={!canSubmit || !!isSubmitting || fetchStatus === "fetching"}
                error={clerkErrors.fields.code?.message ?? clerkErrors.global?.[0]?.message}
                onResend={() => signUp.verifications.sendEmailCode()}
              />
            )}
          </verifyForm.Subscribe>
        )}
      </verifyForm.Field>
    );
  }

  return (
    <signUpForm.Field name="emailAddress">
      {(emailField) => (
        <signUpForm.Field name="password">
          {(passwordField) => (
            <signUpForm.Subscribe selector={(state) => [state.isSubmitting, state.values]}>
              {([isSubmitting, values]) => {
                const { emailAddress, password } = values as {
                  emailAddress: string;
                  password: string;
                };
                return (
                  <SignUpFormScreen
                    emailValue={emailAddress}
                    onEmailChange={emailField.handleChange}
                    onEmailBlur={emailField.handleBlur}
                    emailError={clerkErrors.fields.emailAddress?.message}
                    passwordValue={password}
                    onPasswordChange={passwordField.handleChange}
                    onPasswordBlur={passwordField.handleBlur}
                    passwordError={clerkErrors.fields.password?.message}
                    showPassword={showPassword}
                    onToggleShowPassword={() => setShowPassword((v) => !v)}
                    isSubmitting={!!(isSubmitting as boolean)}
                    isDisabled={
                      !emailAddress ||
                      !password ||
                      !!(isSubmitting as boolean) ||
                      fetchStatus === "fetching"
                    }
                    globalError={clerkErrors.global?.[0]?.message}
                    onSubmit={() => signUpForm.handleSubmit()}
                    onBack={() => router.back()}
                  />
                );
              }}
            </signUpForm.Subscribe>
          )}
        </signUpForm.Field>
      )}
    </signUpForm.Field>
  );
}
