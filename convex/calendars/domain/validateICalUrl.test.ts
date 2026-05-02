import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { validateICalUrl } from "./validateICalUrl";

const VALID_ICAL_BODY = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//Test//EN",
  "END:VCALENDAR",
].join("\r\n");

function makeResponse(body: string, status = 200): Response {
  return new Response(body, { status });
}

describe("validateICalUrl", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("returns valid when the response body contains BEGIN:VCALENDAR", async () => {
    fetchMock.mockResolvedValue(makeResponse(VALID_ICAL_BODY));
    const result = await validateICalUrl("https://example.com/feed.ics");
    expect(result).toEqual({ valid: true });
  });

  test("returns invalid when the response body is HTML rather than iCal", async () => {
    fetchMock.mockResolvedValue(makeResponse("<html><body>Not a feed</body></html>"));
    const result = await validateICalUrl("https://example.com/feed.ics");
    expect(result.valid).toBe(false);
    if (result.valid === false) {
      expect(result.reason).toBe("invalid");
    }
  });

  test("returns unreachable when fetch throws a network error", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const result = await validateICalUrl("https://example.com/feed.ics");
    expect(result.valid).toBe(false);
    if (result.valid === false) {
      expect(result.reason).toBe("unreachable");
    }
  });

  test("returns unreachable when the server responds with HTTP 404", async () => {
    fetchMock.mockResolvedValue(makeResponse("Not Found", 404));
    const result = await validateICalUrl("https://example.com/missing.ics");
    expect(result.valid).toBe(false);
    if (result.valid === false) {
      expect(result.reason).toBe("unreachable");
      expect(result.message).toContain("404");
    }
  });

  test("returns invalid when the URL string is malformed", async () => {
    const result = await validateICalUrl("not a url");
    expect(result.valid).toBe(false);
    if (result.valid === false) {
      expect(result.reason).toBe("invalid");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("returns invalid when the protocol is not http or https", async () => {
    const result = await validateICalUrl("ftp://example.com/feed.ics");
    expect(result.valid).toBe(false);
    if (result.valid === false) {
      expect(result.reason).toBe("invalid");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
