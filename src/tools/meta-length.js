// Meta title / description length checking.
//
// Pure functions, no DOM access, unit-tested in Node (tests/meta-length.test.mjs).
//
// Google cuts titles by rendered pixel width rather than by character count, and
// it renders them in Arial. So instead of measuring with whatever font the visitor's
// device happens to have, Latin text is measured with Arial's real character widths
// (built into the table below). That gives the same answer on every device and lets
// us test it. Scripts that aren't in the table (Urdu, Arabic, Hindi, CJK, emoji) are
// measured by a caller-supplied function (the page passes a canvas measurer) or by a
// rough estimate.
//
// These limits are estimates. Google doesn't publish exact numbers, changes its
// result layout from time to time, and often writes its own snippet instead of using
// the description you supplied.

import { countCharacters } from "./text-stats.js";

export const LIMITS = {
  // "Too short" is judged by width, not character count: 30 average Latin characters
  // is roughly 270 px, while a 15-character Chinese or Urdu title can already be as wide.
  title: { chars: 60, px: 580, minPx: 270 },
  // Calibrated so an average English description of about 155-160 characters sits at
  // the desktop limit and about 120 characters at the mobile one.
  description: { chars: 155, hardChars: 160, pxDesktop: 1000, pxMobile: 760, minPx: 430 }
};

export const FONT_PX = { title: 20, description: 14 };

// Arial advance widths in 1/1000 em for printable ASCII, code points 32..126.
// prettier-ignore
const ASCII_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, // space ! " # $ % & ' ( ) * + , - . /
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556,                               // 0-9
  278, 278, 584, 584, 584, 556, 1015,                                             // : ; < = > ? @
  667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833,                // A-M
  722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611,                // N-Z
  278, 278, 278, 469, 556, 333,                                                   // [ \ ] ^ _ `
  556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833,                // a-m
  556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500,                // n-z
  334, 260, 334, 584                                                              // { | } ~
];

// Common non-ASCII characters in Latin-script titles. Accented letters are handled by
// Unicode decomposition (e + combining accent), so only distinct glyphs are listed.
const EXTRA_WIDTHS = {
  " ": 278, "‘": 222, "’": 222, "“": 333, "”": 333, "–": 556,
  "—": 1000, "…": 1000, "•": 350, "·": 333, "©": 737, "®": 737,
  "™": 1000, "€": 556, "£": 556, "¥": 556, "°": 400, "±": 584,
  "×": 584, "»": 556, "«": 556, "›": 333, "‹": 333,
  "ß": 611, "æ": 889, "Æ": 1000, "œ": 944, "Œ": 1000,
  "ø": 611, "Ø": 778, "ð": 556, "þ": 556, "Þ": 667, "ł": 222, "Ł": 556
};

function knownWidth(ch) {
  const code = ch.codePointAt(0);
  if (code >= 32 && code <= 126) return ASCII_WIDTHS[code - 32];
  return EXTRA_WIDTHS[ch];
}

const COMBINING = /\p{M}/u;
const WIDE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}＀-￯]/u;
const EMOJI = /\p{Extended_Pictographic}/u;
const INVISIBLE = /[​-‏⁠︀-️]/u;

/** Rough width for a run of text that isn't in the Arial table. */
export function estimateRunWidth(run, sizePx) {
  let width = 0;
  for (const ch of run) {
    if (COMBINING.test(ch) || INVISIBLE.test(ch)) continue;
    if (WIDE.test(ch)) width += sizePx;
    else if (EMOJI.test(ch)) width += sizePx * 1.2;
    else width += sizePx * 0.55;
  }
  return width;
}

/**
 * Estimated rendered width in pixels. `measureRun(text, sizePx)` is used for anything
 * outside the built-in Arial table; pass the browser's canvas measurer for better
 * accuracy with non-Latin scripts.
 */
