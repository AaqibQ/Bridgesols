import { getLatest } from "../data/articles.js";
import { TOOLS, toolHref } from "../data/tools.js";

export function renderFooter(depth = 0) {
  const p = depth > 0 ? "../".repeat(depth) : "./";
  const year = new Date().getFullYear();
  // Short label = the part of the title before the colon ("Local SEO: How to..." -> "Local SEO").
  const guideLinks = getLatest(5)
    .map((a) => `<li><a href="${p}articles/${a.slug}.html">${a.title.split(":")[0]}</a></li>`)
    .join("\n          ");

  const toolLinks = TOOLS.map((t) => `<li><a href="${toolHref(t, depth)}">${t.name}</a></li>`)
    .join("\n          ");

  return `
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="${p}index.html" class="brand"><span class="mark"></span>BridgeSols</a>
        <p>A digital publication about digital marketing, SEO, content, and building sustainable online businesses — written to be genuinely useful, not to game search engines.</p>
      </div>
      <div class="footer-col">
        <h4>Explore</h4>
        <ul>
          <li><a href="${p}index.html">Home</a></li>
          <li><a href="${p}articles/index.html">Guides</a></li>
          <li><a href="${p}tools/index.html">Tools</a></li>
          <li><a href="${p}services.html">Services</a></li>
          <li><a href="${p}about.html">About</a></li>
          <li><a href="${p}contact.html">Contact</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Latest guides</h4>
        <ul>
          ${guideLinks}
        </ul>
      </div>
      <div class="footer-col">
        <h4>Free tools</h4>
        <ul>
          ${toolLinks}
        </ul>
      </div>
      <div class="footer-col">
        <h4>Legal</h4>
        <ul>
          <li><a href="${p}privacy-policy.html">Privacy Policy</a></li>
          <li><a href="${p}contact.html">Contact Us</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; ${year} BridgeSols. All rights reserved.</span>
      <span>bridgesols.com</span>
    </div>
  </div>`;
}
