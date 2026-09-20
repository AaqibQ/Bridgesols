import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LIMITS,
  measureWidth,
  estimateRunWidth,
  truncateToWidth,
  normalizeText,
  evaluateTitle,
  evaluateDescription,
  formatUrl,
  containsKeyword,
  buildChecks,
  toHtmlSnippet
} from "../src/tools/meta-length.js";

const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// ---- pixel measurement ------------------------------------------------------

test("measureWidth uses Arial's real advance widths", () => {
  assert.ok(near(measureWidth("Hello", 20), 45.56)); // H722 e556 l222 l222 o556 = 2278/1000 * 20
  assert.equal(measureWidth("", 20), 0);
  assert.equal(measureWidth(undefined, 20), 0);
  assert.ok(near(measureWidth("1 2", 10), 13.9)); // 556 + 278 + 556
});

test("known ASCII widths spot-check", () => {
  const w = (ch) => measureWidth(ch, 1000);
  assert.equal(w("W"), 944);
  assert.equal(w("i"), 222);
  assert.equal(w("m"), 833);
  assert.equal(w("@"), 1015);
  assert.equal(w("~"), 584);
  assert.equal(w("A"), 667);
  assert.equal(w("0"), 556);
  assert.equal(w(" "), 278);
});

test("every printable ASCII character has a width", () => {
  for (let code = 32; code <= 126; code++) {
    const ch = String.fromCharCode(code);
    assert.ok(measureWidth(ch, 1000) > 0, `no width for ${JSON.stringify(ch)}`);
  }
});

test("narrow and wide letters differ a lot", () => {
  assert.ok(near(measureWidth("WWWW", 20), 75.52));
  assert.ok(near(measureWidth("iiii", 20), 17.76));
});

test("accented letters measure like their base letter", () => {
  assert.ok(near(measureWidth("café", 20), measureWidth("cafe", 20))); // precomposed
  assert.ok(near(measureWidth("café", 20), measureWidth("cafe", 20))); // combining accent
  assert.ok(near(measureWidth("cafe", 20), 37.8)); // c500 a556 f278 e556
});

test("typographic punctuation is measured, not ignored", () => {
  assert.ok(measureWidth("’", 20) > 0);
  assert.ok(near(measureWidth("—", 20), 20)); // em dash = 1em
  assert.ok(near(measureWidth("…", 20), 20));
});

test("scripts outside the table use the supplied measurer, or a sane estimate", () => {
  assert.equal(measureWidth("ا", 20, () => 99), 99);
  assert.ok(near(measureWidth("Hi ا", 20, () => 99), 24.44 + 99)); // H722 i222 space278 = 1222/1000*20
  assert.ok(near(measureWidth("日本", 20), 40)); // CJK is 1em per character
  assert.ok(near(measureWidth("\u{1F600}", 20), 24)); // emoji a bit wider than 1em
  assert.equal(estimateRunWidth("‍️", 20), 0); // joiners and selectors take no space
});

test("measureRun is only called for runs the table doesn't cover", () => {
  const calls = [];
  measureWidth("ab اب cd", 20, (run) => (calls.push(run), 10));
  assert.deepEqual(calls, ["اب"]);
});

test("typical title lengths land where the 580px rule of thumb says they should", () => {
  const sixty = "Small Business Digital Marketing Strategy Guide | BridgeSols"; // 60 chars
  assert.equal(sixty.length, 60);
  const px = measureWidth(sixty, 20);
  assert.ok(px > 480 && px <= LIMITS.title.px, `60 average chars measured ${px}px`);
  const long = "The Complete Guide to Everything You Ever Wanted to Know About SEO in 2026 for Beginners";
  assert.ok(measureWidth(long, 20) > LIMITS.title.px);
});

test("a 155-character description fits the desktop limit, and 200 characters does not", () => {
  const d155 = "Free word counter: count words, characters, sentences and paragraphs with reading time and keyword density. Works in any language and runs in your browser.";
  assert.equal(d155.length, 155);
  assert.ok(measureWidth(d155, 14) <= LIMITS.description.pxDesktop);
  const d200 = d155 + " Plus a lot more detail that will certainly get cut off.";
  assert.ok(measureWidth(d200, 14) > LIMITS.description.pxDesktop);
});

