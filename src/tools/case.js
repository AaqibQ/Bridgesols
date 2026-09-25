// Case conversion, kept free of any DOM code so Node can test it.
//
// Letters come from `\p{L}`, so accented and non-Latin scripts (Cyrillic, Greek, ...) convert
// correctly. Scripts with no letter case (Urdu, Arabic, Hindi, Chinese) pass through untouched.
// Conversions use the locale-independent `toUpperCase`/`toLowerCase`, so the Turkish dotted-i
// rules do not apply.

export const CASES = [
  "upper",
  "lower",
  "sentence",
  "title",
  "capitalize",
  "camel",
  "pascal",
  "snake",
  "kebab",
  "constant"
];

// Words kept lowercase in title case unless they are first, last or follow a colon
// (the common AP/Chicago-style short words).
const SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "if", "in", "nor", "of", "off", "on",
  "or", "per", "so", "the", "to", "up", "via", "vs", "yet", "with"
]);

const upperFirst = (word) => {
  const chars = Array.from(word);
  // Skip leading punctuation such as quotes or brackets: ("hello" -> ("Hello").
  const i = chars.findIndex((c) => /[\p{L}\p{N}]/u.test(c));
  if (i === -1) return word;
  chars[i] = chars[i].toUpperCase();
  return chars.join("");
};

const lower = (text) => text.toLowerCase();

/** Splits text into words for code-style cases: on anything that isn't a letter, number or mark, and at camelCase joins. */
export function splitWords(text) {
  return String(text ?? "")
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2") // fooBar -> foo Bar
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, "$1 $2") // XMLHttp -> XML Http
    .replace(/['’]/g, "") // don't -> dont
    .split(/[^\p{L}\p{N}\p{M}]+/u)
    .filter(Boolean);
}

function sentenceCase(text) {
  const lowered = lower(text);
  let capitalizeNext = true;
  let out = "";
  for (const ch of lowered) {
    if (capitalizeNext && /\p{L}/u.test(ch)) {
      out += ch.toUpperCase();
      capitalizeNext = false;
    } else {
      out += ch;
      if (/[.!?]/.test(ch) || ch === "\n") capitalizeNext = true;
      else if (/[\p{L}\p{N}]/u.test(ch)) capitalizeNext = false;
    }
  }
  // A lone "i" is the pronoun: "so i think" -> "So I think", "i'm" -> "I'm".
  return out.replace(/(^|[\s(“"'‘])i(?=$|[\s.,!?;:)”"']|['’](?:m|d|ll|ve)\b)/gu, "$1I");
}

function titleCase(text) {
  return text
    .split("\n")
    .map((line) => {
      // Keep separators so spacing and hyphens survive; capitalise each hyphenated part.
      const parts = lower(line).split(/(\s+|-)/);
      const wordIdx = parts.map((p, i) => (/[\p{L}\p{N}]/u.test(p) ? i : -1)).filter((i) => i >= 0);
      const first = wordIdx[0];
      const last = wordIdx[wordIdx.length - 1];
      let afterColon = false;
      return parts
        .map((part, i) => {
          if (!/[\p{L}\p{N}]/u.test(part)) return part;
          const bare = part.replace(/[^\p{L}\p{N}]/gu, "");
          const small = SMALL_WORDS.has(bare);
          // Only the first, last and post-colon words are capitalised regardless of size.
          // A hyphenated compound counts as one word for that rule.
          const keepSmall = small && i !== first && i !== last && !afterColon && !isHyphenPart(parts, i);
          afterColon = /[:—–]$/.test(part);
          return keepSmall ? part : upperFirst(part);
        })
        .join("");
    })
    .join("\n");
}

function isHyphenPart(parts, i) {
  return parts[i - 1] === "-" || parts[i + 1] === "-";
}

function capitalizeWords(text) {
  return lower(text)
    .split(/(\s+|-)/)
    .map((part) => upperFirst(part))
    .join("");
}

const joinLines = (text, fn) =>
  text
    .split("\n")
    .map((line) => fn(splitWords(line)))
    .join("\n");

const cap = (w) => upperFirst(lower(w));

const CONVERTERS = {
  upper: (t) => t.toUpperCase(),
  lower,
  sentence: sentenceCase,
  title: titleCase,
  capitalize: capitalizeWords,
  camel: (t) => joinLines(t, (w) => w.map((x, i) => (i === 0 ? lower(x) : cap(x))).join("")),
  pascal: (t) => joinLines(t, (w) => w.map(cap).join("")),
  snake: (t) => joinLines(t, (w) => w.map(lower).join("_")),
  kebab: (t) => joinLines(t, (w) => w.map(lower).join("-")),
  constant: (t) => joinLines(t, (w) => w.map((x) => x.toUpperCase()).join("_"))
};

/** Converts `text` to the named case. Unknown names return the text unchanged. */
export function convertCase(text, kind) {
  const input = String(text ?? "").replace(/\r\n?/g, "\n");
  const fn = CONVERTERS[kind];
  return fn ? fn(input) : input;
}
