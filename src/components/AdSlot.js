// Ad placeholder markup used across the site.
//
// These are NOT real AdSense units — no publisher ID, no third-party script.
// Each slot is a clearly labeled, correctly sized placeholder so the layout
// is already correct on day one. See ADSENSE-SETUP.md for how to swap these
// for real <ins class="adsbygoogle"> units after AdSense approval.
export function adSlot(label, note = "") {
  return `
  <div class="ad-slot" role="complementary" aria-label="Advertisement placeholder">
    ${label}
    ${note ? `<span class="ad-note">${note}</span>` : ""}
  </div>`;
}

export const AD_LABELS = {
  homepageTop: "Advertisement — Homepage Top",
  homepageMid: "Advertisement — Homepage Mid-page",
  articleTop: "Advertisement — Article Top",
  articleMiddle: "Advertisement — In-Article",
  articleSidebar: "Advertisement — Sidebar",
  articleBottom: "Advertisement — Article Bottom"
};
