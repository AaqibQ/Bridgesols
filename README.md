# BridgeSols

A premium, dark-themed editorial publication about digital marketing, SEO, content marketing, and building sustainable online businesses. Built with vanilla JS + Vite, Three.js, GSAP/ScrollTrigger, and Lenis for smooth scrolling.

**Live domain (once deployed):** https://bridgesols.com

---

## 1. Installation

You need [Node.js](https://nodejs.org) 18+ installed (this project was built and tested against Node 22).

```bash
node --version   # confirm Node is installed
npm install      # install dependencies (Vite, Three.js, GSAP, Lenis)
```

## 2. Run the dev server

```bash
npm run dev
```

This starts Vite's dev server (with hot reload) and prints a local URL, typically `http://localhost:5173`.

## 3. Build for production

```bash
npm run build
```

Output goes to `dist/`. This is a static site — the build output can be hosted anywhere that serves static files.

## 4. Preview the production build locally

```bash
npm run preview
```

---

## Project structure

```
bridgesols/
├── index.html                     Homepage
├── about.html
├── contact.html
├── privacy-policy.html
├── sitemap.xml
├── robots.txt
├── ADSENSE-SETUP.md
├── articles/
│   ├── index.html                 Guides hub, grouped by category
│   └── *.html                     5 full-length articles
├── public/
│   ├── favicon.svg
│   └── images/og-cover.svg
└── src/
    ├── main.js                    Entry point — wires everything together
    ├── styles/                    main.css, responsive.css, article.css
    ├── components/                Header, Footer, Newsletter, AdSlot, ArticleCard
    ├── three/                     HeroScene, particles, effects (Three.js hero visual)
    ├── animations/                hero, scroll, transitions (GSAP + Lenis + ScrollTrigger)
    └── data/articles.js           Article metadata used to render listings
```

Each top-level HTML page is a separate Vite entry point (see `vite.config.js`), all sharing the same `src/main.js`, which reads `document.body.dataset.page` to decide what to initialize on that page (hero Three.js scene on the homepage only, contact form validation on the contact page only, table-of-contents highlighting on article pages only, etc).

---

## Deployment

This is a static site after `npm run build` — any static host works. Three good options:

### Vercel
1. Push this project to a GitHub repository.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Deploy, then add `bridgesols.com` under Project → Settings → Domains.

### Netlify
1. Push to GitHub, then "Add new site → Import an existing project" in Netlify.
2. Build command: `npm run build`. Publish directory: `dist`.
3. Add `bridgesols.com` under Site settings → Domain management → Add custom domain.

### Cloudflare Pages
1. Connect the GitHub repo in the Cloudflare dashboard under Pages.
2. Build command: `npm run build`. Build output directory: `dist`.
3. Add `bridgesols.com` under Custom domains once the first deploy succeeds.

### Domain, DNS, and HTTPS for bridgesols.com
1. Whichever host you choose (Vercel/Netlify/Cloudflare) will give you exact DNS records to add — usually an `A`/`ALIAS` record for the root domain and a `CNAME` for `www`.
2. Log into wherever `bridgesols.com` is registered and add those records under DNS management.
3. DNS changes can take anywhere from a few minutes to ~48 hours to propagate.
4. All three hosts above issue and renew HTTPS certificates automatically once DNS is pointed correctly — no manual certificate setup needed.
5. Decide whether the canonical URL is `bridgesols.com` or `www.bridgesols.com` and set up a redirect from the other — all canonical URLs, sitemap entries, and structured data in this project currently assume the bare `bridgesols.com` (no `www`). Update them if you choose `www` instead.

---

## Google Analytics (GA4)

No GA4 Measurement ID is included in this project — adding a fake one would silently break real analytics later. To enable analytics:

1. Create a GA4 property at [analytics.google.com](https://analytics.google.com) and get your Measurement ID (format: `G-XXXXXXXXXX`).
2. Add the standard GA4 snippet to the `<head>` of every HTML page (or, cleaner, add it once inside `src/main.js` so it's bundled everywhere automatically), replacing `G-XXXXXXXXXX` with your real ID:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```
3. Rebuild and redeploy.

## Google Search Console

1. Go to [search.google.com/search-console](https://search.google.com/search-console) and create a property for `bridgesols.com` (domain property is recommended — it covers `www` and non-`www` automatically via DNS verification).
2. Verify ownership using the DNS TXT record method (add the record at your domain registrar).
3. Once verified, submit `https://bridgesols.com/sitemap.xml` under Sitemaps.
4. Use URL Inspection on key pages (homepage, each article) to confirm they're indexed, and request indexing manually if needed right after launch.
5. Check the Coverage and Performance reports periodically to monitor indexing issues and search traffic.

---

## Newsletter integration

The newsletter forms (`src/components/Newsletter.js`) are fully validated on the frontend but **not connected to an email provider yet** — by design, they do not claim a successful subscription until a real backend exists, so nobody is misled about being subscribed.

To connect a provider:
1. Choose a provider — Mailchimp, Brevo, ConvertKit, and Buttondown all have simple subscribe APIs.
2. Add `data-endpoint="https://your-provider-endpoint"` to each `<form class="newsletter-form">` in the HTML.
3. `Newsletter.js` already has the `fetch()` call ready — it activates automatically once `data-endpoint` is present. Adjust the request body/headers to match your provider's API if needed.

## Contact form integration

`contact.html`'s form validates client-side and submits to [Web3Forms](https://web3forms.com), which emails each message to the owner's inbox. The destination address is bound to the access key on Web3Forms' side, so it never appears in the code or on the page.

- The key lives in the form's `data-access-key` attribute in `contact.html`. Web3Forms access keys are designed to be public.
- With an empty key the form tells visitors it's unavailable instead of pretending to send.
- To change the inbox, create a new key at web3forms.com for the new address and replace the attribute value.
- A hidden `botcheck` checkbox acts as a honeypot for spam bots.

---

## Performance notes

- The Three.js hero scene uses a significantly reduced node/particle count and skips ambient geometry entirely on screens under 760px wide, and caps `devicePixelRatio` (1.5 on mobile, 2 on desktop).
- The hero scene pauses its render loop via `IntersectionObserver` when scrolled out of view.
- Lenis smooth scrolling and most non-essential animation are skipped entirely when the visitor's OS has "reduce motion" enabled (`prefers-reduced-motion: reduce`).
- Google Fonts are loaded with `display=swap` to avoid blocking text rendering.

## Accessibility notes

- A "Skip to content" link is present on every page.
- Reduced-motion is respected across CSS transitions, GSAP animations, and the Three.js scene.
- All interactive elements are keyboard-reachable with visible focus states; the mobile nav toggle uses proper `aria-expanded`/`aria-controls`.
- Form fields have associated labels and live-region error/status messages.

---

## AdSense

See **[ADSENSE-SETUP.md](./ADSENSE-SETUP.md)** for the full, honest step-by-step guide. Short version: no publisher ID or AdSense script is included anywhere in this project — the `.ad-slot` elements are clearly labeled layout placeholders only, ready to be swapped for real ad units once you're approved.
