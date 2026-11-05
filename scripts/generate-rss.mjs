// Generates public/feed.xml from src/data/articles.js on every build, so the
// RSS feed is always in sync with whatever articles exist — no manual upkeep
// needed as the daily article routine adds new ones.
import fs from "node:fs";
import path from "node:path";
import { getLatest } from "../src/data/articles.js";

const SITE = "https://bridgesols.com";
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const items = getLatest(30)
  .map((a) => {
    const url = `${SITE}/articles/${a.slug}.html`;
    const pubDate = new Date(a.date + "T07:30:00Z").toUTCString();
    return `  <item>
    <title>${esc(a.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${pubDate}</pubDate>
    <category>${esc(a.category)}</category>
    <description>${esc(a.excerpt)}</description>
  </item>`;
  })
  .join("\n");

const latestDate = getLatest(1)[0]?.date;
const lastBuildDate = latestDate ? new Date(latestDate + "T07:30:00Z").toUTCString() : new Date().toUTCString();

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>BridgeSols</title>
  <link>${SITE}/</link>
  <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
  <description>Practical guides on digital marketing, SEO, content, and building sustainable online businesses.</description>
  <language>en-us</language>
  <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
</channel>
</rss>
`;

const outPath = path.join(import.meta.dirname, "..", "public", "feed.xml");
fs.writeFileSync(outPath, xml, "utf8");
console.log(`Wrote ${outPath} (${getLatest(30).length} items)`);
