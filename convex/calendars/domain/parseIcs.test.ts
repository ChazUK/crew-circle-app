import { describe, expect, test } from "vitest";

import { parseIcs } from "./parseIcs";

function buildIcs(...events: string[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CrewCircle//Test//EN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

function vevent(lines: Record<string, string>): string {
  return ["BEGIN:VEVENT", ...Object.entries(lines).map(([k, v]) => `${k}:${v}`), "END:VEVENT"].join(
    "\r\n",
  );
}

describe("parseIcs", () => {
  test("returns an empty list for an empty calendar", () => {
    expect(parseIcs("")).toEqual([]);
  });

  test("parses a basic UTC-timed event", () => {
    const ics = buildIcs(
      vevent({
        UID: "abc-123",
        SUMMARY: "Standup",
        DTSTART: "20260501T090000Z",
        DTEND: "20260501T093000Z",
      }),
    );
    const events = parseIcs(ics);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      externalId: "abc-123",
      title: "Standup",
      startsAt: Date.UTC(2026, 4, 1, 9, 0, 0),
      endsAt: Date.UTC(2026, 4, 1, 9, 30, 0),
      isAllDay: false,
    });
  });

  test("treats DTSTART;VALUE=DATE as all-day and spans 24 hours when DTEND absent", () => {
    const ics = buildIcs(
      [
        "BEGIN:VEVENT",
        "UID:all-day",
        "SUMMARY:Holiday",
        "DTSTART;VALUE=DATE:20260715",
        "END:VEVENT",
      ].join("\r\n"),
    );
    const [event] = parseIcs(ics);
    expect(event.isAllDay).toBe(true);
    expect(event.startsAt).toBe(Date.UTC(2026, 6, 15));
    expect(event.endsAt).toBe(Date.UTC(2026, 6, 16));
  });

  test("timed event without DTEND ends at DTSTART (RFC 5545 §3.6.1)", () => {
    const ics = buildIcs(
      vevent({
        UID: "instant",
        SUMMARY: "Reminder",
        DTSTART: "20260501T090000Z",
      }),
    );
    const [event] = parseIcs(ics);
    expect(event.startsAt).toBe(event.endsAt);
  });

  test("skips VEVENTs marked TRANSP:TRANSPARENT", () => {
    const ics = buildIcs(
      vevent({
        UID: "free-time",
        SUMMARY: "Birthday",
        DTSTART: "20260501T090000Z",
        DTEND: "20260501T093000Z",
        TRANSP: "TRANSPARENT",
      }),
    );
    expect(parseIcs(ics)).toEqual([]);
  });

  test("skips VEVENTs missing required fields", () => {
    const noUid = buildIcs(
      vevent({
        SUMMARY: "Nameless",
        DTSTART: "20260501T090000Z",
      }),
    );
    const noSummary = buildIcs(
      vevent({
        UID: "no-summary",
        DTSTART: "20260501T090000Z",
      }),
    );
    const noStart = buildIcs(
      vevent({
        UID: "no-start",
        SUMMARY: "When?",
      }),
    );
    expect(parseIcs(noUid)).toEqual([]);
    expect(parseIcs(noSummary)).toEqual([]);
    expect(parseIcs(noStart)).toEqual([]);
  });

  test("unfolds continuation lines per RFC 5545 §3.1", () => {
    // RFC 5545 §3.1: the CRLF and the linear-whitespace char that starts the
    // continuation are BOTH stripped during unfolding, so producers must place
    // any desired space BEFORE the fold point.
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:folded",
      "SUMMARY:This is a summary ",
      " that continues on the next line",
      "DTSTART:20260501T090000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const [event] = parseIcs(ics);
    expect(event.title).toBe("This is a summary that continues on the next line");
  });

  test("unescapes \\n, \\,, \\; and \\\\ in text values", () => {
    const ics = buildIcs(
      vevent({
        UID: "escaped",
        SUMMARY: "Line1\\nLine2",
        DESCRIPTION: "A\\, B\\; C\\\\ D",
        LOCATION: "Plain",
        DTSTART: "20260501T090000Z",
      }),
    );
    const [event] = parseIcs(ics);
    expect(event.title).toBe("Line1\nLine2");
    expect(event.description).toBe("A, B; C\\ D");
    expect(event.location).toBe("Plain");
  });

  test("accepts lowercase property names (case-insensitive per RFC 5545 §3.1)", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "begin:VEVENT",
      "uid:lower",
      "summary:lower-case",
      "dtstart:20260501T090000Z",
      "dtend:20260501T093000Z",
      "end:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const [event] = parseIcs(ics);
    expect(event?.title).toBe("lower-case");
  });

  test("resolves TZID parameter to absolute UTC", () => {
    const ics = buildIcs(
      [
        "BEGIN:VEVENT",
        "UID:tzid-ny",
        "SUMMARY:NY meeting",
        "DTSTART;TZID=America/New_York:20260501T090000",
        "DTEND;TZID=America/New_York:20260501T100000",
        "END:VEVENT",
      ].join("\r\n"),
    );
    const [event] = parseIcs(ics);
    // 2026-05-01 is EDT (UTC-4), so 09:00 NY = 13:00 UTC
    expect(event.startsAt).toBe(Date.UTC(2026, 4, 1, 13, 0, 0));
    expect(event.endsAt).toBe(Date.UTC(2026, 4, 1, 14, 0, 0));
  });

  test("falls back to UTC when TZID is unknown", () => {
    const ics = buildIcs(
      [
        "BEGIN:VEVENT",
        "UID:bad-tz",
        "SUMMARY:Weird TZ",
        "DTSTART;TZID=Not/A_Real_Zone:20260501T090000",
        "END:VEVENT",
      ].join("\r\n"),
    );
    const [event] = parseIcs(ics);
    expect(event.startsAt).toBe(Date.UTC(2026, 4, 1, 9, 0, 0));
  });

  test("floating times without TZID are stored as UTC", () => {
    const ics = buildIcs(
      vevent({
        UID: "floating",
        SUMMARY: "Floating",
        DTSTART: "20260501T090000",
        DTEND: "20260501T100000",
      }),
    );
    const [event] = parseIcs(ics);
    expect(event.startsAt).toBe(Date.UTC(2026, 4, 1, 9, 0, 0));
    expect(event.endsAt).toBe(Date.UTC(2026, 4, 1, 10, 0, 0));
  });

  test("malformed DTSTART values are ignored", () => {
    const ics = buildIcs(
      vevent({
        UID: "bad-date",
        SUMMARY: "Broken",
        DTSTART: "not-a-date",
      }),
    );
    expect(parseIcs(ics)).toEqual([]);
  });

  test("date-only with zero-padded nonsense is rejected", () => {
    const ics = buildIcs(
      [
        "BEGIN:VEVENT",
        "UID:bad-date-only",
        "SUMMARY:Broken",
        "DTSTART;VALUE=DATE:00000000",
        "END:VEVENT",
      ].join("\r\n"),
    );
    expect(parseIcs(ics)).toEqual([]);
  });

  test("handles multiple VEVENTs in a single feed", () => {
    const ics = buildIcs(
      vevent({
        UID: "one",
        SUMMARY: "First",
        DTSTART: "20260501T090000Z",
        DTEND: "20260501T100000Z",
      }),
      vevent({
        UID: "two",
        SUMMARY: "Second",
        DTSTART: "20260502T090000Z",
        DTEND: "20260502T100000Z",
      }),
    );
    const events = parseIcs(ics);
    expect(events.map((e) => e.externalId)).toEqual(["one", "two"]);
  });
});
