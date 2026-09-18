const NAV_ITEMS = [
  { label: "Home", href: "/", match: "home" },
  { label: "Digital Marketing", href: "/articles/#digital-marketing", match: "articles" },
  { label: "Online Business", href: "/articles/#online-business", match: "articles" },
  { label: "SEO", href: "/articles/#seo", match: "articles" },
  { label: "Guides", href: "/articles/", match: "articles" },
  { label: "Services", href: "/services.html", match: "services" },
  { label: "About", href: "/about.html", match: "about" }
];

export function renderHeader(activePage, depth = 0) {
  const prefix = depth > 0 ? "../".repeat(depth) : "./";
  const navHtml = NAV_ITEMS.map((item) => {
    const href = item.href.startsWith("/") ? prefix + item.href.slice(1) : item.href;
    const current = item.match === activePage ? ' aria-current="page"' : "";
    return `<li><a href="${href}"${current}>${item.label}</a></li>`;
  }).join("");

  return `
  <div class="wrap">
    <a href="${prefix}index.html" class="brand"><span class="mark"></span>BridgeSols</a>
    <nav class="main-nav" aria-label="Primary">
      <ul>${navHtml}</ul>
    </nav>
    <div class="header-cta">
      <a href="${prefix}index.html#newsletter" class="btn btn-ghost">Subscribe</a>
      <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="mobile-nav">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
  <div class="mobile-nav" id="mobile-nav">
    <ul style="display:flex;flex-direction:column;gap:20px;">${navHtml}</ul>
    <a href="${prefix}index.html#newsletter" class="btn btn-primary">Subscribe</a>
  </div>`;
}
