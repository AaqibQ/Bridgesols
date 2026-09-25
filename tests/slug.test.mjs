import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slugify,
  slugifyLines,
  latinize,
  encodedLength,
  previewUrl,
  buildSlugChecks,
  SLUG_STOP_WORDS
} from "../src/tools/slug.js";

const s = (input, options) => slugify(input, options).slug;

// ---- basics ------------------------------------------------------------------

test("basic titles become lowercase hyphenated slugs", () => {
  assert.equal(s("Hello World"), "hello-world");
  assert.equal(s("How to Start an Online Business"), "how-to-start-an-online-business");
  assert.equal(s("  spaced   out   title  "), "spaced-out-title");
});

test("punctuation is removed and never leaves doubled or edge separators", () => {
  assert.equal(s("Hello, World! (2026) -- Really?"), "hello-world-2026-really");
  assert.equal(s("---leading and trailing---"), "leading-and-trailing");
  assert.equal(s("a / b \\ c | d"), "a-b-c-d");
  assert.equal(s("tabs\tand\nnewlines"), "tabs-and-newlines");
});

test("apostrophes are removed inside words rather than splitting them", () => {
  assert.equal(s("Don't stop"), "dont-stop");
  assert.equal(s("It’s Bob’s book"), "its-bobs-book");
  assert.equal(s("rock 'n' roll"), "rock-n-roll");
});

test("ampersand and percent keep their meaning", () => {
  assert.equal(s("Tom & Jerry"), "tom-and-jerry");
  assert.equal(s("R&D budget"), "r-and-d-budget");
  assert.equal(s("50% off"), "50-percent-off");
});

test("numbers are kept; decimals and versions split on the dot", () => {
  assert.equal(s("Top 10 tools in 2026"), "top-10-tools-in-2026");
  assert.equal(s("Version 2.0 released"), "version-2-0-released");
});

test("symbols with no useful meaning are dropped", () => {
  assert.equal(s("C++ vs C# vs $5 @home"), "c-vs-c-vs-5-home");
  assert.equal(s("emoji \u{1F680} launch"), "emoji-launch");
});

test("empty, whitespace and non-string input are safe", () => {
  for (const input of ["", "   ", "!!!", "---", undefined, null, 12, {}]) {
    const r = slugify(input);
    assert.equal(typeof r.slug, "string");
    assert.equal(r.empty, r.slug === "");
  }
  assert.equal(s(""), "");
  assert.equal(slugify("!!!").empty, true);
  assert.equal(s(12345), "12345");
});

// ---- options -----------------------------------------------------------------

test("separator option: hyphen or underscore, anything else falls back to hyphen", () => {
  assert.equal(s("Hello big World", { separator: "_" }), "hello_big_world");
  assert.equal(s("Hello big World", { separator: "-" }), "hello-big-world");
  assert.equal(s("Hello big World", { separator: "*" }), "hello-big-world");
});

test("lowercase can be turned off", () => {
  assert.equal(s("Hello World API", { lowercase: false }), "Hello-World-API");
  assert.equal(s("Hello World API", { lowercase: true }), "hello-world-api");
});

test("stop words are removed only when asked, and never every word", () => {
  assert.equal(s("The Art of the Deal", { removeStopWords: false }), "the-art-of-the-deal");
  assert.equal(s("The Art of the Deal", { removeStopWords: true }), "art-deal");
  assert.equal(s("The", { removeStopWords: true }), "the"); // a lone stop word stays
  assert.equal(s("the and of", { removeStopWords: true }), "the-and-of"); // all stop words: keep them
  assert.ok(SLUG_STOP_WORDS.has("the") && !SLUG_STOP_WORDS.has("how") && !SLUG_STOP_WORDS.has("not"));
});

test("max length trims at a word boundary", () => {
  const long = "how to start an online business from scratch";
  const r = slugify(long, { maxLength: 20 });
  assert.equal(r.slug, "how-to-start-an");
  assert.ok(r.slug.length <= 20);
  assert.equal(r.truncated, true);
  assert.equal(slugify(long, { maxLength: 500 }).truncated, false);
  assert.equal(slugify(long, { maxLength: 0 }).slug, "how-to-start-an-online-business-from-scratch");
});

test("max length: an exact fit is not truncated; a limit below the first word cuts that word", () => {
  assert.equal(slugify("aaa bbb", { maxLength: 7 }).slug, "aaa-bbb");
  assert.equal(slugify("aaa bbb", { maxLength: 7 }).truncated, false);
  assert.equal(slugify("aaa bbb", { maxLength: 6 }).slug, "aaa");
  const r = slugify("supercalifragilistic", { maxLength: 5 });
  assert.equal(r.slug, "super");
  assert.equal(r.truncated, true);
});

test("max length works with a different separator and ignores nonsense values", () => {
  assert.equal(s("one two three four", { separator: "_", maxLength: 9 }), "one_two");
  for (const bad of [-5, NaN, Infinity, "abc", null]) {
    assert.equal(s("keep everything here", { maxLength: bad }), "keep-everything-here");
  }
  assert.equal(s("one two three", { maxLength: 8.9 }), "one-two"); // fractions are floored
});

