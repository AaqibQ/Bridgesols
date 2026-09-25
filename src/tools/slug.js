// URL slug generation.
//
// Pure functions, no DOM access, unit-tested in Node (tests/slug.test.mjs).
//
// Two modes:
//  - "latin":   ASCII-only slugs. Accents are stripped (café -> cafe), special Latin
//               letters are mapped (ß -> ss, æ -> ae, ø -> o), and Cyrillic and Greek
//               get a basic transliteration. Scripts that can't be converted reliably
//               (Arabic, Urdu, Hindi, Chinese, Japanese, Korean...) are dropped and
//               reported, rather than turned into wrong-looking Latin.
//  - "unicode": keeps letters, numbers and combining marks of any script, so an Urdu
//               or Hindi title stays readable. Browsers show these URLs as written but
//               copy them percent-encoded, which is much longer.

export const SLUG_LIMITS = { recommendedChars: 60, recommendedWords: 6 };

// Small English list on purpose: removing more risks changing what a title means.
export const SLUG_STOP_WORDS = new Set(
  "a an the and or but of to in on at for with by from as is are was were be been it its this that these those into about than so if".split(" ")
);

// Latin letters that don't decompose into a base letter + accent.
const LATIN_EXTRA = {
  "ß": "ss", "ẞ": "SS", "æ": "ae", "Æ": "AE", "œ": "oe", "Œ": "OE",
  "ø": "o", "Ø": "O", "đ": "d", "Đ": "D", "ð": "d", "Ð": "D",
  "þ": "th", "Þ": "TH", "ł": "l", "Ł": "L", "ı": "i", "İ": "I",
  "ħ": "h", "Ħ": "H", "ſ": "s"
};

const CYRILLIC = {
  "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
  "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
  "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
  "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch",
  "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
  "і": "i", "ї": "yi", "є": "ye", "ґ": "g"
};

const GREEK = {
  "α": "a", "β": "v", "γ": "g", "δ": "d", "ε": "e", "ζ": "z", "η": "i",
  "θ": "th", "ι": "i", "κ": "k", "λ": "l", "μ": "m", "ν": "n", "ξ": "x",
  "ο": "o", "π": "p", "ρ": "r", "σ": "s", "ς": "s", "τ": "t", "υ": "y",
  "φ": "f", "χ": "ch", "ψ": "ps", "ω": "o"
};

const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// Upper-case Cyrillic and Greek are derived from the lower-case tables.
const TRANSLIT = { ...LATIN_EXTRA };
for (const table of [CYRILLIC, GREEK]) {
  for (const [ch, latin] of Object.entries(table)) {
    TRANSLIT[ch] = latin;
    const upper = ch.toUpperCase();
    if (upper !== ch) TRANSLIT[upper] = capitalize(latin);
  }
}

