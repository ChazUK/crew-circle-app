import { describe, expect, test } from "vitest";

import { assertSafeIcalUrl, normalizeIcalUrl, safeHostname } from "./icalUrl";

describe("normalizeIcalUrl", () => {
  test("rewrites webcal:// to https://", () => {
    expect(normalizeIcalUrl("webcal://example.com/feed.ics")).toBe("https://example.com/feed.ics");
  });

  test("rewrites webcals:// to https://", () => {
    expect(normalizeIcalUrl("webcals://example.com/feed.ics")).toBe("https://example.com/feed.ics");
  });

  test("is case-insensitive for the scheme prefix", () => {
    expect(normalizeIcalUrl("WebCal://example.com/feed.ics")).toBe("https://example.com/feed.ics");
  });

  test("trims surrounding whitespace", () => {
    expect(normalizeIcalUrl("  https://example.com/feed.ics  ")).toBe(
      "https://example.com/feed.ics",
    );
  });

  test("leaves http(s) URLs untouched", () => {
    expect(normalizeIcalUrl("https://example.com/feed.ics")).toBe("https://example.com/feed.ics");
    expect(normalizeIcalUrl("http://example.com/feed.ics")).toBe("http://example.com/feed.ics");
  });
});

describe("assertSafeIcalUrl", () => {
  test("accepts a normal https URL", () => {
    expect(assertSafeIcalUrl("https://calendar.example.com/feed.ics")).toBe(
      "https://calendar.example.com/feed.ics",
    );
  });

  test("accepts and normalizes a webcal URL", () => {
    expect(assertSafeIcalUrl("webcal://calendar.example.com/feed.ics")).toBe(
      "https://calendar.example.com/feed.ics",
    );
  });

  test("rejects malformed URLs", () => {
    expect(() => assertSafeIcalUrl("not a url")).toThrow(/Invalid iCal URL/);
  });

  test("rejects non-http(s) schemes like file://", () => {
    expect(() => assertSafeIcalUrl("file:///etc/passwd")).toThrow(/http\(s\)/);
  });

  test("rejects URLs with credentials", () => {
    expect(() => assertSafeIcalUrl("https://user:pass@example.com/feed.ics")).toThrow(
      /credentials/,
    );
  });

  test.each([
    "http://localhost/feed.ics",
    "http://internal.localhost/feed.ics",
    "http://broadcasthost/feed.ics",
  ])("rejects local hostname %s", (url) => {
    expect(() => assertSafeIcalUrl(url)).toThrow(/local host/);
  });

  test.each([
    "http://127.0.0.1/",
    "http://10.0.0.1/",
    "http://10.255.255.255/",
    "http://172.16.0.1/",
    "http://172.31.255.255/",
    "http://192.168.1.1/",
    "http://169.254.169.254/", // AWS metadata service
    "http://100.64.0.1/", // CGNAT
    "http://0.0.0.0/",
    "http://224.0.0.1/", // multicast
  ])("rejects private/reserved IPv4 %s", (url) => {
    expect(() => assertSafeIcalUrl(url)).toThrow(/private or reserved/);
  });

  test("rejects IPv4 with octet out of range", () => {
    expect(() => assertSafeIcalUrl("http://999.0.0.1/")).toThrow();
  });

  test.each(["http://[::1]/", "http://[fc00::1]/", "http://[fd12::1]/", "http://[fe80::1]/"])(
    "rejects IPv6 private/loopback %s",
    (url) => {
      expect(() => assertSafeIcalUrl(url)).toThrow(/private or reserved/);
    },
  );

  test("accepts public IPv4 addresses", () => {
    expect(assertSafeIcalUrl("https://8.8.8.8/feed.ics")).toBe("https://8.8.8.8/feed.ics");
  });

  test("accepts public IPv6 addresses", () => {
    expect(assertSafeIcalUrl("https://[2001:4860:4860::8888]/feed.ics")).toBe(
      "https://[2001:4860:4860::8888]/feed.ics",
    );
  });
});

describe("safeHostname", () => {
  test("returns the hostname for a valid URL", () => {
    expect(safeHostname("https://calendar.example.com/feed.ics")).toBe("calendar.example.com");
  });

  test("returns the hostname for a webcal URL", () => {
    expect(safeHostname("webcal://calendar.example.com/feed.ics")).toBe("calendar.example.com");
  });

  test("falls back to 'Calendar' when the URL is invalid", () => {
    expect(safeHostname("not a url")).toBe("Calendar");
  });
});
