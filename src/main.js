import "./styles/main.css";
import "./styles/responsive.css";
import "./styles/article.css";
import "./styles/tools.css";
import "./styles/tools-meta.css";
import "./styles/tools-more.css";

import { renderHeader } from "./components/Header.js";
import { renderFooter } from "./components/Footer.js";
import { initNewsletterForms } from "./components/Newsletter.js";
import { articleCard } from "./components/ArticleCard.js";
import { getRelated, getLatest } from "./data/articles.js";
import { TOOLS, toolHref, getOtherTools } from "./data/tools.js";
import { WEB3FORMS_ACCESS_KEY, WEB3FORMS_URL, WHATSAPP_URL, CONTACT_EMAIL } from "./config.js";

import { playHeroEntrance } from "./animations/hero.js";
import {
  initSmoothScroll,
  initHeaderScroll,
  initScrollReveals,
  initHorizontalTopics,
  initTocHighlight,
  refresh
} from "./animations/scroll.js";
import { initMobileNav, initCardHover, initMagneticButtons } from "./animations/transitions.js";

const body = document.body;
const page = body.dataset.page || "home";
const depth = Number(body.dataset.depth || 0);

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = reducedMotionQuery.matches;

/* ---------------- Shared chrome (header/footer) ---------------- */
const headerMount = document.getElementById("site-header");
const footerMount = document.getElementById("site-footer");
if (headerMount) headerMount.innerHTML = renderHeader(page, depth);
if (footerMount) footerMount.innerHTML = renderFooter(depth);

/* ---------------- Smooth scroll + ScrollTrigger ---------------- */
initSmoothScroll(reducedMotion);
initHeaderScroll();
initScrollReveals(reducedMotion);
initMobileNav();
initCardHover();
initMagneticButtons();
initNewsletterForms();

/* ---------------- Homepage-only ---------------- */
if (page === "home") {
  initHomepage();
}

/* ---------------- Article pages ---------------- */
if (page === "article") {
  initArticlePage();
}

/* ---------------- Contact page ---------------- */
if (page === "contact") {
  initContactForm();
}

/* ---------------- Our Work page ---------------- */
if (page === "work") {
  const toolsHost = document.getElementById("work-tools");
  if (toolsHost) {
    toolsHost.innerHTML = TOOLS.map((t) => toolCard(t, depth)).join("");
  }
}

/* ---------------- Tool pages ---------------- */
if (page === "tool") {
  initMoreTools();
}
if (page === "tool" && body.dataset.tool === "word-counter") {
  import("./tools/word-counter.js").then((m) => m.initWordCounter());
}
if (page === "tool" && body.dataset.tool === "meta-length-checker") {
  import("./tools/meta-checker.js").then((m) => m.initMetaChecker());
}
if (page === "tool" && body.dataset.tool === "slug-generator") {
  import("./tools/slug-generator.js").then((m) => m.initSlugGenerator());
}
if (page === "tool" && body.dataset.tool === "case-converter") {
  import("./tools/case-converter.js").then((m) => m.initCaseConverter());
}
if (page === "tool" && body.dataset.tool === "utm-link-builder") {
  import("./tools/utm-builder.js").then((m) => m.initUtmBuilder());
}

reducedMotionQuery.addEventListener("change", (e) => {
  reducedMotion = e.matches;
  window.location.reload();
});

initRobustImages();

/* ================================================================== */

// Firebase Hosting's CDN occasionally serves these JPEGs with a
// Content-Encoding: gzip header whose declared Content-Length doesn't
// match the actual compressed stream, which makes the native <img>
// loader fail even though the bytes are valid (fetch()+blob() decodes
// them correctly). Retry once that way before giving up.
//
// These images start loading the instant the HTML is parsed, well
// before this deferred module script runs — so a failed image may
// already be "complete" (with naturalWidth 0) by the time we get here,
// and attaching an "error" listener alone would miss that. Check for
// that already-failed state directly, and only listen for a future
// error on images still in flight.
function initRobustImages() {
  document.querySelectorAll(".card-media img, .article-hero-image img").forEach((img) => {
    const retry = async () => {
      try {
        const res = await fetch(img.src);
        if (!res.ok) throw new Error("fetch failed");
        const blob = await res.blob();
        img.src = URL.createObjectURL(blob);
      } catch {
        img.remove();
      }
    };
    if (img.complete) {
      if (img.naturalWidth === 0) retry();
    } else {
      img.addEventListener("error", retry, { once: true });
    }
  });
}

function initHomepage() {
  const canvasHost = document.querySelector(".hero-canvas");
  if (canvasHost) {
    // Dynamically imported so Three.js is only ever downloaded on the
    // homepage — article/about/contact pages never pay for this bundle.
    import("./three/HeroScene.js").then(({ HeroScene }) => {
      const scene = new HeroScene(canvasHost, { reducedMotion });
      window.addEventListener("beforeunload", () => scene.dispose());
    });
  }
  playHeroEntrance(reducedMotion);

  const latestHost = document.getElementById("latest-articles");
  if (latestHost) {
    latestHost.innerHTML = getLatest(6).map((a) => articleCard(a, "articles/")).join("");
  }

  const toolsHost = document.getElementById("home-tools");
  if (toolsHost) {
    toolsHost.innerHTML = TOOLS.map((t) => toolCard(t, depth)).join("");
  }

  initHorizontalTopics();
  requestAnimationFrame(refresh);
}

