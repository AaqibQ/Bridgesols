// Case Converter — page wiring. All conversion rules live in ./case.js.
// User text is only ever written to the DOM as a form control value or with textContent.

import { convertCase } from "./case.js";
import { getWords, countCharacters } from "./text-stats.js";
import { getStrings } from "./strings.js";
import { copyText } from "./clipboard.js";

export function initCaseConverter() {
  const $ = (id) => document.getElementById(id);
  const inputEl = $("cc-input");
  if (!inputEl) return;

  const s = getStrings().caseTool;
  const outputEl = $("cc-output");
  const copyBtn = $("cc-copy");
  const statusEl = $("cc-status");
  const statsEl = $("cc-stats");
  let copyTimer = null;

  const currentCase = () => document.querySelector('input[name="cc-case"]:checked')?.value || "upper";

  function render() {
    const text = inputEl.value;
    outputEl.value = convertCase(text, currentCase());
    outputEl.rows = Math.min(Math.max(text.split("\n").length, 4), 14);
    copyBtn.disabled = outputEl.value === "";
    statsEl.textContent = text ? s.stats(countCharacters(text), getWords(text).length) : s.empty;
  }

  function showStatus(message) {
    statusEl.textContent = message;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (statusEl.textContent = ""), 3000);
  }

  inputEl.addEventListener("input", render);
  for (const el of document.querySelectorAll('input[name="cc-case"]')) el.addEventListener("change", render);
  $("cc-clear").addEventListener("click", () => {
    inputEl.value = "";
    render();
    inputEl.focus();
  });
  $("cc-use").addEventListener("click", () => {
    // Move the result back into the input so conversions can be chained (e.g. lower, then title).
    if (!outputEl.value) return;
    inputEl.value = outputEl.value;
    render();
  });
  copyBtn.addEventListener("click", async () => {
    showStatus((await copyText(outputEl.value)) ? s.copied : s.copyFailed);
  });

  render(); // also handles browsers that restore field contents on reload
}