// ---- Latin mode: accents and special letters ---------------------------------

test("latin mode strips accents", () => {
  assert.equal(s("Café crème brûlée"), "cafe-creme-brulee");
  assert.equal(s("Café au lait"), "cafe-au-lait"); // decomposed input too
  assert.equal(s("École Supérieure"), "ecole-superieure");
  assert.equal(s("Señor Niño"), "senor-nino");
  assert.equal(s("Zażółć gęślą jaźń"), "zazolc-gesla-jazn");
});

test("latin mode maps letters that don't decompose", () => {
  assert.equal(s("Straße"), "strasse");
  assert.equal(s("Æble og Øl"), "aeble-og-ol");
  assert.equal(s("Łódź"), "lodz");
  assert.equal(s("Þorn"), "thorn");
  assert.equal(s("ışık"), "isik");
});

test("upper-case special letters keep their case when lowercasing is off", () => {
  assert.equal(s("Æble Øl", { lowercase: false }), "AEble-Ol");
  assert.equal(s("STRAẞE", { lowercase: false }), "STRASSE");
});

test("latin mode transliterates Cyrillic and Greek", () => {
  assert.equal(s("Привет мир"), "privet-mir");
  assert.equal(s("Москва и Санкт-Петербург"), "moskva-i-sankt-peterburg");
  assert.equal(s("Жук Щелкунчик"), "zhuk-shchelkunchik");
  assert.equal(s("Самарский объект"), "samarskiy-obekt");
  assert.equal(s("Ελλάδα"), "ellada"); // accent stripped: ά -> α
  assert.equal(s("Αθήνα"), "athina");
});

test("Cyrillic keeps a capital first letter of its transliteration when lowercasing is off", () => {
  assert.equal(s("Жук", { lowercase: false }), "Zhuk");
});

// ---- Latin mode: scripts that can't be converted ------------------------------

test("latin mode drops scripts it can't convert and reports how many characters", () => {
  const urdu = slugify("میں پاکستان");
  assert.equal(urdu.slug, "");
  assert.equal(urdu.empty, true);
  assert.equal(urdu.removed, 10);
  const mixed = slugify("Best cafe in دبي Dubai");
  assert.equal(mixed.slug, "best-cafe-in-dubai");
  assert.equal(mixed.removed, 3);
  assert.equal(slugify("我爱北京").removed, 4);
  assert.equal(slugify("Hello").removed, 0);
});

test("latinize reports removed letters but not emoji or punctuation", () => {
  assert.deepEqual(latinize("abc"), { text: "abc", removed: 0 });
  assert.equal(latinize("a\u{1F680}b").removed, 0);
  assert.equal(latinize("a中文b").removed, 2);
});

// ---- Unicode mode -------------------------------------------------------------

test("unicode mode keeps letters of any script", () => {
  const opts = { mode: "unicode" };
  assert.equal(s("میں پاکستان میں", opts), "میں-پاکستان-میں");
  assert.equal(s("مرحبا بالعالم", opts), "مرحبا-بالعالم");
  assert.equal(s("स्वागत है", opts), "स्वागत-है"); // Devanagari keeps its combining marks
  assert.equal(s("你好 世界", opts), "你好-世界");
  assert.equal(s("Café Zürich", opts), "café-zürich"); // accents are kept, not stripped
});

test("unicode mode still removes punctuation, symbols and the Urdu/Arabic full stops", () => {
  const opts = { mode: "unicode" };
  assert.equal(s("میں۔ کیا؟", opts), "میں-کیا");
  assert.equal(s("a, b! c?", opts), "a-b-c");
  assert.equal(s("emoji \u{1F680} ok", opts), "emoji-ok");
});

test("unicode mode never reports removed characters", () => {
  assert.equal(slugify("میں", { mode: "unicode" }).removed, 0);
});

test("unicode mode applies max length by characters, not bytes", () => {
  const r = slugify("میں پاکستان میں رہتا", { mode: "unicode", maxLength: 12 });
  assert.equal(r.slug, "میں-پاکستان");
  assert.equal(Array.from(r.slug).length, 11); // 3 + hyphen + 7 characters, though far more bytes
});

test("emoji sequences and zero-width characters don't leak into slugs", () => {
  assert.equal(s("a​b‍c", { mode: "unicode" }), "a-b-c");
  assert.equal(s("\u{1F468}‍\u{1F469}‍\u{1F467} family"), "family");
});

// ---- bulk --------------------------------------------------------------------

test("slugifyLines keeps output aligned with input, including blank lines", () => {
  const out = slugifyLines("First Post\n\nSecond Post\r\nThird");
  assert.deepEqual(out.map((r) => r.slug), ["first-post", "", "second-post", "third"]);
  assert.deepEqual(out.map((r) => r.blank), [false, true, false, false]);
});

