// Structural checks for the free tools, run in CI before every deploy. They catch a tool that is
// half wired in (page missing, not built, not linked, or a page whose HTML no longer matches
// the ids its script looks for).

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { TOOLS, toolHref, getOtherTools } from "../src/data/tools.js";

const root = path.resolve(import.meta.dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
const viteConfig = read("vite.config.js");
const sitemap = read("public/sitemap.xml");
const hub = read("tools/index.html");
const mainJs = read("src/main.js");

// The script that wires each page (word-counter and meta checker use different id styles,
// so they are only covered by the generic checks).
const WIRING = {
  "slug-generator": "src/tools/slug-generator.js",
  "case-converter": "src/tools/case-converter.js",
  "utm-link-builder": "src/tools/utm-builder.js"
};

const page = (tool) => read(`tools/${tool.slug}.html`);

test("tool slugs are unique and every tool has its details", () => {
  const slugs = TOOLS.map((t) => t.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate slug in tools.js");
  for (const t of TOOLS) {
    assert.ok(t.name && t.blurb && t.description && t.icon, `${t.slug}: missing name, blurb, description or icon`);
  }
});

test("every tool has a page whose data-tool matches, and every page in the folder is listed", () => {
  for (const t of TOOLS) {
    assert.ok(fs.existsSync(path.join(root, `tools/${t.slug}.html`)), `missing tools/${t.slug}.html`);
    assert.ok(page(t).includes(`data-tool="${t.slug}"`), `${t.slug}: data-tool does not match`);
  }
  const listed = new Set(TOOLS.map((t) => t.slug));
  const pages = fs.readdirSync(path.join(root, "tools")).filter((f) => f.endsWith(".html") && f !== "index.html");
  for (const file of pages) assert.ok(listed.has(file.replace(/\.html$/, "")), `${file} exists but is not in tools.js`);
});

test("every tool is a Vite build entry, in the sitemap, on the hub and started by main.js", () => {
  for (const t of TOOLS) {
    assert.ok(viteConfig.includes(`tools/${t.slug}.html`), `${t.slug}: not in vite.config.js, so it would not be built`);
    assert.ok(sitemap.includes(`https://bridgesols.com/tools/${t.slug}.html`), `${t.slug}: missing from public/sitemap.xml`);
    assert.ok(hub.includes(`href="${t.slug}.html"`), `${t.slug}: no card on tools/index.html`);
    assert.ok(mainJs.includes(`"${t.slug}"`), `${t.slug}: main.js never starts it`);
  }
});

test("each tool page has a correct title, description, canonical, JSON-LD and analytics tags", () => {
  for (const t of TOOLS) {
    const html = page(t);
    const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.replace(/&amp;/g, "&") ?? "";
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] ?? "";
    assert.ok(title && title.length <= 60, `${t.slug}: <title> is ${title.length} chars (max 60)`);
    assert.ok(desc && desc.length <= 155, `${t.slug}: description is ${desc.length} chars (max 155)`);
    assert.ok(html.includes(`<link rel="canonical" href="https://bridgesols.com/tools/${t.slug}.html" />`), `${t.slug}: wrong canonical`);
    assert.ok(html.includes("adsbygoogle") && html.includes("G-CHM1D4R5CF"), `${t.slug}: AdSense or GA4 tag missing`);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${t.slug}: needs exactly one <h1>`);
    assert.ok(html.includes('id="more-tools"'), `${t.slug}: missing the more-tools list`);

    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(blocks.length >= 2, `${t.slug}: expected WebApplication and BreadcrumbList JSON-LD`);
    const types = blocks.map((b) => JSON.parse(b[1])["@type"]);
    assert.ok(types.includes("WebApplication") && types.includes("BreadcrumbList"), `${t.slug}: JSON-LD types are ${types}`);
  }
});

test("no duplicate ids on any tool page", () => {
  for (const t of TOOLS) {
    const ids = [...page(t).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepEqual(dupes, [], `${t.slug}: duplicate ids ${dupes}`);
  }
});

test("every element id a tool script looks up exists on its page", () => {
  for (const [slug, file] of Object.entries(WIRING)) {
    const html = page({ slug });
    const src = read(file);
    const wanted = new Set([...src.matchAll(/\$\("([\w-]+)"\)/g)].map((m) => m[1]));
    for (const m of src.matchAll(/querySelectorAll\("([^"]+)"\)/g)) {
      for (const id of m[1].matchAll(/#([\w-]+)/g)) wanted.add(id[1]);
    }
    for (const id of wanted) assert.ok(html.includes(`id="${id}"`), `${slug}: script needs #${id} but the page has none`);
  }
});

test("UTM builder page has a field for every UTM parameter", async () => {
  const { UTM_FIELDS } = await import("../src/tools/utm.js");
  const html = page({ slug: "utm-link-builder" });
  for (const f of UTM_FIELDS) assert.ok(html.includes(`id="ub-${f.key}"`), `no field for ${f.param}`);
});

test("every case option on the Case Converter page is a real conversion", async () => {
  const { CASES } = await import("../src/tools/case.js");
  const html = page({ slug: "case-converter" });
  const options = [...html.matchAll(/name="cc-case" id="[^"]+" value="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...options].sort(), [...CASES].sort());
});

test("tool links resolve to real files from every kind of page", () => {
  const cases = [
    { depth: 0, from: "" }, // homepage
    { depth: 1, from: "articles" },
    { depth: 1, from: "tools" }
  ];
  for (const t of TOOLS) {
    for (const c of cases) {
      const target = path.normalize(path.join(root, c.from, toolHref(t, c.depth)));
      assert.ok(fs.existsSync(target), `${t.slug}: link from ${c.from || "home"} points at ${target}`);
    }
  }
  assert.equal(getOtherTools("word-counter").length, TOOLS.length - 1);
  assert.ok(!getOtherTools("word-counter").some((t) => t.slug === "word-counter"));
});

test("the tools hub page has a title and description within the search-result limits", () => {
  const title = (hub.match(/<title>([\s\S]*?)<\/title>/) || [])[1] ?? "";
  const desc = (hub.match(/<meta name="description" content="([^"]*)"/) || [])[1] ?? "";
  assert.ok(title.length > 0 && title.length <= 60, `hub title is ${title.length} chars`);
  assert.ok(desc.length > 0 && desc.length <= 155, `hub description is ${desc.length} chars`);
});
