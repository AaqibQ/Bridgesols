// Meta Length Checker — page wiring. All measuring and rules live in ./meta-length.js.
// User text is only ever written to the DOM with textContent or as a form control value,
// never as HTML.

import {
  LIMITS,
  FONT_PX,
  estimateRunWidth,
  evaluateTitle,
  evaluateDescription,
  truncateToWidth,
  formatUrl,
  buildChecks,
  toHtmlSnippet
} from "./meta-length.js";
import { getStrings } from "./strings.js";
import { copyText } from "./clipboard.js";

const EXAMPLE = {
  title: "Small Business Digital Marketing Strategy Guide | BridgeSols",
  description:
    "A step-by-step framework for a digital marketing strategy: audience research, channels, budget, KPIs and a 90-day plan.",
  url: "https://bridgesols.com/articles/digital-marketing-strategy-small-businesses.html",
  keyword: "digital marketing strategy"
};

/** Canvas-based measurer for text outside the built-in Arial table (Urdu, Arabic, CJK, emoji). */
function createMeasurer() {
  let ctx = null;
  try {
    ctx = document.createElement("canvas").getContext("2d");
  } catch {
    ctx = null;
  }
  if (!ctx) return estimateRunWidth;
  const cache = new Map();
  return (run, sizePx) => {
    const key = `${sizePx}|${run}`;
    if (cache.has(key)) return cache.get(key);
    ctx.font = `${sizePx}px Arial, "Liberation Sans", Helvetica, sans-serif`;
    const width = ctx.measureText(run).width || estimateRunWidth(run, sizePx);
    if (cache.size > 500) cache.clear();
    cache.set(key, width);
    return width;
  };
}

export function initMetaChecker() {
  const $ = (id) => document.getElementById(id);
  const titleEl = $("ml-title");
  if (!titleEl) return;

  const s = getStrings().meta;
  const nf = new Intl.NumberFormat("en-US");
  const measure = createMeasurer();

  const descEl = $("ml-description");
  const urlEl = $("ml-url");
  const keywordEl = $("ml-keyword");
  const mobileEl = $("ml-mode-mobile");
  const snippetEl = $("ml-snippet");
  const copyBtn = $("ml-copy");
  const copyStatus = $("ml-copy-status");
  const checksEl = $("ml-checks");
  const srEl = $("ml-sr-summary");
  const serp = $("ml-serp");

  const meters = {
    title: { fill: $("ml-title-fill"), mark: $("ml-title-mark"), count: $("ml-title-count"), status: $("ml-title-status") },
    description: {
      fill: $("ml-description-fill"),
      mark: $("ml-description-mark"),
      count: $("ml-description-count"),
      status: $("ml-description-status")
    }
  };

  let srTimer = null;
  let copyTimer = null;

  // The bar runs to 120% of the limit so an overflow is visible; the tick marks 100%.
  const SCALE = 1.2;
  const METER_STATE = { empty: "empty", short: "warn", good: "good", long: "bad" };

  function renderMeter(meter, ev) {
    const ratio = Math.min(ev.px / ev.limitPx, SCALE) / SCALE;
    meter.fill.style.width = `${(ratio * 100).toFixed(1)}%`;
    meter.fill.parentElement.dataset.state = METER_STATE[ev.status];
    meter.mark.style.left = `${(100 / SCALE).toFixed(1)}%`;
    meter.count.textContent = s.count({
      chars: nf.format(ev.chars),
      px: nf.format(ev.px),
      limitChars: nf.format(ev.limitChars),
      limitPx: nf.format(ev.limitPx)
    });
    meter.status.textContent = s.status[ev.status];
    meter.status.dataset.state = METER_STATE[ev.status];
  }

  function setText(el, text, placeholder) {
    el.textContent = text || placeholder;
    if (text) delete el.dataset.placeholder;
    else el.dataset.placeholder = "true";
  }

  function renderPreview(title, description, mobile) {
    serp.dataset.mode = mobile ? "mobile" : "desktop";
    const url = formatUrl(urlEl.value);
    $("ml-serp-favicon").textContent = url.host.charAt(0).toUpperCase();
    $("ml-serp-site").textContent = url.host;
    $("ml-serp-url").textContent = url.display;

    const titleCut = truncateToWidth(title.text, LIMITS.title.px, FONT_PX.title, measure);
    setText($("ml-serp-title"), titleCut.text, s.placeholderTitle);
    const descCut = truncateToWidth(description.text, description.limitPx, FONT_PX.description, measure);
    setText($("ml-serp-description"), descCut.text, s.placeholderDescription);
  }

  function renderChecks(checks) {
    checksEl.textContent = "";
    if (!checks.length) {
      const li = document.createElement("li");
      li.dataset.state = "info";
      li.textContent = s.noChecks;
      checksEl.appendChild(li);
      return;
    }
    const labels = { pass: s.passLabel, warn: s.warnLabel, fail: s.failLabel };
    for (const check of checks) {
      const li = document.createElement("li");
      li.dataset.state = check.state;
      const icon = document.createElement("span");
      icon.className = "check-icon";
      icon.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.className = "visually-hidden";
      label.textContent = `${labels[check.state]}: `;
      const message = document.createElement("span");
      message.textContent = s.checks[check.id](check.params);
      li.append(icon, label, message);
      checksEl.appendChild(li);
    }
  }

  function scheduleScreenReaderSummary(title, description) {
    clearTimeout(srTimer);
    srTimer = setTimeout(() => {
      srEl.textContent = s.srSummary({
        title: { chars: title.chars, statusText: s.status[title.status].toLowerCase() },
        description: { chars: description.chars, statusText: s.status[description.status].toLowerCase() }
      });
    }, 1200);
  }

  function render() {
    const mobile = mobileEl.checked;
    const title = evaluateTitle(titleEl.value, measure);
    const description = evaluateDescription(descEl.value, { mobile, measureRun: measure });

    renderMeter(meters.title, title);
    renderMeter(meters.description, description);
    renderPreview(title, description, mobile);
    renderChecks(
      titleEl.value.trim() || descEl.value.trim()
        ? buildChecks({
            title: titleEl.value,
            description: descEl.value,
            url: urlEl.value,
            keyword: keywordEl.value,
            mobile,
            measureRun: measure
          })
        : []
    );

    snippetEl.value = toHtmlSnippet(titleEl.value, descEl.value);
    copyBtn.disabled = !snippetEl.value;
    scheduleScreenReaderSummary(title, description);
  }

  function fill(values) {
    titleEl.value = values.title;
    descEl.value = values.description;
    urlEl.value = values.url;
    keywordEl.value = values.keyword;
    render();
  }

  function showCopyStatus(message) {
    copyStatus.textContent = message;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copyStatus.textContent = ""), 3000);
  }

  for (const el of [titleEl, descEl, urlEl, keywordEl]) el.addEventListener("input", render);
  for (const el of document.querySelectorAll('input[name="ml-mode"]')) el.addEventListener("change", render);
  $("ml-clear").addEventListener("click", () => {
    fill({ title: "", description: "", url: "", keyword: "" });
    titleEl.focus();
  });
  $("ml-example").addEventListener("click", () => fill(EXAMPLE));
  copyBtn.addEventListener("click", async () => {
    showCopyStatus((await copyText(snippetEl.value)) ? s.copiedHtml : s.copyHtmlFailed);
  });

  // On phones the mobile preview is the relevant one and it fits the screen.
  if (window.matchMedia("(max-width: 640px)").matches) mobileEl.checked = true;

  render(); // also handles browsers that restore field contents on reload
}
