// Word Counter — page wiring. All counting happens in ./text-stats.js.
// User text is only ever written to the DOM with textContent, never innerHTML.

import { analyze, formatDuration } from "./text-stats.js";
import { getStrings } from "./strings.js";

const MAX_KEYWORD_CHARS = 40;

export function initWordCounter() {
  const $ = (id) => document.getElementById(id);
  const textEl = $("wc-text");
  if (!textEl) return;

  const s = getStrings();
  const nf = new Intl.NumberFormat("en-US");
  const out = {
    words: $("wc-words"),
    characters: $("wc-characters"),
    charactersNoSpaces: $("wc-characters-no-spaces"),
    sentences: $("wc-sentences"),
    paragraphs: $("wc-paragraphs"),
    uniqueWords: $("wc-unique"),
    avgWordLength: $("wc-avg"),
    readingTime: $("wc-reading"),
    speakingTime: $("wc-speaking")
  };
  const keywordBody = $("wc-keywords-body");
  const ignoreEl = $("wc-ignore-common");
  const limitEl = $("wc-limit");
  const limitStatus = $("wc-limit-status");
  const copyStatus = $("wc-copy-status");
  const srSummary = $("wc-sr-summary");

  let result = null;
  let runTimer = null;
  let srTimer = null;
  let copyTimer = null;

  function display(r) {
    return {
      words: nf.format(r.words),
      characters: nf.format(r.characters),
      charactersNoSpaces: nf.format(r.charactersNoSpaces),
      sentences: nf.format(r.sentences),
      paragraphs: nf.format(r.paragraphs),
      uniqueWords: nf.format(r.uniqueWords),
      avgWordLength: r.avgWordLength.toFixed(1),
      readingTime: formatDuration(r.readingSeconds, s.units),
      speakingTime: formatDuration(r.speakingSeconds, s.units)
    };
  }

  function renderKeywords(r) {
    keywordBody.textContent = "";
    if (!r.keywords.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 3;
      td.className = "kw-empty";
      td.textContent = !r.words ? s.keywordsEmpty : ignoreEl.checked ? s.keywordsNoneIgnoring : s.keywordsNone;
      tr.appendChild(td);
      keywordBody.appendChild(tr);
      return;
    }
    for (const k of r.keywords) {
      const tr = document.createElement("tr");
      const word = document.createElement("td");
      word.dir = "auto";
      // Very long tokens (URLs, pasted junk) are shortened so one row can't take over
      // the panel; the full text stays available on hover.
      const chars = Array.from(k.word);
      if (chars.length > MAX_KEYWORD_CHARS) {
        word.textContent = chars.slice(0, MAX_KEYWORD_CHARS - 1).join("") + "…";
        word.title = k.word;
      } else {
        word.textContent = k.word;
      }
      const count = document.createElement("td");
      count.textContent = nf.format(k.count);
      const pct = document.createElement("td");
      pct.textContent = `${k.percent.toFixed(1)}%`;
      tr.append(word, count, pct);
      keywordBody.appendChild(tr);
    }
  }

  function renderLimit() {
    // Number() (not parseInt) so "1e3" means 1000; the cap keeps absurd values from showing.
    const raw = limitEl.value.trim();
    const limit = raw === "" ? NaN : Math.floor(Number(raw));
    if (!Number.isFinite(limit) || limit < 1 || limit > 1e9 || !result) {
      limitStatus.textContent = "";
      delete limitStatus.dataset.state;
      return;
    }
    const diff = limit - result.characters;
    if (diff >= 0) {
      limitStatus.textContent = s.limitLeft(diff, nf.format(diff));
      limitStatus.dataset.state = "ok";
    } else {
      limitStatus.textContent = s.limitOver(-diff, nf.format(-diff));
      limitStatus.dataset.state = "over";
    }
  }

  function scheduleScreenReaderSummary() {
    clearTimeout(srTimer);
    srTimer = setTimeout(() => {
      srSummary.textContent = s.srSummary(result, display(result));
    }, 1200);
  }

  function run() {
    result = analyze(textEl.value, { ignoreCommonWords: ignoreEl.checked });
    const d = display(result);
    for (const key of Object.keys(out)) out[key].textContent = d[key];
    renderKeywords(result);
    renderLimit();
    scheduleScreenReaderSummary();
  }

  // Short text updates instantly; big pastes are debounced so typing stays smooth.
  function schedule() {
    clearTimeout(runTimer);
    const len = textEl.value.length;
    const delay = len > 100000 ? 250 : len > 20000 ? 100 : 0;
    if (delay === 0) run();
    else runTimer = setTimeout(run, delay);
  }

  function summaryText() {
    const d = display(result);
    return Object.keys(s.summaryLabels)
      .map((key) => `${s.summaryLabels[key]}: ${d[key]}`)
      .join("\n");
  }

  function showCopyStatus(message) {
    copyStatus.textContent = message;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copyStatus.textContent = ""), 3000);
  }

  async function copyResults() {
    if (!result) run();
    const text = summaryText();
    try {
      await navigator.clipboard.writeText(text);
      showCopyStatus(s.copied);
    } catch {
      // Fallback for browsers or contexts without the async clipboard API.
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      helper.remove();
      showCopyStatus(ok ? s.copied : s.copyFailed);
    }
  }

  textEl.addEventListener("input", schedule);
  ignoreEl.addEventListener("change", run);
  limitEl.addEventListener("input", renderLimit);
  $("wc-clear").addEventListener("click", () => {
    textEl.value = "";
    run();
    textEl.focus();
  });
  $("wc-copy").addEventListener("click", copyResults);

  run(); // also handles browsers that restore textarea contents on reload
}
