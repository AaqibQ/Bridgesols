import gsap from "gsap";

const isTouch = window.matchMedia("(pointer: coarse)").matches;

/** Mobile hamburger nav: animated open/close with a staggered link reveal. */
export function initMobileNav() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const panel = document.querySelector(".mobile-nav");
  if (!header || !toggle || !panel) return;

  let open = false;
  const links = panel.querySelectorAll("a");
  gsap.set(links, { opacity: 0, y: 12 });

  function setOpen(next) {
    open = next;
    header.classList.toggle("nav-open", open);
    panel.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) {
      gsap.to(links, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out", delay: 0.1 });
    }
  }

  toggle.addEventListener("click", () => setOpen(!open));
  panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860 && open) setOpen(false);
  });
}

/** Subtle lift + glow on card hover — skipped on touch devices entirely. */
export function initCardHover() {
  if (isTouch) return;
  document.querySelectorAll(".article-card, .topic-card").forEach((card) => {
    const media = card.querySelector(".card-media svg");
    card.addEventListener("mouseenter", () => {
      if (media) gsap.to(media, { scale: 1.06, duration: 0.5, ease: "power2.out" });
    });
    card.addEventListener("mouseleave", () => {
      if (media) gsap.to(media, { scale: 1, duration: 0.5, ease: "power2.out" });
    });
  });
}

/** Small magnetic pull toward the cursor for primary buttons (desktop only). */
export function initMagneticButtons() {
  if (isTouch) return;
  document.querySelectorAll(".btn-primary").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: x * 0.18, y: y * 0.35, duration: 0.4, ease: "power2.out" });
    });
    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
    });
  });
}