const APOSTROPHES = /['‘’ʼ`´]/g;
const NON_ASCII_LETTER_OR_NUMBER = /[^\x00-\x7F]/;

/** Convert to ASCII where that can be done reliably. Returns the text and how many characters were dropped. */
export function latinize(text) {
  let removed = 0;
  let out = "";
  for (const ch of text.normalize("NFC")) {
    if (TRANSLIT[ch] !== undefined) {
      out += TRANSLIT[ch];
      continue;
    }
    // Decompose accented letters (é -> e + accent) and drop the accents. The base
    // letter can itself need transliterating (Greek ά -> α -> a).
    const base = ch.normalize("NFD").replace(/\p{M}/gu, "");
    for (const b of base) {
      if (TRANSLIT[b] !== undefined) {
        out += TRANSLIT[b];
      } else if (NON_ASCII_LETTER_OR_NUMBER.test(b)) {
        if (/[\p{L}\p{N}]/u.test(b)) removed++;
        out += " ";
      } else {
        out += b;
      }
    }
  }
  return { text: out, removed };
}

function wordsOf(text, mode) {
  const pattern = mode === "unicode" ? /[^\p{L}\p{N}\p{M}]+/u : /[^A-Za-z0-9]+/;
  return text.split(pattern).filter(Boolean);
}

/** Cut a word list so the joined slug fits `max` characters, at a word boundary where possible. */
function fitToLength(words, separator, max) {
  const joined = words.join(separator);
  if (!max || Array.from(joined).length <= max) return { words, truncated: false };

  const kept = [];
  let length = 0;
  for (const word of words) {
    const add = Array.from(word).length + (kept.length ? separator.length : 0);
    if (length + add > max) break;
    kept.push(word);
    length += add;
  }
  if (!kept.length) {
    // The very first word is longer than the limit: cut it.
    return { words: [Array.from(words[0]).slice(0, max).join("")], truncated: true };
  }
  return { words: kept, truncated: true };
}

const DEFAULTS = {
  separator: "-",
  mode: "latin",
  lowercase: true,
  removeStopWords: false,
  maxLength: 0
};

/** Turn one title or phrase into a slug. */
export function slugify(input, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  const separator = opts.separator === "_" ? "_" : "-";
  const mode = opts.mode === "unicode" ? "unicode" : "latin";
  const maxLength = Number.isFinite(opts.maxLength) && opts.maxLength > 0 ? Math.floor(opts.maxLength) : 0;

  let text = String(input ?? "")
    .normalize("NFC")
    .replace(/&/g, " and ")
    .replace(/%/g, " percent ")
    .replace(APOSTROPHES, "");

  let removed = 0;
  if (mode === "latin") {
    const result = latinize(text);
    text = result.text;
    removed = result.removed;
  }
  if (opts.lowercase) text = text.toLowerCase();

  let words = wordsOf(text, mode);
  const totalWords = words.length;

  if (opts.removeStopWords && words.length > 1) {
    const kept = words.filter((w) => !SLUG_STOP_WORDS.has(w.toLowerCase()));
    if (kept.length) words = kept; // never remove every word
  }

  const fitted = fitToLength(words, separator, maxLength);
  return {
    slug: fitted.words.join(separator),
    words: fitted.words.length,
    totalWords,
    removed,
    truncated: fitted.truncated,
    empty: fitted.words.length === 0
  };
}

/** One slug per line. Blank lines stay blank so the output lines up with the input. */
export function slugifyLines(text, options = {}) {
  const separator = options.separator === "_" ? "_" : "-";
  const lines = String(text ?? "").split(/\r?\n/);
  const seen = new Map();
  return lines.map((line) => {
    if (!line.trim()) return { input: line, slug: "", blank: true, empty: false, removed: 0, truncated: false, words: 0, totalWords: 0 };
    const result = slugify(line, options);
    let { slug } = result;
    if (options.unique && slug) {
      const count = (seen.get(slug) || 0) + 1;
      seen.set(slug, count);
      if (count > 1) slug = `${slug}${separator}${count}`;
    }
    return { input: line, ...result, slug, blank: false };
  });
}

/** Length of a slug once it is percent-encoded, which is how it looks when copied from the address bar. */
export function encodedLength(slug) {
  try {
    return encodeURIComponent(slug).length;
  } catch {
    return Array.from(slug).length;
  }
}

/** Join a base URL and a slug: handles a missing scheme and a missing or doubled slash. */
export function previewUrl(base, slug) {
  let b = String(base ?? "").trim();
  if (!b) b = "https://example.com/";
  if (!/^https?:\/\//i.test(b)) b = `https://${b}`;
  b = b.replace(/[?#].*$/, "");
  b = b.replace(/\/+$/, "");
  return slug ? `${b}/${slug}` : `${b}/`;
}

/**
 * Checks shown to the user, aggregated over all the slugs in the list. Each item is
 * { id, state, params } with state "pass", "warn" or "fail"; the wording is in strings.js.
 */
export function buildSlugChecks(results, options = {}) {
  const items = results.filter((r) => !r.blank);
  const checks = [];
  if (!items.length) return checks;
  const total = items.length;
  const add = (id, state, params = {}) => checks.push({ id, state, params: { total, ...params } });
  const count = (fn) => items.filter(fn).length;

  const empties = count((r) => r.empty);
  if (empties) add("slugEmpty", "fail", { count: empties });

  const withRemoved = count((r) => r.removed > 0);
  if (withRemoved) add("slugRemoved", "warn", { count: withRemoved, removed: items.reduce((n, r) => n + r.removed, 0) });

  const usable = items.filter((r) => !r.empty);
  const long = usable.filter((r) => Array.from(r.slug).length > SLUG_LIMITS.recommendedChars);
  if (long.length) add("slugLong", "warn", { count: long.length, limit: SLUG_LIMITS.recommendedChars });

  const wordy = usable.filter((r) => r.words > SLUG_LIMITS.recommendedWords);
  if (wordy.length) add("slugWordy", "warn", { count: wordy.length, limit: SLUG_LIMITS.recommendedWords });

  if (options.separator === "_" && usable.length) add("slugUnderscore", "warn", { count: usable.length });

  if (options.mode === "unicode") {
    const wide = usable.filter((r) => /[^\x00-\x7F]/.test(r.slug));
    if (wide.length) add("slugNonAscii", "warn", { count: wide.length, encoded: Math.max(...wide.map((r) => encodedLength(r.slug))) });
  }

  const trimmed = count((r) => r.truncated);
  if (trimmed) add("slugTrimmed", "pass", { count: trimmed });

  const hasProblem = checks.some((c) => c.state !== "pass");
  if (usable.length && !hasProblem) add("slugGood", "pass", { count: usable.length });

  // Nothing to say about a list that produced no usable slug and no problem.
  return checks;
}