function initArticlePage() {
  initTocHighlight();

  const slug = body.dataset.slug;
  const relatedHost = document.getElementById("related-articles");
  const sidebarRelatedHost = document.getElementById("sidebar-related");
  if (slug) {
    const related = getRelated(slug, 2);
    if (relatedHost) {
      relatedHost.innerHTML = related.map((a) => articleCard(a, "./")).join("");
    }
    if (sidebarRelatedHost) {
      sidebarRelatedHost.innerHTML = related
        .map((a) => `<a href="./${a.slug}.html">${a.title}</a>`)
        .join("");
    }
  }

  // "Free tools" block just above "Related", so every article links to every tool.
  const relatedBlock = sidebarRelatedHost && sidebarRelatedHost.closest(".sidebar-block");
  if (relatedBlock) {
    const block = document.createElement("div");
    block.className = "sidebar-block";
    block.innerHTML =
      `<h4>Free tools</h4><div class="sidebar-related">${TOOLS.map((t) => `<a href="${toolHref(t, depth)}">${t.name}</a>`).join("")}</div>`;
    relatedBlock.before(block);
  }

  // Sidebar CTA, placed right after the TOC so it's seen early, not buried below the fold.
  const newsletterBlock = document.querySelector(".sidebar-newsletter");
  if (newsletterBlock) {
    const cta = document.createElement("div");
    cta.className = "sidebar-block sidebar-cta";
    cta.innerHTML = `<h4>Need this built, not just explained?</h4>
      <p>Our team builds the sites, stores and campaigns we write about.</p>
      <a href="${WHATSAPP_URL}" class="btn btn-primary" target="_blank" rel="noopener">Talk to us</a>`;
    newsletterBlock.before(cta);
  }

  // End-of-article CTA: the reader just finished a full guide, so this is the best
  // moment to offer "we'll do this for you" before they move on to related reading.
  const articleBody = document.querySelector(".article-body");
  if (articleBody) {
    const cta = document.createElement("div");
    cta.className = "article-cta";
    cta.innerHTML = `<span class="eyebrow">Want this done, not just read about it?</span>
      <h3>We're the team that writes these guides — and the one that builds what's in them.</h3>
      <p>A website, a store, a marketing plan someone actually runs for you. No separate sales team and no invented case studies — just a scoped proposal from the people who'd do the work.</p>
      <div class="hero-actions">
        <a href="${WHATSAPP_URL}" class="btn btn-primary" target="_blank" rel="noopener">WhatsApp Us</a>
        <a href="mailto:${CONTACT_EMAIL}" class="btn btn-ghost">${CONTACT_EMAIL}</a>
      </div>`;
    articleBody.insertAdjacentElement("afterend", cta);
  }
}

function toolCard(t, depth) {
  return `<a class="topic-card tool-link" href="${toolHref(t, depth)}">
    <div class="topic-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="${t.icon}"/></svg></div>
    <h3>${t.name}</h3>
    <p>${t.description}</p>
  </a>`;
}

function initMoreTools() {
  // Each tool page lists the other tools; built here so adding a tool needs no edits to old pages.
  const list = document.getElementById("more-tools");
  if (!list) return;
  const current = body.dataset.tool;
  list.innerHTML =
    getOtherTools(current)
      .map((t) => `<li><a href="${t.slug}.html">${t.name}</a>: ${t.blurb.charAt(0).toLowerCase()}${t.blurb.slice(1)}</li>`)
      .join("") + `<li><a href="index.html">All tools</a></li>`;
}

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const fields = ["name", "email", "subject", "message"];

  function validateField(name) {
    const input = form.elements[name];
    const wrapper = input.closest(".form-field");
    const errorEl = wrapper.querySelector(".field-error");
    let message = "";

    if (input.validity.valueMissing) {
      message = "This field is required.";
    } else if (name === "email" && input.validity.typeMismatch) {
      message = "Please enter a valid email address.";
    } else if (input.validity.tooShort) {
      message = `Please enter at least ${input.minLength} characters.`;
    }

    wrapper.classList.toggle("invalid", !!message);
    errorEl.textContent = message;
    return !message;
  }

  fields.forEach((name) => {
    const input = form.elements[name];
    input.addEventListener("blur", () => validateField(name));
    input.addEventListener("input", () => {
      if (input.closest(".form-field").classList.contains("invalid")) validateField(name);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const allValid = fields.map(validateField).every(Boolean);
    const status = document.getElementById("contact-status");
    const button = form.querySelector('button[type="submit"]');

    if (!allValid) {
      status.textContent = "Please fix the highlighted fields.";
      status.dataset.state = "error";
      return;
    }

    // Messages are delivered by Web3Forms, which forwards them to the site
    // owner's inbox. The access key (src/config.js) is public by design; the
    // destination address is bound to it on Web3Forms' side, so it never
    // appears in this code or on the page. See README → "Contact Form".
    button.disabled = true;
    status.textContent = "Sending…";
    status.dataset.state = "pending";

    try {
      const res = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          from_name: "BridgeSols Contact Form",
          subject: `BridgeSols contact: ${form.elements.subject.value.trim()}`,
          name: form.elements.name.value.trim(),
          email: form.elements.email.value.trim(),
          message: form.elements.message.value.trim(),
          botcheck: form.elements.botcheck.checked
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Request failed");

      form.reset();
      status.textContent = "Thanks — your message has been sent. We'll reply by email.";
      status.dataset.state = "success";
    } catch (err) {
      status.textContent =
        "Sorry, something went wrong sending your message. Please try again in a moment.";
      status.dataset.state = "error";
    } finally {
      button.disabled = false;
    }
  });
}
