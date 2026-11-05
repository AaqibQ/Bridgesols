// Fetches a real HD stock photo for a BridgeSols article, the same way the
// Spire Digi WordPress automation does it (Pixabay, free for commercial use,
// no attribution required) — reusing that same account's API key.
//
// Usage: node scripts/fetch-article-image.mjs <slug> <search query> [--pick N] [--list]
// Writes to public/images/articles/<slug>.jpg
// Pixabay results vary in quality (some are cheesy clipart/text composites) —
// run with --list first to see candidates' tags before picking one with --pick.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const args = process.argv.slice(2);
const listOnly = args.includes("--list");
const pickIdx = args.includes("--pick") ? Number(args[args.indexOf("--pick") + 1]) : 0;
const cleanArgs = args.filter((a, i) => a !== "--list" && a !== "--pick" && args[i - 1] !== "--pick");
const [slug, ...queryParts] = cleanArgs;
const query = queryParts.join(" ");

if (!slug || !query) {
  console.error("Usage: node scripts/fetch-article-image.mjs <slug> <search query> [--list] [--pick N]");
  process.exit(1);
}

const credsPath = path.join(os.homedir(), ".spiredigi", "wp-credentials.env");
const creds = Object.fromEntries(
  fs.readFileSync(credsPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const key = creds.PIXABAY_API_KEY;
if (!key) {
  console.error("PIXABAY_API_KEY not found in", credsPath);
  process.exit(1);
}

const params = new URLSearchParams({
  key,
  q: query.slice(0, 100),
  image_type: "photo",
  orientation: "horizontal",
  safesearch: "true",
  min_width: "1200",
  per_page: "5"
});

const res = await fetch(`https://pixabay.com/api/?${params}`);
if (!res.ok) {
  console.error("Pixabay search failed:", res.status);
  process.exit(1);
}
const { hits } = await res.json();
if (!hits?.length) {
  console.error(`No image found for query: "${query}"`);
  process.exit(1);
}

if (listOnly) {
  hits.forEach((h, i) => console.log(`[${i}] tags: "${h.tags}" — preview: ${h.webformatURL}`));
  process.exit(0);
}

const hit = hits[pickIdx];
const url = hit?.largeImageURL || hit?.webformatURL;
if (!url) {
  console.error(`No hit at index ${pickIdx} (only ${hits.length} results)`);
  process.exit(1);
}

const imgRes = await fetch(url);
const buf = Buffer.from(await imgRes.arrayBuffer());

const outDir = path.join(import.meta.dirname, "..", "public", "images", "articles");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${slug}.jpg`);
fs.writeFileSync(outPath, buf);
console.log(`Wrote ${outPath} (${(buf.length / 1024).toFixed(0)} KB) — query: "${query}", tags: "${hit.tags}"`);
