import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@sentry/react-native", () => ({
  captureException: vi.fn(),
  withScope: vi.fn(),
}));

import * as Sentry from "@sentry/react-native";

import { reportError } from "./reportError";

const mockCaptureException = vi.mocked(Sentry.captureException);
const mockWithScope = vi.mocked(Sentry.withScope);

function makeMockScope() {
  return {
    setTag: vi.fn(),
    setExtra: vi.fn(),
    setLevel: vi.fn(),
    setFingerprint: vi.fn(),
  };
}

describe("reportError", () => {
  let scope: ReturnType<typeof makeMockScope>;

  beforeEach(() => {
    vi.clearAllMocks();
    scope = makeMockScope();
    mockWithScope.mockImplementation((cb) => {
      cb(scope as never);
    });
  });

  test("forwards an Error instance unchanged to captureException", () => {
    const error = new Error("original");
    reportError(error);
    expect(mockCaptureException).toHaveBeenCalledWith(error);
  });

  test("converts a string to an Error with that message", () => {
    reportError("something went wrong");
    const captured = mockCaptureException.mock.calls[0]?.[0] as Error;
    expect(captured).toBeInstanceOf(Error);
    expect(captured.message).toBe("something went wrong");
  });

  test("converts null to an Error with message 'Unknown error (null/undefined thrown)'", () => {
    reportError(null);
    const captured = mockCaptureException.mock.calls[0]?.[0] as Error;
    expect(captured).toBeInstanceOf(Error);
    expect(captured.message).toBe("Unknown error (null/undefined thrown)");
  });

  test("converts undefined to an Error with message 'Unknown error (null/undefined thrown)'", () => {
    reportError(undefined);
    const captured = mockCaptureException.mock.calls[0]?.[0] as Error;
    expect(captured).toBeInstanceOf(Error);
    expect(captured.message).toBe("Unknown error (null/undefined thrown)");
  });

  test("converts a plain object to an Error and attaches it as extra.originalValue", () => {
    const obj = { code: 42, reason: "timeout" };
    reportError(obj);
    const captured = mockCaptureException.mock.calls[0]?.[0] as Error;
    expect(captured).toBeInstanceOf(Error);
    expect(scope.setExtra).toHaveBeenCalledWith("originalValue", obj);
  });

  test("applies tags via scope.setTag", () => {
    reportError(new Error("test"), { tags: { component: "auth", env: "prod" } });
    expect(scope.setTag).toHaveBeenCalledWith("component", "auth");
    expect(scope.setTag).toHaveBeenCalledWith("env", "prod");
  });

  test("applies extra via scope.setExtra", () => {
    reportError(new Error("test"), { extra: { userId: "u-123" } });
    expect(scope.setExtra).toHaveBeenCalledWith("userId", "u-123");
  });

  test("defaults level to 'error' when not specified", () => {
    reportError(new Error("test"));
    expect(scope.setLevel).toHaveBeenCalledWith("error");
  });

  test("applies the level from context when specified", () => {
    reportError(new Error("test"), { level: "fatal" });
    expect(scope.setLevel).toHaveBeenCalledWith("fatal");
  });

  test("applies fingerprint when specified", () => {
    reportError(new Error("test"), { fingerprint: ["my-error", "module-a"] });
    expect(scope.setFingerprint).toHaveBeenCalledWith(["my-error", "module-a"]);
  });

  test("does not call setFingerprint when fingerprint is not provided", () => {
    reportError(new Error("test"));
    expect(scope.setFingerprint).not.toHaveBeenCalled();
  });
});