// ---- truncation --------------------------------------------------------------

test("truncateToWidth leaves text that fits alone", () => {
  assert.deepEqual(truncateToWidth("Short title", 580, 20), { text: "Short title", truncated: false });
});

test("truncateToWidth cuts to the width and adds an ellipsis", () => {
  const text = "The Complete Guide to Everything You Ever Wanted to Know About SEO in 2026 for Beginners";
  const out = truncateToWidth(text, 580, 20);
  assert.equal(out.truncated, true);
  assert.ok(out.text.endsWith("…"));
  assert.ok(measureWidth(out.text, 20) <= 580, `still ${measureWidth(out.text, 20)}px`);
  assert.ok(text.startsWith(out.text.slice(0, -1)));
  // it should be nearly as long as allowed, not cut far too early
  assert.ok(measureWidth(out.text, 20) > 580 - 40);
});

test("truncateToWidth never leaves a space before the ellipsis", () => {
  for (let max = 60; max < 400; max += 7) {
    const out = truncateToWidth("alpha beta gamma delta epsilon zeta eta theta", max, 20);
    assert.ok(!/\s…$/.test(out.text), `space before ellipsis at ${max}px: ${JSON.stringify(out.text)}`);
  }
});

test("truncateToWidth is monotonic: more room never gives less text", () => {
  const text = "monotonic behaviour matters for a live preview that updates as you type";
  let previous = 0;
  for (let max = 50; max <= 500; max += 25) {
    const len = truncateToWidth(text, max, 20).text.length;
    assert.ok(len >= previous, `shrank at ${max}px`);
    previous = len;
  }
});

test("truncateToWidth doesn't split emoji or combining sequences", () => {
  const text = "Hi " + "\u{1F44D}\u{1F3FD}".repeat(30);
  for (let max = 40; max < 300; max += 11) {
    const out = truncateToWidth(text, max, 20).text;
    assert.ok(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(out), "lone high surrogate");
    assert.ok(!/(^|[^\u{1F44D}])\u{1F3FD}/u.test(out.replace(/\u{1F44D}\u{1F3FD}/gu, "")), "orphaned skin-tone modifier");
  }
});

test("truncateToWidth copes with a limit smaller than the ellipsis", () => {
  const out = truncateToWidth("anything at all", 3, 20);
  assert.equal(out.truncated, true);
  assert.equal(out.text, "…");
});

// ---- evaluation --------------------------------------------------------------

test("normalizeText collapses whitespace like a search engine does", () => {
  assert.equal(normalizeText("  A   B \n C\t"), "A B C");
  assert.equal(normalizeText(null), "");
  assert.equal(normalizeText(undefined), "");
});

test("evaluateTitle: empty, short, good, long", () => {
  assert.equal(evaluateTitle("").status, "empty");
  assert.equal(evaluateTitle("   \n ").status, "empty");
  assert.equal(evaluateTitle("Too short").status, "short");
  assert.equal(evaluateTitle("How to Start an Online Business: A Roadmap").status, "good");
  assert.equal(evaluateTitle("A".repeat(20) + " " + "very ".repeat(20)).status, "long");
});

test("evaluateTitle is pixel-based, not just character-based", () => {
  const narrow = "i".repeat(70); // 70 chars but only ~311px
  assert.equal(evaluateTitle(narrow).chars, 70);
  assert.equal(evaluateTitle(narrow).status, "good");
  const wide = "W".repeat(32); // only 32 chars but ~604px
  assert.equal(evaluateTitle(wide).chars, 32);
  assert.equal(evaluateTitle(wide).status, "long");
  assert.equal(evaluateTitle("W".repeat(30)).status, "good"); // 566px
});

test("evaluateTitle reports counts on the whitespace-collapsed text", () => {
  const r = evaluateTitle("  Hello    world  ");
  assert.equal(r.text, "Hello world");
  assert.equal(r.chars, 11);
  assert.equal(r.limitPx, 580);
  assert.equal(r.limitChars, 60);
});

test("evaluateTitle counts emoji and accents as single characters", () => {
  assert.equal(evaluateTitle("Café \u{1F44D}\u{1F3FD}").chars, 6);
  assert.equal(evaluateTitle("Café \u{1F44D}\u{1F3FD}").chars, 6);
});

