import { isClerkAPIResponseError } from "@clerk/expo";
import type { UserResource } from "@clerk/shared/types";

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

export async function addAndStartVerification(params: {
  user: UserResource;
  phoneNumber: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const phoneNumberResource = await params.user.createPhoneNumber({
      phoneNumber: params.phoneNumber,
    });
    await phoneNumberResource.prepareVerification();
    return { ok: true };
  } catch (error) {
    if (isClerkAPIResponseError(error)) {
      const message = error.errors[0]?.longMessage ?? error.errors[0]?.message ?? FALLBACK_MESSAGE;
      return { ok: false, message };
    }
    return { ok: false, message: FALLBACK_MESSAGE };
  }
}
