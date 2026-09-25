import { test } from "node:test";
import assert from "node:assert/strict";
import { getStrings } from "../src/tools/strings.js";

const s = getStrings("en");

test("character-limit messages use the right singular and plural", () => {
  assert.equal(s.limitLeft(1, "1"), "1 character left");
  assert.equal(s.limitLeft(0, "0"), "0 characters left");
  assert.equal(s.limitLeft(1234, "1,234"), "1,234 characters left");
  assert.equal(s.limitOver(1, "1"), "Over the limit by 1 character");
  assert.equal(s.limitOver(65, "65"), "Over the limit by 65 characters");
});

test("screen-reader summary pluralises each count on its raw number", () => {
  const raw = { words: 1, characters: 5, sentences: 1 };
  const shown = { words: "1", characters: "5", sentences: "1", readingTime: "1 sec" };
  assert.equal(s.srSummary(raw, shown), "1 word, 5 characters, 1 sentence. Reading time 1 sec.");
  const raw2 = { words: 2000, characters: 12000, sentences: 90 };
  const shown2 = { words: "2,000", characters: "12,000", sentences: "90", readingTime: "8 min 24 sec" };
  assert.equal(s.srSummary(raw2, shown2), "2,000 words, 12,000 characters, 90 sentences. Reading time 8 min 24 sec.");
});

test("unknown languages fall back to English", () => {
  assert.equal(getStrings("xx"), s);
  assert.equal(getStrings("en-GB"), s);
});

test("meta checker messages read correctly for every check id", () => {
  const m = s.meta;
  assert.match(m.checks.titleShort({ chars: 8, px: 60, minPx: 270 }), /Short: 8 characters, about 60 px/);
  assert.match(m.checks.titleGood({ chars: 70, px: 311, limitPx: 580, limitChars: 60, overChars: true }), /Fits by width: 70 characters is more than the usual 60/);
  assert.match(m.checks.titleGood({ chars: 55, px: 520, limitPx: 580, limitChars: 60, overChars: false }), /^Good length: 55 characters, about 520 of 580 px\.$/);
  assert.match(m.checks.descriptionShort({ chars: 20, px: 120, minPx: 430 }), /Short: 20 characters/);
  assert.match(m.checks.keywordInUrl({ keyword: "seo" }), /"seo" appears in the URL/);
  assert.equal(m.count({ chars: 5, px: 40, limitChars: 60, limitPx: 580 }), "5 of about 60 characters \u00B7 about 40 of 580 px");
});

test("slug messages exist for every check id and agree in number", () => {
  const s = getStrings("en").slug;
  const ids = ["slugEmpty", "slugRemoved", "slugLong", "slugWordy", "slugUnderscore", "slugNonAscii", "slugTrimmed", "slugGood"];
  for (const id of ids) {
    assert.equal(typeof s.checks[id], "function", id);
    for (const p of [
      { total: 1, count: 1, removed: 1, limit: 6, encoded: 40 },
      { total: 4, count: 1, removed: 3, limit: 6, encoded: 40 },
      { total: 4, count: 4, removed: 3, limit: 6, encoded: 40 }
    ]) {
      const msg = s.checks[id](p);
      assert.ok(msg && !/undefined|NaN/.test(msg), `${id}: ${msg}`);
    }
  }
  assert.match(s.checks.slugWordy({ total: 4, count: 4, limit: 6 }), /^4 of 4 slugs have /);
  assert.match(s.checks.slugWordy({ total: 4, count: 1, limit: 6 }), /^1 of 4 slugs has /);
  assert.match(s.checks.slugWordy({ total: 1, count: 1, limit: 6 }), /^This slug has /);
  assert.match(s.checks.slugLong({ total: 3, count: 2, limit: 60 }), /^2 of 3 slugs are /);
});
