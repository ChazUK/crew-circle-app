import { beforeEach, describe, expect, test, vi } from "vitest";

const mockIsClerkAPIResponseError = vi.hoisted(() => vi.fn<(err: unknown) => boolean>());
vi.mock("@clerk/expo", () => ({
  isClerkAPIResponseError: mockIsClerkAPIResponseError,
}));

import { addAndStartVerification } from "./addAndStartVerification";

type MockUser = {
  createPhoneNumber: ReturnType<typeof vi.fn>;
};

function makeClerkError(longMessage?: string, message?: string): unknown {
  return { errors: [{ longMessage, message }] };
}

describe("addAndStartVerification", () => {
  let mockPrepareVerification: ReturnType<typeof vi.fn>;
  let mockCreatePhoneNumber: ReturnType<typeof vi.fn>;
  let user: MockUser;

  beforeEach(() => {
    mockIsClerkAPIResponseError.mockReset();
    mockIsClerkAPIResponseError.mockReturnValue(false);
    mockPrepareVerification = vi.fn().mockResolvedValue(undefined);
    mockCreatePhoneNumber = vi.fn().mockResolvedValue({
      prepareVerification: mockPrepareVerification,
    });
    user = { createPhoneNumber: mockCreatePhoneNumber };
  });

  test("returns ok:true when createPhoneNumber and prepareVerification both succeed", async () => {
    const result = await addAndStartVerification({
      user: user as never,
      phoneNumber: "+447700900000",
    });

    expect(result).toEqual({ ok: true });
    expect(mockCreatePhoneNumber).toHaveBeenCalledWith({
      phoneNumber: "+447700900000",
    });
    expect(mockPrepareVerification).toHaveBeenCalledOnce();
  });

  test("returns ok:false with longMessage when createPhoneNumber rejects with Clerk error", async () => {
    const clerkError = makeClerkError("This phone number is taken.", undefined);
    mockCreatePhoneNumber.mockRejectedValue(clerkError);
    mockIsClerkAPIResponseError.mockImplementation((err) => err === clerkError);

    const result = await addAndStartVerification({
      user: user as never,
      phoneNumber: "+447700900000",
    });

    expect(result).toEqual({ ok: false, message: "This phone number is taken." });
  });

  test("returns ok:false with message when prepareVerification rejects with Clerk error that has only message", async () => {
    const clerkError = makeClerkError(undefined, "Phone number is invalid.");
    mockPrepareVerification.mockRejectedValue(clerkError);
    mockIsClerkAPIResponseError.mockImplementation((err) => err === clerkError);

    const result = await addAndStartVerification({
      user: user as never,
      phoneNumber: "+447700900000",
    });

    expect(result).toEqual({ ok: false, message: "Phone number is invalid." });
  });

  test("returns ok:false with fallback message when createPhoneNumber rejects with a non-Clerk error", async () => {
    mockCreatePhoneNumber.mockRejectedValue(new Error("Network error"));

    const result = await addAndStartVerification({
      user: user as never,
      phoneNumber: "+447700900000",
    });

    expect(result).toEqual({
      ok: false,
      message: "Something went wrong. Please try again.",
    });
  });
});
