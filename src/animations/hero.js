import gsap from "gsap";

/**
 * Hero entrance timeline. Splits the headline into per-line spans (already
 * marked up in the HTML as .line elements) and staggers everything in.
 */
export function playHeroEntrance(reducedMotion) {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  if (reducedMotion) {
    gsap.set([".hero-inner .eyebrow", ".hero h1 .line", ".hero p.lede", ".hero-actions", ".scroll-cue"], {
      opacity: 1,
      y: 0,
      clearProps: "transform"
    });
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.from(".hero-inner .eyebrow", { opacity: 0, y: 14, duration: 0.6 })
    .from(
      ".hero h1 .line",
      { opacity: 0, y: "100%", duration: 0.9, stagger: 0.08 },
      "-=0.25"
    )
    .from(".hero p.lede", { opacity: 0, y: 18, duration: 0.7 }, "-=0.45")
    .from(".hero-actions .btn", { opacity: 0, y: 16, duration: 0.6, stagger: 0.1 }, "-=0.4")
    .from(".scroll-cue", { opacity: 0, duration: 0.8 }, "-=0.2")
    .from(
      ".hero-canvas",
      { opacity: 0, duration: 1.6, ease: "power1.out" },
      0
    );
}