test("evaluateDescription: statuses and the desktop/mobile difference", () => {
  assert.equal(evaluateDescription("").status, "empty");
  assert.equal(evaluateDescription("Way too short.").status, "short");
  const ok = "How search engines work, how to research keywords and search intent, and the on-page and technical SEO basics that help a new site earn visibility."; // 147 chars
  assert.equal(evaluateDescription(ok).status, "good");
  assert.equal(evaluateDescription(ok, { mobile: true }).status, "long"); // ~928px vs the 760px mobile limit
  assert.equal(evaluateDescription(ok, { mobile: true }).limitPx, LIMITS.description.pxMobile);
  assert.equal(evaluateDescription(ok).limitPx, LIMITS.description.pxDesktop);
});

test("evaluateDescription has a hard character cap on desktop", () => {
  const narrow = "i".repeat(161); // tiny in pixels but over 160 characters
  assert.equal(evaluateDescription(narrow).status, "long");
  assert.equal(evaluateDescription("i".repeat(160)).status, "good");
});

// ---- URLs and keywords -------------------------------------------------------

test("formatUrl shows host and path the way a result does", () => {
  const r = formatUrl("https://bridgesols.com/tools/word-counter.html");
  assert.equal(r.valid, true);
  assert.equal(r.host, "bridgesols.com");
  assert.equal(r.path, "tools/word-counter.html");
  assert.equal(r.display, "https://bridgesols.com › tools › word-counter.html");
});

test("formatUrl accepts a bare domain, strips www, and ignores query and hash", () => {
  assert.equal(formatUrl("www.Example.com").host, "example.com");
  assert.equal(formatUrl("bridgesols.com/tools/").display, "https://bridgesols.com › tools");
  assert.equal(formatUrl("https://a.com/x?y=1#z").display, "https://a.com › x");
});

test("formatUrl falls back for empty and unusable input", () => {
  for (const bad of ["", "   ", "not a url", "javascript:alert(1)", "ftp://x.com", "localhost", undefined, null]) {
    const r = formatUrl(bad);
    assert.equal(r.valid, false, JSON.stringify(bad));
    assert.equal(r.display, "https://example.com › page");
  }
});

test("formatUrl survives a malformed percent-escape", () => {
  const r = formatUrl("https://x.com/%E0%A4%A/page");
  assert.equal(r.valid, true);
  assert.ok(r.display.endsWith("page"));
});

test("formatUrl decodes non-Latin paths for display", () => {
  assert.equal(formatUrl("https://x.com/%D8%A7%D8%B1%D8%AF%D9%88").path, "اردو");
});

test("containsKeyword is case-insensitive and tolerant of spacing", () => {
  assert.equal(containsKeyword("Keyword Research for Beginners", "keyword research"), true);
  assert.equal(containsKeyword("Keyword   Research", "keyword research"), true);
  assert.equal(containsKeyword("Something else", "seo"), false);
  assert.equal(containsKeyword("anything", ""), false);
  assert.equal(containsKeyword("anything", "   "), false);
  assert.equal(containsKeyword("Café menu", "café"), true); // NFC vs NFD
});

// ---- checks ------------------------------------------------------------------

const ids = (checks) => checks.map((c) => c.id);
const byId = (checks, id) => checks.find((c) => c.id === id);
const GOOD_TITLE = "How to Start an Online Business: A Roadmap";
const GOOD_DESC = "A realistic roadmap for starting an online business: choosing a model, validating demand, pricing, payments, first customers and scaling profitably.";

test("buildChecks: a good title and description pass", () => {
  const checks = buildChecks({ title: GOOD_TITLE, description: GOOD_DESC });
  assert.equal(byId(checks, "titleGood").state, "pass");
  assert.equal(byId(checks, "descriptionGood").state, "pass");
  assert.ok(!checks.some((c) => c.state === "fail"));
});

test("buildChecks: empty fields", () => {
  const checks = buildChecks({ title: "", description: "" });
  assert.equal(byId(checks, "titleEmpty").state, "fail");
  assert.equal(byId(checks, "descriptionEmpty").state, "warn");
});

