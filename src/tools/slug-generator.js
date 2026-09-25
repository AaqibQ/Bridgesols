// Slug Generator — page wiring. All slug rules live in ./slug.js.
// User text is only ever written to the DOM with textContent or as a form control value,
// never as HTML.

import { slugifyLines, buildSlugChecks, previewUrl } from "./slug.js";
import { getStrings } from "./strings.js";
import { copyText } from "./clipboard.js";
import { renderChecks } from "./checks-ui.js";

const EXAMPLE = [
  "How to Start an Online Business",
  "Café Marketing: What Works & What Doesn't",
  "SEO Tools for Small Teams",
  "Email Marketing: A Beginner's Guide"
].join("\n");

export function initSlugGenerator() {
  const $ = (id) => document.getElementById(id);
  const inputEl = $("sg-input");
  if (!inputEl) return;

  const s = getStrings().slug;
  const outputEl = $("sg-output");
  const copyBtn = $("sg-copy");
  const copyStatus = $("sg-copy-status");
  const countEl = $("sg-count");
  const checksEl = $("sg-checks");
  const previewEl = $("sg-preview");
  const previewLabel = $("sg-preview-label");
  const srEl = $("sg-sr-summary");

  const checked = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;

  let srTimer = null;
  let copyTimer = null;

  function options() {
    const rawMax = $("sg-max").value.trim();
    const max = rawMax === "" ? 0 : Math.floor(Number(rawMax));
    return {
      mode: checked("sg-mode") === "unicode" ? "unicode" : "latin",
      separator: checked("sg-sep") === "_" ? "_" : "-",
      lowercase: $("sg-lowercase").checked,
      removeStopWords: $("sg-stop").checked,
      unique: $("sg-unique").checked,
      maxLength: Number.isFinite(max) && max > 0 && max <= 500 ? max : 0
    };
  }

  function render() {
    const opts = options();
    const results = slugifyLines(inputEl.value, opts);
    const slugs = results.filter((r) => r.slug);

    outputEl.value = results.map((r) => r.slug).join("\n");
    outputEl.rows = Math.min(Math.max(results.length, 3), 12);
    copyBtn.disabled = slugs.length === 0;
    countEl.textContent = s.count(slugs.length);

    const first = slugs[0];
    previewLabel.textContent = s.previewLabel(slugs.length);
    previewEl.textContent = first ? previewUrl($("sg-base").value, first.slug) : s.noPreview;

    renderChecks(checksEl, buildSlugChecks(results, opts), {
      messages: s.checks,
      labels: { pass: s.passLabel, warn: s.warnLabel, fail: s.failLabel },
      emptyText: s.noChecks
    });

    clearTimeout(srTimer);
    srTimer = setTimeout(() => (srEl.textContent = s.count(slugs.length)), 1200);
  }

  function showCopyStatus(message) {
    copyStatus.textContent = message;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copyStatus.textContent = ""), 3000);
  }

  for (const el of document.querySelectorAll("#sg-input, #sg-max, #sg-base")) el.addEventListener("input", render);
  for (const el of document.querySelectorAll('input[type="radio"], input[type="checkbox"]')) {
    el.addEventListener("change", render);
  }
  $("sg-example").addEventListener("click", () => {
    inputEl.value = EXAMPLE;
    render();
  });
  $("sg-clear").addEventListener("click", () => {
    inputEl.value = "";
    render();
    inputEl.focus();
  });
  copyBtn.addEventListener("click", async () => {
    // Blank lines in the middle are kept so pasted results line up with the titles (for
    // example in a spreadsheet); only trailing blank lines are dropped.
    const text = outputEl.value.replace(/\n+$/, "");
    showCopyStatus((await copyText(text)) ? s.copied : s.copyFailed);
  });

  render(); // also handles browsers that restore field contents on reload
}
