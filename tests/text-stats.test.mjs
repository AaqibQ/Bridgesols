import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyze,
  getWords,
  countCharacters,
  countCharacterTotals,
  countSentences,
  countParagraphs,
  topKeywords,
  formatDuration
} from "../src/tools/text-stats.js";

test("empty and whitespace-only input give zeros, never NaN", () => {
  for (const input of ["", "   \n\n \t ", undefined, null]) {
    const r = analyze(input);
    assert.equal(r.words, 0);
    assert.equal(r.sentences, 0);
    assert.equal(r.paragraphs, 0);
    assert.equal(r.uniqueWords, 0);
    assert.equal(r.avgWordLength, 0);
    assert.equal(r.readingSeconds, 0);
    assert.deepEqual(r.keywords, []);
  }
  assert.equal(analyze("").characters, 0);
});

test("basic English counts", () => {
  const r = analyze("Hello world");
  assert.equal(r.words, 2);
  assert.equal(r.characters, 11);
  assert.equal(r.charactersNoSpaces, 10);
  assert.equal(r.sentences, 1);
  assert.equal(r.paragraphs, 1);
});

test("sentences and contractions", () => {
  const r = analyze("Hello, world! How are you? I'm fine.");
  assert.equal(r.words, 7);
  assert.equal(r.sentences, 3);
});

test("curly apostrophes stay inside words", () => {
  assert.equal(getWords("It’s Bob’s book").length, 3);
});

test("hyphenated compounds count as one word", () => {
  assert.deepEqual(getWords("A well-known state-of-the-art tool"), [
    "A",
    "well-known",
    "state-of-the-art",
    "tool"
  ]);
  assert.equal(getWords("pages 5-10").length, 2);
});

test("web addresses, abbreviations and file names count as one word", () => {
  assert.deepEqual(getWords("Visit example.com now"), ["Visit", "example.com", "now"]);
  assert.deepEqual(getWords("Made in the U.S.A. today"), ["Made", "in", "the", "U.S.A", "today"]);
  assert.equal(getWords("e.g. report.pdf").length, 2);
  assert.equal(getWords("wins.est").length, 1); // Chrome splits this on its own; we normalise
  assert.equal(getWords("bridgesols.com/tools").length, 2); // no scheme or www: the slash still separates
});

test("emails and web addresses count as one word each", () => {
  assert.deepEqual(getWords("mail test@example.com now").sort(), ["mail", "now", "test@example.com"]);
  assert.equal(getWords("Visit https://bridgesols.com/tools?x=1 today").length, 3);
  assert.equal(getWords("See www.bridgesols.com/tools, then leave.").length, 4);
  assert.ok(getWords("Go to https://bridgesols.com/tools.").includes("https://bridgesols.com/tools")); // final full stop is not part of the link
  assert.equal(getWords("Email (test@example.com).").length, 2);
  assert.equal(getWords("@handle is not an email").length, 5); // a bare @mention is just a word
  assert.equal(getWords("a@b").length, 2); // no dotted domain, so not an email
  assert.equal(analyze("test@example.com").words, 1);
});

test("links do not create extra sentences", () => {
  assert.equal(countSentences("Visit https://bridgesols.com/tools now. Thanks!"), 2);
  assert.equal(countSentences("Write to test@example.com."), 1);
  assert.equal(countSentences("https://bridgesols.com"), 1);
});

test("abbreviations do not end sentences", () => {
  assert.equal(countSentences("Dr. Smith went to the U.S. on Jan. 5. He returned."), 2);
  assert.equal(countSentences("Mr. and Mrs. Khan arrived. They sat."), 2);
  assert.equal(countSentences("It was fig. 3 in the report. Then it ended."), 2);
  assert.equal(countSentences("She said hello. He said goodbye."), 2);
  assert.equal(countSentences("The meeting ended in Dec. It resumed later."), 2); // month not followed by a number: real boundary
});

test("ellipses and stray dots do not glue words together", () => {
  assert.equal(getWords("wait...what").length, 2);
  assert.equal(getWords("end. Next").length, 2);
  assert.equal(getWords("Hello . World").length, 2);
});

test("digit groups: 5,000 is one word, 1, 2 is two", () => {
  assert.equal(getWords("5,000").length, 1);
  assert.equal(getWords("1,234,567.89").length, 1);
  assert.equal(getWords("1, 2, 3").length, 3);
  assert.equal(getWords("a,b").length, 2);
});

test("em dash separates words", () => {
  assert.equal(getWords("one—two").length, 2);
});

test("numbers and formatted numbers count as words", () => {
  assert.equal(getWords("3.14 costs $5,000").length, 3);
});

test("emoji: not words, but counted as single characters", () => {
  assert.equal(getWords("Hi \u{1F44B}\u{1F3FD} there").length, 2);
  assert.equal(countCharacters("Hi \u{1F44B}\u{1F3FD} there"), 10); // skin-tone emoji = 1 char
  assert.equal(countCharacters("\u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466}"), 1); // family emoji
});

test("combining marks: NFC and NFD give the same counts", () => {
  const nfc = "café";
  const nfd = "café";
  assert.equal(countCharacters(nfc), 4);
  assert.equal(countCharacters(nfd), 4);
  assert.equal(getWords(nfd).length, 1);
});

test("Urdu (right-to-left) words and sentence terminator", () => {
  const r = analyze("میں پاکستان میں رہتا ہوں۔");
  assert.equal(r.words, 5);
  assert.equal(r.sentences, 1);
});

