// `webcal://` and `webcals://` are scheme hints from the iCalendar
// subscription convention — there is no "webcal" wire protocol. Clients
// resolve `webcal://` to `http://` and `webcals://` to `https://`. We
// follow that mapping so HTTP-only feeds (still common for school and
// club calendars) remain reachable.
export function normalizeICalUrl(url: string): string {
  const trimmed = url.trim();
  if (/^webcals:\/\//i.test(trimmed)) {
    return "https://" + trimmed.slice("webcals://".length);
  }
  if (/^webcal:\/\//i.test(trimmed)) {
    return "http://" + trimmed.slice("webcal://".length);
  }
  return trimmed;
}
