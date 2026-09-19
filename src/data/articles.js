// Central metadata for all published articles.
// Used to render the homepage "Latest Articles" grid and "related articles" blocks.
export const articles = [
  {
    slug: "digital-marketing-strategy-small-businesses",
    title: "Digital Marketing Strategy for Small Businesses: A Practical Step-by-Step Guide",
    excerpt:
      "A grounded framework for building a digital marketing strategy from scratch — audience research, channel selection, budget allocation, and a 90-day plan you can actually execute.",
    category: "Digital Marketing",
    date: "2026-06-02",
    readingTime: "13 min read",
    author: "BridgeSols Editorial",
    tags: ["strategy", "small business", "planning"]
  },
  {
    slug: "seo-for-beginners",
    title: "SEO for Beginners: How to Build a Search-Friendly Website",
    excerpt:
      "How search engines actually work, how to research keywords that matter, and the on-page and technical fundamentals that let a new site earn organic visibility.",
    category: "SEO",
    date: "2026-06-19",
    readingTime: "14 min read",
    author: "BridgeSols Editorial",
    tags: ["seo", "beginners", "search"]
  },
  {
    slug: "how-to-start-online-business",
    title: "How to Start an Online Business: A Practical Roadmap for Beginners",
    excerpt:
      "From choosing a business model to validating demand, pricing, and your first sales — a realistic roadmap for getting an online business off the ground.",
    category: "Online Business",
    date: "2026-07-08",
    readingTime: "15 min read",
    author: "BridgeSols Editorial",
    tags: ["online business", "startup", "roadmap"]
  },
  {
    slug: "content-marketing-guide",
    title: "Content Marketing: How to Create Content That Attracts Customers",
    excerpt:
      "A practical system for planning, producing and distributing content — content pillars, editorial calendars, briefs, repurposing, and how to measure what's working.",
    category: "Content Marketing",
    date: "2026-07-29",
    readingTime: "12 min read",
    author: "BridgeSols Editorial",
    tags: ["content marketing", "distribution", "planning"]
  },
  {
    slug: "how-to-grow-a-website",
    title: "How to Grow a Website: 12 Practical Strategies That Compound Over Time",
    excerpt:
      "Twelve strategies — from technical SEO to digital PR and conversion optimization — that compound into durable traffic growth, plus a realistic six-month framework.",
    category: "Website Growth",
    date: "2026-08-20",
    readingTime: "13 min read",
    author: "BridgeSols Editorial",
    tags: ["growth", "traffic", "seo"]
  },
  {
    slug: "digital-marketing-small-business-pakistan",
    title: "Digital Marketing for Small Businesses in Pakistan: A Practical 2026 Guide",
    excerpt:
      "The channels, payment realities, and budget expectations that actually apply to a small business marketing itself in Pakistan — Facebook, WhatsApp, JazzCash/Easypaisa, and realistic PKR budgets.",
    category: "Digital Marketing",
    date: "2026-09-05",
    readingTime: "11 min read",
    author: "BridgeSols Editorial",
    tags: ["pakistan", "digital marketing", "local"]
  },
  {
    slug: "starting-online-business-uae-dubai",
    title: "Starting and Marketing an Online Business in the UAE: What Actually Works in 2026",
    excerpt:
      "Licensing basics, the multicultural audience, WhatsApp Business, and realistic ad costs in one of the world's most competitive digital markets.",
    category: "Online Business",
    date: "2026-09-12",
    readingTime: "11 min read",
    author: "BridgeSols Editorial",
    tags: ["uae", "dubai", "online business"]
  },
  {
    slug: "us-small-business-digital-marketing-benchmarks-2026",
    title: "Digital Marketing Benchmarks for US Small Businesses in 2026",
    excerpt:
      "Realistic ad costs, conversion rates, and channel performance benchmarks for US small businesses — a sanity check, not a guarantee.",
    category: "Digital Marketing",
    date: "2026-09-19",
    readingTime: "12 min read",
    author: "BridgeSols Editorial",
    tags: ["usa", "benchmarks", "digital marketing"]
  },
  {
    slug: "local-seo-guide-google-business-profile",
    title: "Local SEO: How to Rank in Google's Map Pack and Get Found by Nearby Customers",
    excerpt:
      "A practical guide to local SEO for service businesses and storefronts — Google Business Profile optimization, NAP consistency, citations, reviews, and what actually drives map pack rankings.",
    category: "SEO",
    date: "2026-09-19",
    readingTime: "12 min read",
    author: "BridgeSols Editorial",
    tags: ["local seo", "google business profile", "seo"]
  }
];

export function getArticle(slug) {
  return articles.find((a) => a.slug === slug);
}

export function getRelated(slug, count = 2) {
  return articles.filter((a) => a.slug !== slug).slice(0, count);
}

export function formatDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}