test("slugifyLines with unique numbers duplicates in order of appearance", () => {
  const out = slugifyLines("Hello\nHello\n\nhello!\nOther\nHello", { unique: true });
  assert.deepEqual(out.map((r) => r.slug), ["hello", "hello-2", "", "hello-3", "other", "hello-4"]);
  const under = slugifyLines("A\nA", { unique: true, separator: "_" });
  assert.deepEqual(under.map((r) => r.slug), ["a", "a_2"]);
  const plain = slugifyLines("A\nA");
  assert.deepEqual(plain.map((r) => r.slug), ["a", "a"]);
});

test("slugifyLines flags lines that produce nothing", () => {
  const out = slugifyLines("Good title\n!!!\nمیں");
  assert.deepEqual(out.map((r) => r.empty), [false, true, true]);
  assert.equal(out[2].removed, 3);
  assert.equal(slugifyLines("").length, 1);
  assert.equal(slugifyLines(undefined)[0].blank, true);
});

// ---- helpers -----------------------------------------------------------------

test("encodedLength shows how long a non-Latin slug is in a copied URL", () => {
  assert.equal(encodedLength("abc"), 3);
  assert.equal(encodedLength("م"), 6); // one Arabic letter = 2 bytes = %D9%85
  assert.equal(encodedLength("میں"), 18);
});

test("previewUrl joins a base URL and a slug sensibly", () => {
  assert.equal(previewUrl("https://example.com/blog", "my-post"), "https://example.com/blog/my-post");
  assert.equal(previewUrl("example.com/blog/", "my-post"), "https://example.com/blog/my-post");
  assert.equal(previewUrl("https://example.com///", "x"), "https://example.com/x");
  assert.equal(previewUrl("", "my-post"), "https://example.com/my-post");
  assert.equal(previewUrl("http://a.com/b?x=1#y", "z"), "http://a.com/b/z");
  assert.equal(previewUrl("https://a.com", ""), "https://a.com/");
});

// ---- checks ------------------------------------------------------------------

const ids = (checks) => checks.map((c) => c.id);
const check = (checks, id) => checks.find((c) => c.id === id);
const run = (text, options) => buildSlugChecks(slugifyLines(text, options), options);

test("checks: a short clean slug passes", () => {
  const checks = run("How to start a business");
  assert.deepEqual(ids(checks), ["slugGood"]);
  assert.equal(check(checks, "slugGood").state, "pass");
});

test("checks: long and wordy slugs warn", () => {
  const title = "a really quite extraordinarily long title with many many many words in it for testing";
  const checks = run(title);
  assert.equal(check(checks, "slugLong").state, "warn");
  assert.equal(check(checks, "slugWordy").state, "warn");
  assert.equal(check(checks, "slugLong").params.limit, 60);
  assert.ok(!ids(checks).includes("slugGood"));
});

test("checks: empty results fail, and dropped characters are reported", () => {
  const checks = run("میں پاکستان");
  assert.equal(check(checks, "slugEmpty").state, "fail");
  assert.equal(check(checks, "slugRemoved").params.removed, 10);
  const mixed = run("Good title دبي");
  assert.ok(!ids(mixed).includes("slugEmpty"));
  assert.equal(check(mixed, "slugRemoved").state, "warn");
});

test("checks: underscores warn, hyphens don't", () => {
  assert.ok(ids(run("some title here", { separator: "_" })).includes("slugUnderscore"));
  assert.ok(!ids(run("some title here", { separator: "-" })).includes("slugUnderscore"));
});

test("checks: unicode slugs warn about their percent-encoded length", () => {
  const checks = run("میں پاکستان", { mode: "unicode" });
  assert.equal(check(checks, "slugNonAscii").state, "warn");
  assert.ok(check(checks, "slugNonAscii").params.encoded > 20);
  assert.ok(!ids(run("plain english title", { mode: "unicode" })).includes("slugNonAscii"));
});

test("checks: trimming is reported as information, not a problem", () => {
  const checks = run("one two three four five six", { maxLength: 10 });
  assert.equal(check(checks, "slugTrimmed").state, "pass");
  assert.ok(ids(checks).includes("slugGood"));
});

test("checks: counts are per list, and blank lines don't count", () => {
  const checks = run("Short one\n\n\nlong ".padEnd(20) + "x".repeat(80));
  const long = check(checks, "slugLong");
  assert.equal(long.params.count, 1);
  assert.equal(long.params.total, 2);
  assert.deepEqual(run(""), []);
  assert.deepEqual(run("   \n \n"), []);
});

test("accented Greek and Cyrillic letters are transliterated after the accent is removed", () => {
  assert.equal(s("\u0386\u03B8\u03BB\u03B7\u03C3\u03B7"), "athlisi"); // capital accented alpha
  assert.equal(s("\u03CC\u03C7\u03B9 \u03BD\u03B1\u03AF"), "ochi-nai");
  assert.equal(s("\u0419\u043E\u0434"), "yod");
  assert.equal(s("i\u0306"), "i"); // a stray combining mark on a Latin letter still just drops the mark
});