test("buildChecks: too long and too short", () => {
  const long = buildChecks({ title: "W".repeat(40), description: "x ".repeat(120) });
  assert.equal(byId(long, "titleLong").state, "fail");
  assert.equal(byId(long, "descriptionLong").state, "fail");
  assert.ok(byId(long, "titleLong").params.px > 580);
  const short = buildChecks({ title: "Hi there", description: "Tiny." });
  assert.equal(byId(short, "titleShort").state, "warn");
  assert.equal(byId(short, "descriptionShort").state, "warn");
});

test("buildChecks: stray whitespace, duplicate of the title, and quote characters", () => {
  const spaces = buildChecks({ title: "  " + GOOD_TITLE + "  ", description: GOOD_DESC });
  assert.ok(ids(spaces).includes("titleSpaces"));
  assert.ok(!ids(buildChecks({ title: GOOD_TITLE, description: GOOD_DESC })).includes("titleSpaces"));
  const same = buildChecks({ title: GOOD_TITLE, description: GOOD_TITLE.toUpperCase() });
  assert.ok(ids(same).includes("descriptionSameAsTitle"));
  const quotes = buildChecks({ title: GOOD_TITLE, description: GOOD_DESC + ' "quoted"' });
  assert.ok(ids(quotes).includes("descriptionQuotes"));
});

test("buildChecks: focus keyword checks title, description and URL", () => {
  const checks = buildChecks({
    title: GOOD_TITLE,
    description: GOOD_DESC,
    url: "https://bridgesols.com/articles/how-to-start-online-business.html",
    keyword: "online business"
  });
  assert.equal(byId(checks, "keywordInTitle").state, "pass");
  assert.equal(byId(checks, "keywordInDescription").state, "pass");
  assert.equal(byId(checks, "keywordInUrl").state, "pass");

  const missing = buildChecks({
    title: GOOD_TITLE,
    description: GOOD_DESC,
    url: "https://bridgesols.com/articles/other.html",
    keyword: "podcast"
  });
  assert.equal(byId(missing, "keywordMissingTitle").state, "warn");
  assert.equal(byId(missing, "keywordMissingDescription").state, "warn");
  assert.equal(byId(missing, "keywordMissingUrl").state, "warn");
});

test("URL keyword check matches whole words, not fragments or symbols", () => {
  const check = (keyword, path) =>
    ids(buildChecks({ title: GOOD_TITLE, description: GOOD_DESC, keyword, url: `https://x.com/${path}` })).filter((i) => /Url$/.test(i));
  assert.deepEqual(check("online business", "articles/how-to-start-online-business.html"), ["keywordInUrl"]);
  assert.deepEqual(check("seo", "articles/seo-for-beginners"), ["keywordInUrl"]);
  assert.deepEqual(check("seo", "travel/seoul-guide"), ["keywordMissingUrl"]); // "seo" is not the word "seoul"
  assert.deepEqual(check("c++", "articles/how-to-start"), ["keywordMissingUrl"]); // used to match anything
  assert.deepEqual(check(".*", "articles/how-to-start"), []); // no letters or digits: nothing to look for
  assert.deepEqual(check("   ", "articles/x"), []);
  assert.deepEqual(check("Café", "menu/café-guide"), ["keywordInUrl"]); // NFC vs NFD
});

test("evaluate: 'too short' is judged by width, so non-Latin text isn't wrongly flagged", () => {
  const chinese = "小型企业数字营销策略完整指南"; // 12 characters, about 240 px
  const t = evaluateTitle(chinese);
  assert.ok(t.chars < 30 && t.px > 200);
  assert.equal(evaluateTitle("小型企业数字营销策略完整指南小型企业").status, "good"); // 16 characters, 320 px
  assert.equal(evaluateTitle("我爱北京").status, "short");
  assert.equal(evaluateTitle("Hi there").status, "short");
  assert.equal(evaluateTitle("How to Start an Online Business: A Roadmap").status, "good");
  assert.equal(evaluateDescription("Way too short.").status, "short");
});

test("good-length messages flag when the character count is over the usual limit", () => {
  const narrow = buildChecks({ title: "i".repeat(70), description: GOOD_DESC });
  assert.equal(byId(narrow, "titleGood").params.overChars, true);
  assert.equal(byId(narrow, "titleGood").params.limitChars, 60);
  const normal = buildChecks({ title: GOOD_TITLE, description: GOOD_DESC });
  assert.equal(byId(normal, "titleGood").params.overChars, false);
  assert.equal(byId(normal, "descriptionGood").params.overChars, false);
});

