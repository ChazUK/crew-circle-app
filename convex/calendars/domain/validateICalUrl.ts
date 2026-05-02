export type ICalValidationResult =
  | { valid: true }
  | { valid: false; reason: "unreachable"; message: string }
  | { valid: false; reason: "invalid"; message: string };

const FETCH_TIMEOUT_MS = 10_000;
const ICAL_HEADER = "BEGIN:VCALENDAR";

export async function validateICalUrl(url: string): Promise<ICalValidationResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: "invalid", message: "URL is not valid" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      valid: false,
      reason: "invalid",
      message: `URL protocol must be http or https (got ${parsed.protocol})`,
    };
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "text/calendar" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error";
    return { valid: false, reason: "unreachable", message };
  }

  if (!response.ok) {
    return {
      valid: false,
      reason: "unreachable",
      message: `HTTP ${response.status} ${response.statusText}`.trim(),
    };
  }

  const body = await response.text();
  if (!body.includes(ICAL_HEADER)) {
    return { valid: false, reason: "invalid", message: "Response is not a valid iCal feed" };
  }

  return { valid: true };
}
