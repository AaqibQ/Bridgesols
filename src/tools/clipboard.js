// Copy text to the clipboard. Resolves to true on success, false if the browser refused.
// Uses the async Clipboard API and falls back to a temporary textarea + execCommand for
// older browsers or contexts where the async API isn't available.

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
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
    return ok;
  }
}
