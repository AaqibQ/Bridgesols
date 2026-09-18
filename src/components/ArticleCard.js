import { formatDate } from "../data/articles.js";

// Deterministic small hash so each card gets a stable, slightly different
// abstract gradient/line pattern instead of a repeated static graphic.
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function cardMediaSvg(slug) {
  const h = hash(slug);
  const angle = h % 360;
  const x1 = 20 + (h % 40);
  const y1 = 15 + ((h >> 4) % 30);
  const x2 = 60 + ((h >> 8) % 35);
  const y2 = 55 + ((h >> 2) % 35);
  const id = "g" + h;
  return `
  <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${id}" gradientTransform="rotate(${angle})">
        <stop offset="0%" stop-color="#6c8dff" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#9a7bff" stop-opacity="0.05" />
      </linearGradient>
    </defs>
    <rect width="400" height="250" fill="url(#${id})" />
    <circle cx="${x1 * 4}" cy="${y1 * 2.5}" r="60" fill="none" stroke="#2c3340" stroke-width="1" />
    <line x1="${x1 * 4}" y1="${y1 * 2.5}" x2="${x2 * 4}" y2="${y2 * 2.5}" stroke="#6c8dff" stroke-width="1" stroke-opacity="0.5" />
    <circle cx="${x2 * 4}" cy="${y2 * 2.5}" r="3" fill="#9a7bff" />
    <circle cx="${x1 * 4}" cy="${y1 * 2.5}" r="3" fill="#6c8dff" />
  </svg>`;
}

export function articleCard(article, basePath = "articles/") {
  return `
  <article class="article-card">
    <div class="card-media">${cardMediaSvg(article.slug)}</div>
    <div class="card-body">
      <div class="card-meta">
        <span>${article.category}</span>
        <span class="dot"></span>
        <span class="muted">${formatDate(article.date)}</span>
        <span class="dot"></span>
        <span class="muted">${article.readingTime}</span>
      </div>
      <h3><a href="${basePath}${article.slug}.html">${article.title}</a></h3>
      <p>${article.excerpt}</p>
      <span class="card-read">Read article &rarr;</span>
    </div>
  </article>`;
}

export function relatedCard(article, basePath = "") {
  return `<a href="${basePath}${article.slug}.html">${article.title}</a>`;
}
