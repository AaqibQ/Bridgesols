// Structural checks for the article catalogue. These run in CI before every deploy,
// including the ones triggered by the daily article routine, so an article that
// is half wired in (page missing, not registered in the build) never goes live.
//
// SEO length limits are reported as warnings rather than failures on purpose:
// they should be fixed, but they must not block a deploy.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { articles, getLatest, getRelated } from "../src/data/articles.js";

const root = path.resolve(import.meta.dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
const viteConfig = read("vite.config.js");
const sitemap = read("public/sitemap.xml");
const guidesIndex = read("articles/index.html");

test("every article slug is unique and every date is a real ISO date", () => {
  const slugs = articles.map((a) => a.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate slug in articles.js");
  for (const a of articles) {
    assert.match(a.date, /^\d{4}-\d{2}-\d{2}$/, `${a.slug}: bad date ${a.date}`);
    assert.ok(!Number.isNaN(new Date(a.date + "T00:00:00").getTime()), `${a.slug}: unparseable date`);
    assert.ok(a.title && a.excerpt && a.category, `${a.slug}: missing title, excerpt or category`);
  }
});

test("every article has its page, and the page points back at the same slug", () => {
  for (const a of articles) {
    const file = `articles/${a.slug}.html`;
    assert.ok(fs.existsSync(path.join(root, file)), `missing page ${file}`);
    assert.ok(read(file).includes(`data-slug="${a.slug}"`), `${file}: data-slug does not match`);
  }
});

test("every article page is registered as a Vite build entry", () => {
  for (const a of articles) {
    assert.ok(viteConfig.includes(`articles/${a.slug}.html`), `${a.slug} is not in vite.config.js, so it would not be built`);
  }
});

test("every article page in the folder is listed in articles.js", () => {
  const listed = new Set(articles.map((a) => a.slug));
  const pages = fs.readdirSync(path.join(root, "articles")).filter((f) => f.endsWith(".html") && f !== "index.html");
  for (const file of pages) {
    assert.ok(listed.has(file.replace(/\.html$/, "")), `${file} exists but is not in articles.js`);
  }
});

test("getLatest returns the newest first, and the last-added first on the same day", () => {
  const latest = getLatest();
  for (let i = 1; i < latest.length; i++) {
    assert.ok(new Date(latest[i - 1].date) >= new Date(latest[i].date), "not sorted newest first");
  }
  const newestDate = articles.map((a) => a.date).sort().at(-1);
  const lastAddedThatDay = [...articles].reverse().find((a) => a.date === newestDate);
  assert.equal(latest[0].slug, lastAddedThatDay.slug);
  assert.equal(getLatest(3).length, 3);
});

test("getRelated never returns the article itself", () => {
  for (const a of articles) {
    const related = getRelated(a.slug, 2);
    assert.equal(related.length, Math.min(2, articles.length - 1));
    assert.ok(!related.some((r) => r.slug === a.slug), `${a.slug} lists itself as related`);
  }
});

test("SEO and wiring hygiene (warnings only, never blocks a deploy)", (t) => {
  const warnings = [];
  for (const a of articles) {
    const html = read(`articles/${a.slug}.html`);
    const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.replace(/&amp;/g, "&") ?? "";
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] ?? "";
    if (title.length > 60) warnings.push(`${a.slug}: <title> is ${title.length} chars (aim for 60 or fewer)`);
    if (desc.length > 155) warnings.push(`${a.slug}: meta description is ${desc.length} chars (aim for 155 or fewer)`);
    if (!sitemap.includes(`/articles/${a.slug}.html`)) warnings.push(`${a.slug}: missing from public/sitemap.xml`);
    if (!guidesIndex.includes(`${a.slug}.html`)) warnings.push(`${a.slug}: no card on the guides page`);
    if (!html.includes("adsbygoogle")) warnings.push(`${a.slug}: AdSense script missing`);
    if (!html.includes("G-CHM1D4R5CF")) warnings.push(`${a.slug}: GA4 tag missing`);
  }
  if (warnings.length) t.diagnostic(`${warnings.length} warning(s):\n  - ${warnings.join("\n  - ")}`);
  else t.diagnostic("no warnings");
});
