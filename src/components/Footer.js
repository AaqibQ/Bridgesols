export function renderFooter(depth = 0) {
  const p = depth > 0 ? "../".repeat(depth) : "./";
  const year = new Date().getFullYear();

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
          <li><a href="${p}services.html">Services</a></li>
          <li><a href="${p}about.html">About</a></li>
          <li><a href="${p}contact.html">Contact</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Guides</h4>
        <ul>
          <li><a href="${p}articles/digital-marketing-strategy-small-businesses.html">Digital Marketing Strategy</a></li>
          <li><a href="${p}articles/seo-for-beginners.html">SEO for Beginners</a></li>
          <li><a href="${p}articles/how-to-start-online-business.html">Starting an Online Business</a></li>
          <li><a href="${p}articles/content-marketing-guide.html">Content Marketing</a></li>
          <li><a href="${p}articles/how-to-grow-a-website.html">Growing a Website</a></li>
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
