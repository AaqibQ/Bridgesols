import "./styles/main.css";
import "./styles/responsive.css";
import "./styles/article.css";
import "./styles/tools.css";
import "./styles/tools-meta.css";

import { renderHeader } from "./components/Header.js";
import { renderFooter } from "./components/Footer.js";
import { initNewsletterForms } from "./components/Newsletter.js";
import { articleCard } from "./components/ArticleCard.js";
import { getRelated, getLatest } from "./data/articles.js";
import { WEB3FORMS_ACCESS_KEY, WEB3FORMS_URL } from "./config.js";

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

/* ---------------- Tool pages ---------------- */
if (page === "tool" && body.dataset.tool === "word-counter") {
  import("./tools/word-counter.js").then((m) => m.initWordCounter());
}
if (page === "tool" && body.dataset.tool === "meta-length-checker") {
  import("./tools/meta-checker.js").then((m) => m.initMetaChecker());
}

reducedMotionQuery.addEventListener("change", (e) => {
  reducedMotion = e.matches;
  window.location.reload();
});

/* ================================================================== */

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
