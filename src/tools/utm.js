// UTM link building, kept free of any DOM code so Node can test it.
//
// The page's own address is preserved exactly: existing query parameters keep their original
// encoding, the #fragment stays at the end, and only utm_* parameters that we set again are
// replaced.

export const UTM_FIELDS = [
  { key: "source", param: "utm_source", required: true },
  { key: "medium", param: "utm_medium", required: true },
  { key: "campaign", param: "utm_campaign", required: true },
  { key: "term", param: "utm_term", required: false },
  { key: "content", param: "utm_content", required: false },
  { key: "id", param: "utm_id", required: false }
];

export const UTM_LIMITS = { urlChars: 2000 };

/** Trims a value and, when `tidy` is on, lowercases it and turns runs of whitespace into hyphens. */
export function tidyValue(value, tidy) {
  const v = String(value ?? "").trim();
  return tidy ? v.toLowerCase().replace(/\s+/g, "-") : v;
}

function parseBaseUrl(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return { empty: true };
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text);
  if (!hasScheme && /^[a-z][a-z0-9+.-]*:/i.test(text) && !/^([^/]*\.[^/]*|localhost):\d+/i.test(text)) {
    // "mailto:", "javascript:", "tel:" and so on (but not "example.com:8080/x").
    return { invalid: true };
  }
  const candidate = hasScheme ? text : `https://${text}`;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    return { invalid: true };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { invalid: true };
  // A usable web address needs a dot in the host (or localhost / an IP with a dot).
  if (!url.hostname.includes(".") && url.hostname !== "localhost") return { invalid: true };
  return { url, assumedHttps: !hasScheme };
}

/**
 * Builds a campaign URL.
 * @param {object} input  { url, source, medium, campaign, term, content, id }
 * @param {{tidy?: boolean}} [options]
 * @returns {{url: string, valid: boolean, error: ""|"empty"|"invalid"|"missing", ...}}
 */
export function buildUtmUrl(input = {}, options = {}) {
  const tidy = options.tidy !== false;
  const parsed = parseBaseUrl(input.url);

  const values = {};
  const raw = {};
  for (const f of UTM_FIELDS) {
    raw[f.key] = String(input[f.key] ?? "").trim();
    values[f.key] = tidyValue(input[f.key], tidy);
  }
  const filled = UTM_FIELDS.filter((f) => values[f.key] !== "");
  const missingRequired = UTM_FIELDS.filter((f) => f.required && values[f.key] === "").map((f) => f.key);

  const base = {
    url: "",
    valid: false,
    error: "",
    assumedHttps: false,
    replaced: [],
    values,
    raw,
    filled: filled.map((f) => f.key),
    missingRequired,
    hasFragment: false,
    length: 0
  };

  if (parsed.empty) return { ...base, error: "empty" };
  if (parsed.invalid) return { ...base, error: "invalid" };
  if (!filled.length) return { ...base, error: "missing", assumedHttps: parsed.assumedHttps };

  const url = parsed.url;
  const setParams = new Set(filled.map((f) => f.param));
  const kept = [];
  const replaced = [];
  for (const pair of url.search.replace(/^\?/, "").split("&")) {
    if (!pair) continue;
    const name = decodeSafe(pair.split("=")[0]).toLowerCase();
    if (setParams.has(name)) replaced.push(name);
    else kept.push(pair);
  }
  const added = filled.map((f) => `${f.param}=${encodeURIComponent(values[f.key])}`);
  const query = [...kept, ...added].join("&");

  const final = `${url.protocol}//${url.host}${url.pathname}?${query}${url.hash}`;
  return {
    ...base,
    url: final,
    valid: true,
    // The tool is usable with only some fields, but required ones missing is reported as a check.
    error: "",
    assumedHttps: parsed.assumedHttps,
    replaced,
    hasFragment: url.hash !== "",
    length: final.length
  };
}

function decodeSafe(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Turns a build result into a list of checks: { id, state: "pass"|"warn"|"fail", params }.
 * @param {ReturnType<typeof buildUtmUrl>} r
 * @param {{tidy?: boolean}} [options]
 */
export function buildUtmChecks(r, options = {}) {
  const checks = [];
  const add = (id, state, params = {}) => checks.push({ id, state, params });

  if (r.error === "empty") return checks;
  if (r.error === "invalid") {
    add("utmInvalidUrl", "fail");
    return checks;
  }
  if (r.error === "missing") {
    add("utmNoParams", "fail");
    return checks;
  }

  if (r.assumedHttps) add("utmAssumedHttps", "warn");

  if (r.missingRequired.includes("source")) add("utmMissingSource", "fail");
  const optionalRecommended = r.missingRequired.filter((k) => k !== "source");
  if (optionalRecommended.length) add("utmMissingRecommended", "warn", { fields: optionalRecommended });

  if (options.tidy === false) {
    const upper = UTM_FIELDS.filter((f) => r.values[f.key] !== r.values[f.key].toLowerCase()).map((f) => f.key);
    if (upper.length) add("utmUppercase", "warn", { fields: upper });
    const spaced = UTM_FIELDS.filter((f) => /\s/.test(r.values[f.key])).map((f) => f.key);
    if (spaced.length) add("utmSpaces", "warn", { fields: spaced });
  }

  if (r.replaced.length) add("utmReplaced", "warn", { names: r.replaced });
  if (r.length > UTM_LIMITS.urlChars) add("utmLong", "warn", { length: r.length, limit: UTM_LIMITS.urlChars });

  const hasProblem = checks.some((c) => c.state !== "pass");
  if (!hasProblem) add("utmGood", "pass");
  return checks;
}