export function measureWidth(text, sizePx, measureRun = estimateRunWidth) {
  if (!text) return 0;
  let units = 0; // known characters, in 1/1000 em
  let px = 0; // measured runs, in pixels
  let run = "";
  const flush = () => {
    if (run) {
      px += measureRun(run, sizePx);
      run = "";
    }
  };
  for (const ch of text.normalize("NFD")) {
    const w = knownWidth(ch);
    if (w !== undefined) {
      flush();
      units += w;
    } else if (COMBINING.test(ch) && !run) {
      // Accent on a known Latin letter: no extra width.
    } else {
      run += ch;
    }
  }
  flush();
  return (units * sizePx) / 1000 + px;
}

const HAS_SEGMENTER = typeof Intl !== "undefined" && typeof Intl.Segmenter === "function";

function graphemes(text) {
  if (!HAS_SEGMENTER) return Array.from(text);
  return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment);
}

/**
 * Cut `text` so it fits in `maxPx`, ending with an ellipsis the way a search result
 * does. Returns the original text untouched if it already fits.
 */
export function truncateToWidth(text, maxPx, sizePx, measureRun = estimateRunWidth) {
  if (measureWidth(text, sizePx, measureRun) <= maxPx) return { text, truncated: false };

  const parts = graphemes(text);
  const ellipsis = "…";
  let lo = 0;
  let hi = parts.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = parts.slice(0, mid).join("").trimEnd() + ellipsis;
    if (measureWidth(candidate, sizePx, measureRun) <= maxPx) lo = mid;
    else hi = mid - 1;
  }
  return { text: parts.slice(0, lo).join("").trimEnd() + ellipsis, truncated: true };
}

/** Search engines collapse runs of whitespace, so we count and preview the collapsed text. */
export function normalizeText(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function evaluate(text, { limitPx, sizePx, minPx, maxChars, measureRun }) {
  const clean = normalizeText(text);
  const chars = countCharacters(clean);
  const px = measureWidth(clean, sizePx, measureRun);
  let status = "good";
  if (!clean) status = "empty";
  else if (px > limitPx || (maxChars && chars > maxChars)) status = "long";
  else if (px < minPx) status = "short";
  return { text: clean, chars, px: Math.round(px), limitPx, minPx, status };
}

export function evaluateTitle(title, measureRun) {
  return {
    ...evaluate(title, {
      limitPx: LIMITS.title.px,
      sizePx: FONT_PX.title,
      minPx: LIMITS.title.minPx,
      measureRun
    }),
    limitChars: LIMITS.title.chars
  };
}

export function evaluateDescription(description, { mobile = false, measureRun } = {}) {
  return {
    ...evaluate(description, {
      limitPx: mobile ? LIMITS.description.pxMobile : LIMITS.description.pxDesktop,
      sizePx: FONT_PX.description,
      minPx: LIMITS.description.minPx,
      maxChars: mobile ? undefined : LIMITS.description.hardChars,
      measureRun
    }),
    limitChars: LIMITS.description.chars
  };
}

/** How a URL is shown above a search result: "https://example.com › blog › post". */
export function formatUrl(input) {
  const fallback = { valid: false, display: "https://example.com › page", host: "example.com", path: "" };
  const raw = String(input ?? "").trim();
  if (!raw) return fallback;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) return fallback;
    const segments = url.pathname.split("/").filter(Boolean).map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s; // malformed %-escape: show it as typed
      }
    });
    return {
      valid: true,
      host: url.hostname.replace(/^www\./, ""),
      path: segments.join("/"),
      display: [`${url.protocol}//${url.hostname}`, ...segments].join(" › ")
    };
  } catch {
    return fallback;
  }
}

/** Case-insensitive, accent-insensitive-enough "does this text contain the keyword". */
export function containsKeyword(text, keyword) {
  const k = normalizeText(keyword).normalize("NFC").toLowerCase();
  if (!k) return false;
  return normalizeText(text).normalize("NFC").toLowerCase().includes(k);
}

