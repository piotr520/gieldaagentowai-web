/**
 * URL ingestion utilities — safe HTML fetching and readable text extraction.
 * Used by /api/run-agent to handle URL inputs from users.
 */

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

// Private / link-local / loopback IP ranges
const PRIVATE_IP_RE =
  /^(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d+\.\d+|127\.\d+\.\d+\.\d+)$/;

const FETCH_TIMEOUT_MS = 8_000; // 8 s
const MAX_HTML_BYTES = 512_000; // 500 KB
const MAX_TEXT_CHARS = 8_000;

/**
 * Returns true if the trimmed input looks like an http/https URL (single word,
 * no spaces, parseable by the URL constructor).
 */
export function isProbablyUrl(input: string): boolean {
  const s = input.trim();
  if (!s.startsWith("http://") && !s.startsWith("https://")) return false;
  if (/\s/.test(s)) return false; // URLs don't have spaces
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function assertSafeUrl(url: URL): void {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("UNSAFE_PROTOCOL");
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) throw new Error("BLOCKED_HOST");
  if (PRIVATE_IP_RE.test(host)) throw new Error("BLOCKED_HOST");
  if (
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".localhost")
  ) {
    throw new Error("BLOCKED_HOST");
  }
}

/**
 * Fetches the HTML of a public web page (text/html only).
 * Enforces timeout, size cap, and SSRF protection.
 * Throws named errors: BLOCKED_HOST | UNSAFE_PROTOCOL | HTTP_xxx | NOT_HTML | TIMEOUT | NO_BODY
 */
export async function fetchPageContent(rawUrl: string): Promise<string> {
  const url = new URL(rawUrl.trim());
  assertSafeUrl(url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GieldaAgentowAI/1.0; +https://gieldaagentowai.pl)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pl,en;q=0.8",
      },
      redirect: "follow",
    });
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("abort") || msg.includes("timeout")) throw new Error("TIMEOUT");
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) throw new Error(`HTTP_${res.status}`);

  const ct = res.headers.get("content-type") ?? "";
  if (
    !ct.includes("text/html") &&
    !ct.includes("text/plain") &&
    !ct.includes("application/xhtml")
  ) {
    throw new Error("NOT_HTML");
  }

  // Stream body with size cap to avoid giant downloads
  const reader = res.body?.getReader();
  if (!reader) throw new Error("NO_BODY");

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    total += value.length;
    if (total > MAX_HTML_BYTES) {
      reader.cancel();
      break;
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total > MAX_HTML_BYTES ? MAX_HTML_BYTES : total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

/**
 * Strips HTML boilerplate and returns plain readable text, capped at MAX_TEXT_CHARS.
 * Tries to extract <article> or <main> content first for better signal-to-noise.
 */
export function extractReadableText(html: string): string {
  // Remove boilerplate sections entirely
  let text = html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "");

  // Prefer <article> → <main> for news / blog content
  const articleMatch = /<article[^>]*>([\s\S]*?)<\/article>/i.exec(text);
  const mainMatch = /<main[^>]*>([\s\S]*?)<\/main>/i.exec(text);
  if (articleMatch) text = articleMatch[1];
  else if (mainMatch) text = mainMatch[1];

  // Convert block-level tags to newlines before stripping
  text = text.replace(
    /<\/?(p|div|section|article|h[1-6]|li|tr|br|blockquote|pre|figure|figcaption)[^>]*>/gi,
    "\n"
  );

  // Strip all remaining tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&hellip;/gi, "…")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

  // Normalize whitespace
  text = text.replace(/[^\S\n]+/g, " "); // collapse inline spaces
  text = text.replace(/\n{3,}/g, "\n\n"); // max 2 consecutive newlines
  text = text.trim();

  if (text.length > MAX_TEXT_CHARS) {
    text =
      text.slice(0, MAX_TEXT_CHARS) +
      "\n\n[treść skrócona — pobrano pierwsze 8 000 znaków]";
  }

  return text;
}
