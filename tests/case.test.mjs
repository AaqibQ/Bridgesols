import { test } from "node:test";
import assert from "node:assert/strict";
import { CASES, convertCase, splitWords } from "../src/tools/case.js";

test("upper and lower case", () => {
  assert.equal(convertCase("Hello World", "upper"), "HELLO WORLD");
  assert.equal(convertCase("Hello World", "lower"), "hello world");
  assert.equal(convertCase("", "upper"), "");
  assert.equal(convertCase(null, "lower"), "");
});

test("upper and lower case handle accents and other scripts", () => {
  assert.equal(convertCase("café ñandú", "upper"), "CAFÉ ÑANDÚ");
  assert.equal(convertCase("ПРИВЕТ Мир", "lower"), "привет мир");
  assert.equal(convertCase("Γειά σου", "upper"), "ΓΕΙΆ ΣΟΥ");
  assert.equal(convertCase("straße", "upper"), "STRASSE");
});

test("scripts without letter case pass through unchanged", () => {
  const urdu = "پاکستان میں کاروبار";
  for (const kind of ["upper", "lower", "sentence", "title", "capitalize"]) {
    assert.equal(convertCase(urdu, kind), urdu, kind);
  }
  assert.equal(convertCase("你好 世界", "upper"), "你好 世界");
});

test("Turkish dotted i does not depend on the browser locale", () => {
  assert.equal(convertCase("title", "upper"), "TITLE");
  assert.equal(convertCase("TITLE", "lower"), "title");
});

test("sentence case", () => {
  assert.equal(convertCase("hELLO wORLD. tHIS is a TEST! and more? yes", "sentence"), "Hello world. This is a test! And more? Yes");
  assert.equal(convertCase("first line\nsecond line", "sentence"), "First line\nSecond line");
  assert.equal(convertCase('"quoted start" here', "sentence"), '"Quoted start" here');
  assert.equal(convertCase("50 things i learned. so i think i'm done", "sentence"), "50 things I learned. So I think I'm done");
});

test("title case keeps small words lowercase except first, last and after a colon", () => {
  assert.equal(convertCase("the art of the deal", "title"), "The Art of the Deal");
  assert.equal(convertCase("what to do in a crisis", "title"), "What to Do in a Crisis");
  assert.equal(convertCase("a guide to seo: the basics", "title"), "A Guide to Seo: The Basics");
  assert.equal(convertCase("what are you looking at", "title"), "What Are You Looking At");
  assert.equal(convertCase("HOW TO WRITE A HEADLINE", "title"), "How to Write a Headline");
});

test("title case handles hyphens, apostrophes and punctuation", () => {
  assert.equal(convertCase("a well-known tip for e-mail", "title"), "A Well-Known Tip for E-Mail");
  assert.equal(convertCase("don't stop believin'", "title"), "Don't Stop Believin'");
  assert.equal(convertCase('the "best" way', "title"), 'The "Best" Way');
  assert.equal(convertCase("state-of-the-art tools", "title"), "State-Of-The-Art Tools");
});

test("title case works line by line and keeps spacing", () => {
  assert.equal(convertCase("first title\nthe second one", "title"), "First Title\nThe Second One");
  assert.equal(convertCase("two  spaces here", "title"), "Two  Spaces Here");
});

test("capitalize each word", () => {
  assert.equal(convertCase("the art of the deal", "capitalize"), "The Art Of The Deal");
  assert.equal(convertCase("mIxEd CaSe", "capitalize"), "Mixed Case");
});

test("word splitting for code styles", () => {
  assert.deepEqual(splitWords("helloWorld foo_bar-baz"), ["hello", "World", "foo", "bar", "baz"]);
  assert.deepEqual(splitWords("XMLHttpRequest"), ["XML", "Http", "Request"]);
  assert.deepEqual(splitWords("version2Beta"), ["version2", "Beta"]);
  assert.deepEqual(splitWords("don't stop"), ["dont", "stop"]);
  assert.deepEqual(splitWords("  !!  "), []);
});

test("camel, pascal, snake, kebab and constant case", () => {
  const src = "Hello big-World_example";
  assert.equal(convertCase(src, "camel"), "helloBigWorldExample");
  assert.equal(convertCase(src, "pascal"), "HelloBigWorldExample");
  assert.equal(convertCase(src, "snake"), "hello_big_world_example");
  assert.equal(convertCase(src, "kebab"), "hello-big-world-example");
  assert.equal(convertCase(src, "constant"), "HELLO_BIG_WORLD_EXAMPLE");
});

test("code styles convert each line separately and keep blank lines", () => {
  assert.equal(convertCase("first one\n\nsecond one", "snake"), "first_one\n\nsecond_one");
  assert.equal(convertCase("first one\r\nsecond one", "camel"), "firstOne\nsecondOne");
});

test("code styles keep accented and non-Latin letters and numbers", () => {
  assert.equal(convertCase("Café au lait 2", "kebab"), "café-au-lait-2");
  assert.equal(convertCase("Привет мир", "snake"), "привет_мир");
  assert.equal(convertCase("پاکستان میں", "kebab"), "پاکستان-میں");
});

test("code styles on empty or symbol-only input give an empty line", () => {
  assert.equal(convertCase("", "snake"), "");
  assert.equal(convertCase("!!! ---", "kebab"), "");
});

test("unknown case names leave text unchanged; every listed case converts", () => {
  assert.equal(convertCase("Hello", "nope"), "Hello");
  for (const kind of CASES) assert.equal(typeof convertCase("Some text here", kind), "string", kind);
});