/** Lower-case words with punctuation removed: "how-to-Start_online.html" -> [how, to, start, online, html]. */
function words(text) {
  const spaced = normalizeText(text).normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  return spaced ? spaced.split(" ") : [];
}

/** True if `needle` appears as a run of whole words inside `haystack` (so "seo" doesn't match "seoul"). */
function containsWordRun(haystack, needle) {
  if (!needle.length) return false;
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    if (needle.every((word, j) => haystack[i + j] === word)) return true;
  }
  return false;
}

/**
 * The list of checks shown to the user. Each item is { id, state, params } where
 * state is "pass", "warn" or "fail"; the wording lives in strings.js so it can be
 * translated.
 */
export function buildChecks({ title, description, url, keyword, mobile = false, measureRun }) {
  const t = evaluateTitle(title, measureRun);
  const d = evaluateDescription(description, { mobile, measureRun });
  const checks = [];
  const add = (id, state, params = {}) => checks.push({ id, state, params });

  // Title
  if (t.status === "empty") add("titleEmpty", "fail");
  else if (t.status === "long") add("titleLong", "fail", { px: t.px, limitPx: t.limitPx, chars: t.chars });
  else if (t.status === "short") add("titleShort", "warn", { chars: t.chars, px: t.px, minPx: t.minPx });
  else add("titleGood", "pass", { chars: t.chars, px: t.px, limitPx: t.limitPx, limitChars: t.limitChars, overChars: t.chars > t.limitChars });
  if (/^\s|\s$|\s{2,}|[\r\n\t]/.test(String(title ?? ""))) add("titleSpaces", "warn");

  // Description
  if (d.status === "empty") add("descriptionEmpty", "warn");
  else if (d.status === "long") add("descriptionLong", "fail", { px: d.px, limitPx: d.limitPx, chars: d.chars });
  else if (d.status === "short") add("descriptionShort", "warn", { chars: d.chars, px: d.px, minPx: d.minPx });
  else add("descriptionGood", "pass", { chars: d.chars, px: d.px, limitPx: d.limitPx, limitChars: d.limitChars, overChars: d.chars > d.limitChars });
  if (/^\s|\s$|\s{2,}|[\r\n\t]/.test(String(description ?? "")) && d.text) add("descriptionSpaces", "warn");
  if (t.text && d.text && t.text.toLowerCase() === d.text.toLowerCase()) add("descriptionSameAsTitle", "warn");
  if (d.text.includes('"')) add("descriptionQuotes", "warn");

  // Focus keyword
  const kw = normalizeText(keyword);
  if (kw) {
    add(containsKeyword(t.text, kw) ? "keywordInTitle" : "keywordMissingTitle", containsKeyword(t.text, kw) ? "pass" : "warn", { keyword: kw });
    if (d.text) {
      add(containsKeyword(d.text, kw) ? "keywordInDescription" : "keywordMissingDescription", containsKeyword(d.text, kw) ? "pass" : "warn", { keyword: kw });
    }
    const parsed = formatUrl(url);
    const needle = words(kw);
    // Only meaningful when there is a real URL path and the keyword has letters or digits.
    if (parsed.valid && parsed.path && needle.length) {
      const inUrl = containsWordRun(words(parsed.path), needle);
      add(inUrl ? "keywordInUrl" : "keywordMissingUrl", inUrl ? "pass" : "warn", { keyword: kw });
    }
  }
  return checks;
}

/** Copy-ready HTML with the values escaped the way an HTML page needs. */
export function toHtmlSnippet(title, description) {
  const escapeText = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escapeAttr = (s) => escapeText(s).replace(/"/g, "&quot;");
  const t = normalizeText(title);
  const d = normalizeText(description);
  const lines = [];
  if (t) lines.push(`<title>${escapeText(t)}</title>`);
  if (d) lines.push(`<meta name="description" content="${escapeAttr(d)}" />`);
  return lines.join("\n");
}
