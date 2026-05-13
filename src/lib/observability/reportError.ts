import * as Sentry from "@sentry/react-native";

type ErrorContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: "fatal" | "error" | "warning";
  fingerprint?: string[];
};

function normalise(error: unknown): { error: Error; extra?: Record<string, unknown> } {
  if (error instanceof Error) return { error };
  if (typeof error === "string") return { error: new Error(error) };
  if (error === null || error === undefined)
    return { error: new Error("Unknown error (null/undefined thrown)") };
  return { error: new Error("Non-error value thrown"), extra: { originalValue: error } };
}

export function reportError(error: unknown, context?: ErrorContext): void {
  const { error: normalisedError, extra: normalisedExtra } = normalise(error);

  Sentry.withScope((scope) => {
    if (context?.tags) {
      for (const [k, v] of Object.entries(context.tags)) {
        scope.setTag(k, v);
      }
    }

    const mergedExtra = { ...normalisedExtra, ...context?.extra };
    for (const [k, v] of Object.entries(mergedExtra)) {
      scope.setExtra(k, v);
    }

    scope.setLevel(context?.level ?? "error");

    if (context?.fingerprint) {
      scope.setFingerprint(context.fingerprint);
    }

    Sentry.captureException(normalisedError);
  });
}
