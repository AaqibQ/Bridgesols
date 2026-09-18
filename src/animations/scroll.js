import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

let lenis;

/**
 * Sets up Lenis smooth scrolling and wires it to GSAP's ticker so
 * ScrollTrigger stays perfectly in sync. Skipped entirely when the visitor
 * prefers reduced motion — native scrolling is used instead, and anchor
 * links / keyboard scrolling keep working exactly as the browser expects.
 */
export function initSmoothScroll(reducedMotion) {
  if (reducedMotion) return null;

  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.2
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function getLenis() {
  return lenis;
}

/** Header background/height transition, driven by real scroll position. */
export function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  ScrollTrigger.create({
    start: 10,
    end: 99999,
    onUpdate: (self) => {
      header.classList.toggle("scrolled", self.scroll() > 10);
    }
  });
}

/** Batched fade/slide-up reveals for repeating card/section elements. */
export function initScrollReveals(reducedMotion) {
  const selectors = [".article-card", ".topic-card:not(.topics-track .topic-card)", ".why-item", ".sidebar-block"];
  selectors.forEach((selector) => {
    const items = gsap.utils.toArray(selector);
    if (!items.length) return;
    if (reducedMotion) {
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }
    ScrollTrigger.batch(items, {
      start: "top 88%",
      onEnter: (batch) =>
        gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power3.out" }),
      once: true
    });
    gsap.set(items, { opacity: 0, y: 28 });
  });

  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    if (reducedMotion) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }
    gsap.from(el, {
      opacity: 0,
      y: 24,
      duration: 0.7,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true }
    });
  });
}

/**
 * Pins the Topics section and scrubs a horizontal track across it as the
 * visitor scrolls vertically. Desktop only — gsap.matchMedia() reverts the
 * pin/transform automatically below 1024px, where CSS stacks the cards
 * vertically instead.
 */
export function initHorizontalTopics() {
  const section = document.querySelector(".topics-pin");
  const track = document.querySelector(".topics-track");
  if (!section || !track) return;

  const mm = gsap.matchMedia();

  mm.add("(min-width: 1024px)", () => {
    const distance = () => Math.max(track.scrollWidth - window.innerWidth + 96, 0);

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + distance(),
        scrub: 0.6,
        pin: true,
        invalidateOnRefresh: true
      }
    });

    return () => tween.scrollTrigger && tween.scrollTrigger.kill();
  });

  return mm;
}

/** Highlights the active table-of-contents entry on article pages. */
export function initTocHighlight() {
  const links = gsap.utils.toArray(".toc-list a");
  if (!links.length) return;

  links.forEach((link) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: "top 30%",
      end: "bottom 30%",
      onToggle: (self) => {
        if (self.isActive) {
          links.forEach((l) => l.classList.remove("active"));
          link.classList.add("active");
        }
      }
    });
  });
}

export function refresh() {
  ScrollTrigger.refresh();
}