test("Arabic words, question mark and full stop", () => {
  const r = analyze("مرحبا بالعالم. كيف حالك؟");
  assert.equal(r.words, 4);
  assert.equal(r.sentences, 2);
});

test("Hindi words and danda", () => {
  const r = analyze("मैं भारत में रहता हूँ। आप कैसे हैं?");
  assert.equal(r.words, 8);
  assert.equal(r.sentences, 2);
});

test("Chinese and Japanese are segmented into multiple words, not one long run", () => {
  assert.ok(getWords("我爱北京天安门。").length >= 3);
  assert.ok(getWords("私は学生です。").length >= 3);
  assert.equal(countSentences("我爱北京天安门。"), 1);
});

test("mixed English and Urdu", () => {
  assert.equal(getWords("Visit میرا website today").length, 4);
});

test("paragraphs: blank lines split, CRLF handled, blank paragraphs ignored", () => {
  assert.equal(countParagraphs("One.\n\nTwo.\n\n\nThree."), 3);
  assert.equal(analyze("One.\r\n\r\nTwo.\r\n\r\nThree.").paragraphs, 3);
  assert.equal(countParagraphs("Only one line\nstill same paragraph"), 1);
});

test("unique words are case-insensitive", () => {
  assert.equal(analyze("The the THE cat").uniqueWords, 2);
});

test("average word length ignores hyphens", () => {
  assert.equal(analyze("ab-cd").avgWordLength, 4);
  assert.equal(analyze("cat dog").avgWordLength, 3);
});

test("reading and speaking time", () => {
  const text = Array(238).fill("word").join(" ");
  const r = analyze(text);
  assert.equal(r.words, 238);
  assert.ok(Math.abs(r.readingSeconds - 60) < 0.001);
  assert.ok(Math.abs(r.speakingSeconds - (238 / 150) * 60) < 0.001);
});

test("formatDuration", () => {
  assert.equal(formatDuration(0), "0 sec");
  assert.equal(formatDuration(0.3), "< 1 sec"); // a real but tiny duration is never shown as 0
  assert.equal(formatDuration(42.4), "42 sec");
  assert.equal(formatDuration(60), "1 min");
  assert.equal(formatDuration(95), "1 min 35 sec");
});

test("keyword density: counts, stop words, numbers, single letters", () => {
  const words = getWords("Content marketing is content. The content of marketing 2024 2024 a a");
  const withStops = topKeywords(words, { ignoreCommonWords: false });
  assert.equal(withStops[0].word, "content");
  assert.equal(withStops[0].count, 3);
  const noStops = topKeywords(words, { ignoreCommonWords: true });
  assert.deepEqual(
    noStops.map((k) => k.word),
    ["content", "marketing"]
  );
  assert.ok(!noStops.some((k) => k.word === "2024"));
  assert.ok(!withStops.some((k) => k.word === "a"));
  // percent is relative to ALL words, including stop words
  assert.ok(Math.abs(noStops[0].percent - (3 / words.length) * 100) < 1e-9);
});

test("keyword list is empty when nothing repeats", () => {
  assert.deepEqual(topKeywords(getWords("every word here is different")), []);
});

test("keyword ties keep first-seen order", () => {
  const out = topKeywords(getWords("beta alpha beta alpha"), { ignoreCommonWords: false });
  assert.deepEqual(out.map((k) => k.word), ["beta", "alpha"]);
});

test("non-string input is treated as empty", () => {
  assert.equal(analyze(12345).words, 0);
  assert.equal(analyze({}).words, 0);
});

test("very large input stays fast enough (500k words)", () => {
  const big = Array(500000).fill("lorem ipsum dolor sit amet.").join(" ").slice(0, 3_000_000);
  const start = performance.now();
  const r = analyze(big);
  const ms = performance.now() - start;
  console.log(`  large input: ${r.words.toLocaleString()} words, ${r.characters.toLocaleString()} chars in ${Math.round(ms)} ms`);
  assert.ok(r.words > 400000);
  assert.ok(ms < 12000, `took ${ms}ms`); // dev machine: ~1.7s
});

// The fast path for simple text must agree exactly with the grapheme segmenter.
test("fast path matches the grapheme segmenter on simple text", () => {
  const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const reference = (t) => {
    let withSpaces = 0;
    let withoutSpaces = 0;
    for (const { segment } of seg.segment(t)) {
      withSpaces++;
      if (!/^\s+$/u.test(segment)) withoutSpaces++;
    }
    return { withSpaces, withoutSpaces };
  };
  const alphabet = [
    "a", "Z", "7", " ", "\n", "\t", " ", " ", "é", "ß",
    "“", "”", "’", "—", "…", "€", "!", "?", ".", ",", "­"
  ];
  let seed = 12345;
  const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < 300; i++) {
    let t = "";
    const len = Math.floor(rand() * 60);
    for (let j = 0; j < len; j++) t += alphabet[Math.floor(rand() * alphabet.length)];
    assert.deepEqual(countCharacterTotals(t), reference(t), JSON.stringify(t));
  }
});

test("CRLF is one character and never uses the fast path", () => {
  assert.equal(countCharacters("a\r\nb"), 3);
  assert.equal(analyze("a\r\nb").characters, 3); // normalised to \n first, so still 3
});

test("typographic punctuation and non-breaking spaces", () => {
  assert.equal(countCharacters("“Hi” there…"), 11);
  assert.equal(countCharacters("“Hi” there…", { includeSpaces: false }), 10);
});
