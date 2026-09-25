import { test } from "node:test";
import assert from "node:assert/strict";
import { buildUtmUrl, buildUtmChecks, tidyValue, UTM_FIELDS } from "../src/tools/utm.js";

const base = { url: "https://example.com/page", source: "newsletter", medium: "email", campaign: "spring-sale" };
const ids = (r, o) => buildUtmChecks(r, o).map((c) => c.id);

test("builds a basic campaign URL", () => {
  const r = buildUtmUrl(base);
  assert.equal(r.valid, true);
  assert.equal(r.url, "https://example.com/page?utm_source=newsletter&utm_medium=email&utm_campaign=spring-sale");
});

test("adds optional term, content and id in a fixed order", () => {
  const r = buildUtmUrl({ ...base, term: "running shoes", content: "hero-banner", id: "123" });
  assert.equal(
    r.url,
    "https://example.com/page?utm_source=newsletter&utm_medium=email&utm_campaign=spring-sale&utm_term=running-shoes&utm_content=hero-banner&utm_id=123"
  );
});

test("a bare domain gets a slash and https, and is flagged as assumed", () => {
  const r = buildUtmUrl({ ...base, url: "example.com" });
  assert.equal(r.url.startsWith("https://example.com/?utm_source="), true);
  assert.equal(r.assumedHttps, true);
  assert.ok(ids(r).includes("utmAssumedHttps"));
  assert.equal(buildUtmUrl(base).assumedHttps, false);
});

test("http is kept, ports and paths are preserved", () => {
  assert.equal(buildUtmUrl({ ...base, url: "http://example.com:8080/a/b/" }).url.startsWith("http://example.com:8080/a/b/?"), true);
  assert.equal(buildUtmUrl({ ...base, url: "example.com:8080/x" }).url.startsWith("https://example.com:8080/x?"), true);
  assert.equal(buildUtmUrl({ ...base, url: "localhost:3000/x" }).valid, true);
});

test("existing query parameters keep their exact encoding and come first", () => {
  const r = buildUtmUrl({ ...base, url: "https://example.com/p?ref=a%20b&x=1+2" });
  assert.equal(r.url, "https://example.com/p?ref=a%20b&x=1+2&utm_source=newsletter&utm_medium=email&utm_campaign=spring-sale");
});

test("the fragment stays at the very end", () => {
  const r = buildUtmUrl({ ...base, url: "https://example.com/p?a=1#pricing" });
  assert.equal(r.url.endsWith("&utm_campaign=spring-sale#pricing"), true);
  assert.equal(r.hasFragment, true);
});

test("existing utm parameters that we set again are replaced and reported", () => {
  const r = buildUtmUrl({ ...base, url: "https://example.com/?utm_source=old&keep=1&UTM_MEDIUM=x" });
  assert.deepEqual(r.replaced.sort(), ["utm_medium", "utm_source"]);
  assert.equal((r.url.match(/utm_source=/g) || []).length, 1);
  assert.equal(r.url.includes("utm_source=old"), false);
  assert.equal(r.url.includes("keep=1"), true);
  assert.ok(ids(r).includes("utmReplaced"));
});

test("an existing utm parameter we do not set is left alone", () => {
  const r = buildUtmUrl({ ...base, url: "https://example.com/?utm_term=keep" });
  assert.equal(r.url.includes("utm_term=keep"), true);
  assert.deepEqual(r.replaced, []);
});

test("values are percent-encoded safely", () => {
  const r = buildUtmUrl({ ...base, campaign: "a&b=c?d#e/é", term: "x y" }, { tidy: false });
  assert.equal(r.url.includes("utm_campaign=a%26b%3Dc%3Fd%23e%2F%C3%A9"), true);
  assert.equal(r.url.includes("utm_term=x%20y"), true);
  assert.equal(new URL(r.url).searchParams.get("utm_campaign"), "a&b=c?d#e/é");
});

test("tidy lowercases and hyphenates; off leaves values as typed", () => {
  assert.equal(tidyValue("  Spring  Sale ", true), "spring-sale");
  assert.equal(tidyValue("  Spring Sale ", false), "Spring Sale");
  assert.equal(buildUtmUrl({ ...base, source: "Facebook Ads" }).url.includes("utm_source=facebook-ads"), true);
  assert.equal(buildUtmUrl({ ...base, source: "Facebook" }, { tidy: false }).url.includes("utm_source=Facebook"), true);
});

test("tidy keeps non-Latin campaign names, encoded", () => {
  const r = buildUtmUrl({ ...base, campaign: "عید سیل" });
  assert.equal(new URL(r.url).searchParams.get("utm_campaign"), "عید-سیل");
});

test("empty and invalid addresses", () => {
  assert.equal(buildUtmUrl({ ...base, url: "" }).error, "empty");
  assert.equal(buildUtmUrl({ ...base, url: "   " }).error, "empty");
  for (const bad of ["not a url", "mailto:a@b.com", "javascript:alert(1)", "ftp://example.com", "http://", "https://localhost-only", "tel:+123"]) {
    const r = buildUtmUrl({ ...base, url: bad });
    assert.equal(r.valid, false, bad);
    assert.equal(r.error, "invalid", bad);
    assert.equal(r.url, "", bad);
  }
  assert.deepEqual(ids(buildUtmUrl({ ...base, url: "not a url" })), ["utmInvalidUrl"]);
});

test("a valid address with no utm values is reported, not built", () => {
  const r = buildUtmUrl({ url: "https://example.com" });
  assert.equal(r.valid, false);
  assert.equal(r.error, "missing");
  assert.deepEqual(ids(r), ["utmNoParams"]);
});

test("checks: source is required, medium and campaign are recommended", () => {
  const noSource = buildUtmUrl({ url: base.url, medium: "email", campaign: "x" });
  assert.equal(noSource.valid, true);
  assert.deepEqual(ids(noSource), ["utmMissingSource"]);
  assert.equal(buildUtmChecks(noSource)[0].state, "fail");

  const onlySource = buildUtmUrl({ url: base.url, source: "x" });
  const c = buildUtmChecks(onlySource).find((x) => x.id === "utmMissingRecommended");
  assert.deepEqual(c.params.fields, ["medium", "campaign"]);
  assert.equal(c.state, "warn");
});

test("checks: uppercase and spaces are only flagged when tidy is off", () => {
  const r = buildUtmUrl({ ...base, source: "Facebook", campaign: "big sale" }, { tidy: false });
  const list = buildUtmChecks(r, { tidy: false });
  assert.deepEqual(list.find((c) => c.id === "utmUppercase").params.fields, ["source"]);
  assert.deepEqual(list.find((c) => c.id === "utmSpaces").params.fields, ["campaign"]);
  const tidy = buildUtmChecks(buildUtmUrl({ ...base, source: "Facebook" }), {});
  assert.deepEqual(tidy.map((c) => c.id), ["utmGood"]);
});

test("checks: very long URLs are flagged", () => {
  const r = buildUtmUrl({ ...base, term: "x".repeat(2100) });
  assert.ok(ids(r).includes("utmLong"));
});

test("checks: a clean link passes; nothing is reported for empty input", () => {
  assert.deepEqual(ids(buildUtmUrl(base)), ["utmGood"]);
  assert.deepEqual(ids(buildUtmUrl({})), []);
});

test("field list is complete and required fields are source, medium, campaign", () => {
  assert.deepEqual(UTM_FIELDS.map((f) => f.param), ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id"]);
  assert.deepEqual(UTM_FIELDS.filter((f) => f.required).map((f) => f.key), ["source", "medium", "campaign"]);
});
