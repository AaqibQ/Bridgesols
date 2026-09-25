// UTM Link Builder — page wiring. All link rules live in ./utm.js.
// User text is only ever written to the DOM as a form control value or with textContent.

import { buildUtmUrl, buildUtmChecks, UTM_FIELDS } from "./utm.js";
import { getStrings } from "./strings.js";
import { copyText } from "./clipboard.js";
import { renderChecks } from "./checks-ui.js";

const EXAMPLE = {
  url: "https://example.com/spring-sale",
  source: "newsletter",
  medium: "email",
  campaign: "spring-sale",
  term: "",
  content: "header-button",
  id: ""
};

export function initUtmBuilder() {
  const $ = (id) => document.getElementById(id);
  const urlEl = $("ub-url");
  if (!urlEl) return;

  const s = getStrings().utm;
  const outputEl = $("ub-output");
  const copyBtn = $("ub-copy");
  const statusEl = $("ub-status");
  const checksEl = $("ub-checks");
  const tidyEl = $("ub-tidy");
  let copyTimer = null;

  const fieldEl = (key) => $(`ub-${key}`);

  function render() {
    const input = { url: urlEl.value };
    for (const f of UTM_FIELDS) input[f.key] = fieldEl(f.key).value;
    const opts = { tidy: tidyEl.checked };
    const result = buildUtmUrl(input, opts);

    outputEl.value = result.valid ? result.url : "";
    outputEl.placeholder = s.placeholder;
    outputEl.rows = result.valid ? Math.min(Math.max(Math.ceil(result.url.length / 60), 3), 10) : 3;
    copyBtn.disabled = !result.valid;

    renderChecks(checksEl, buildUtmChecks(result, opts), {
      messages: s.checks,
      labels: { pass: s.passLabel, warn: s.warnLabel, fail: s.failLabel },
      emptyText: s.noChecks
    });
  }

  function showStatus(message) {
    statusEl.textContent = message;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (statusEl.textContent = ""), 3000);
  }

  for (const el of document.querySelectorAll("#ub-url, .ub-field")) el.addEventListener("input", render);
  tidyEl.addEventListener("change", render);

  $("ub-example").addEventListener("click", () => {
    urlEl.value = EXAMPLE.url;
    for (const f of UTM_FIELDS) fieldEl(f.key).value = EXAMPLE[f.key];
    render();
  });
  $("ub-clear").addEventListener("click", () => {
    urlEl.value = "";
    for (const f of UTM_FIELDS) fieldEl(f.key).value = "";
    render();
    urlEl.focus();
  });
  copyBtn.addEventListener("click", async () => {
    showStatus((await copyText(outputEl.value)) ? s.copied : s.copyFailed);
  });

  render(); // also handles browsers that restore field contents on reload
}
