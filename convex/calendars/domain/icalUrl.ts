// Many iCal subscription links use the `webcal://` scheme, which is just an
// http(s) URL in disguise. Rewrite it so URL parsing and fetch both accept it.
export function normalizeIcalUrl(raw: string): string {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("webcal://")) return `https://${trimmed.slice("webcal://".length)}`;
  if (lower.startsWith("webcals://")) return `https://${trimmed.slice("webcals://".length)}`;
  return trimmed;
}

// Reject URLs that would let a user point our server at internal infrastructure
// (SSRF). This is a defence-in-depth hostname check — it does not resolve DNS,
// so a DNS-rebinding host could still slip through; Convex's fetch sandbox is
// the last line of defence there.
export function assertSafeIcalUrl(raw: string): string {
  const normalized = normalizeIcalUrl(raw);
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error("Invalid iCal URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("iCal URL must use http(s) or webcal");
  }
  if (url.username || url.password) {
    throw new Error("iCal URL must not contain credentials");
  }
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!hostname) throw new Error("iCal URL is missing a hostname");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "broadcasthost") {
    throw new Error("iCal URL points at a local host");
  }
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const m = hostname.match(ipv4);
  if (m) {
    const octets = m.slice(1).map(Number);
    if (octets.some((o) => o < 0 || o > 255 || Number.isNaN(o))) {
      throw new Error("iCal URL has an invalid IP address");
    }
    const [a, b] = octets;
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    ) {
      throw new Error("iCal URL points at a private or reserved network");
    }
  }
  if (hostname.includes(":")) {
    if (
      hostname === "::1" ||
      hostname.startsWith("fc") ||
      hostname.startsWith("fd") ||
      hostname.startsWith("fe80")
    ) {
      throw new Error("iCal URL points at a private or reserved network");
    }
  }
  return normalized;
}

export function safeHostname(raw: string): string {
  try {
    return new URL(normalizeIcalUrl(raw)).hostname;
  } catch {
    return "Calendar";
  }
}
