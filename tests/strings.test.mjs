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