test("buildChecks: no keyword means no keyword checks; no URL means no URL check", () => {
  assert.ok(!ids(buildChecks({ title: GOOD_TITLE, description: GOOD_DESC })).some((i) => i.startsWith("keyword")));
  const noUrl = buildChecks({ title: GOOD_TITLE, description: GOOD_DESC, keyword: "online" });
  assert.ok(!ids(noUrl).some((i) => /Url$/.test(i)));
});

test("buildChecks respects the mobile limit", () => {
  const desc = "How search engines work, how to research keywords and search intent, and the on-page and technical SEO basics that help a new site earn visibility.";
  assert.equal(byId(buildChecks({ title: GOOD_TITLE, description: desc }), "descriptionGood").state, "pass");
  assert.equal(byId(buildChecks({ title: GOOD_TITLE, description: desc, mobile: true }), "descriptionLong").state, "fail");
});

test("every check id that can be produced has a readable message (no undefined in the UI)", async () => {
  const { getStrings } = await import("../src/tools/strings.js");
  const messages = getStrings("en").meta.checks;
  const seen = new Set();
  const inputs = [
    { title: "", description: "" },
    { title: "Hi", description: "Tiny" },
    { title: GOOD_TITLE, description: GOOD_DESC, url: "https://x.com/online-business", keyword: "online business" },
    { title: GOOD_TITLE, description: GOOD_DESC, url: "https://x.com/other-page", keyword: "podcast" },
    { title: "W".repeat(40), description: "x ".repeat(120) },
    { title: "  padded  title  ", description: "  padded  \n description " },
    { title: GOOD_TITLE, description: GOOD_TITLE },
    { title: GOOD_TITLE, description: GOOD_DESC + ' "q"' },
    { title: "i".repeat(70), description: "i".repeat(100) },
    { title: GOOD_TITLE, description: "", keyword: "online" },
    { title: GOOD_TITLE, description: GOOD_DESC, keyword: "online", mobile: true }
  ];
  for (const input of inputs) {
    for (const check of buildChecks(input)) {
      seen.add(check.id);
      assert.equal(typeof messages[check.id], "function", `no message for check id "${check.id}"`);
      const text = messages[check.id](check.params);
      assert.ok(text && !/undefined|NaN|\[object/.test(text), `bad message for ${check.id}: ${text}`);
      assert.ok(["pass", "warn", "fail"].includes(check.state), `bad state for ${check.id}`);
    }
  }
  // every message that exists is exercised by some scenario above
  const unused = Object.keys(messages).filter((id) => !seen.has(id));
  assert.deepEqual(unused, [], `messages never produced by any scenario: ${unused.join(", ")}`);
});

// ---- HTML snippet ------------------------------------------------------------

test("toHtmlSnippet escapes what HTML needs escaped", () => {
  const out = toHtmlSnippet("Tom & Jerry <b>", 'Say "hi" & <bye>');
  assert.equal(
    out,
    '<title>Tom &amp; Jerry &lt;b&gt;</title>\n<meta name="description" content="Say &quot;hi&quot; &amp; &lt;bye&gt;" />'
  );
});

test("toHtmlSnippet leaves quotes alone inside <title>", () => {
  assert.equal(toHtmlSnippet('The "Best" guide', ""), '<title>The "Best" guide</title>');
});

test("toHtmlSnippet collapses whitespace and omits empty parts", () => {
  assert.equal(toHtmlSnippet("  A \n B ", ""), "<title>A B</title>");
  assert.equal(toHtmlSnippet("", "  only   description "), '<meta name="description" content="only description" />');
  assert.equal(toHtmlSnippet("", ""), "");
  assert.equal(toHtmlSnippet(undefined, null), "");
});

test("toHtmlSnippet output round-trips when parsed as HTML text", () => {
  const raw = 'Fish & Chips <script>alert("x")</script>';
  const snippet = toHtmlSnippet(raw, raw);
  assert.ok(!snippet.includes("<script>"), "raw tag must not survive into the snippet");
  assert.ok(!/content="[^"]*"[^ /]*"/.test(snippet), "an unescaped quote would break the attribute");
});
