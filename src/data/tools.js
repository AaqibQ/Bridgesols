// Single source of truth for the free tools. The footer, the article sidebar, the homepage
// and the "More free tools" list on every tool page are all built from this list, so adding a
// tool here (plus its page, Vite entry and sitemap line) links it everywhere. The site
// integrity tests fail if any of those pieces is missing.

export const TOOLS = [
  {
    slug: "word-counter",
    name: "Word Counter",
    blurb: "Count words, characters and reading time",
    description:
      "Count words, characters, sentences and paragraphs, with reading time and keyword density. Works in any language.",
    icon: "M4 6h16M4 12h10M4 18h13"
  },
  {
    slug: "meta-length-checker",
    name: "Meta Length Checker",
    blurb: "Check how your title and description look in Google",
    description:
      "Check title and description length in characters and pixels, and preview the Google result on desktop and mobile.",
    icon: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM7 10h10M7 14h6"
  },
  {
    slug: "slug-generator",
    name: "Slug Generator",
    blurb: "Turn any title into a clean URL slug",
    description:
      "Turn titles into clean, SEO-friendly URL slugs. Removes accents and symbols, converts whole lists and works with any language.",
    icon: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"
  },
  {
    slug: "case-converter",
    name: "Case Converter",
    blurb: "Title, sentence, upper, lower and code cases",
    description:
      "Change text to title case, sentence case, upper or lower case, camelCase, snake_case and more, with correct handling of accents.",
    icon: "M4 18l4-12 4 12M5.5 14h5M15 18v-7a2.5 2.5 0 0 1 5 0v7M15 15h5"
  },
  {
    slug: "utm-link-builder",
    name: "UTM Link Builder",
    blurb: "Build tracking links for Google Analytics",
    description:
      "Add utm_source, utm_medium and utm_campaign to any URL, check for common mistakes and copy a clean tracking link.",
    icon: "M4 19V9m6 10V5m6 14v-7m4 7H3"
  }
];

/** Link to a tool page from a page `depth` folders below the site root (the same prefix rule the footer uses). */
export function toolHref(tool, depth = 0) {
  const root = depth > 0 ? "../".repeat(depth) : "./";
  return `${root}tools/${tool.slug}.html`;
}

export function getOtherTools(slug) {
  return TOOLS.filter((t) => t.slug !== slug);
}
