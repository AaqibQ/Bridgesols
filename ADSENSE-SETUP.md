# Google AdSense Setup Guide for BridgeSols

**Status: verification script added.** The AdSense site-verification/Auto ads script (`client=ca-pub-5067019264219250`) is now in the `<head>` of every page, and `public/ads.txt` declares the matching publisher ID. This alone does not display any ads yet — it lets Google verify the site and, once approved, serve Auto ads automatically. The `.ad-slot` placeholder `<div>`s are separate: they're for *manual* ad units and stay hidden (`display: none`) and empty until you add real `<ins class="adsbygoogle">` markup to them, which requires individual ad unit codes from your AdSense dashboard (not the same as the verification script above).

**Important:** no website structure, article count, or checklist can guarantee AdSense approval. Google's reviewers assess the whole site manually against their publisher policies at the time you apply, and the outcome depends on factors beyond what any guide can promise. This document explains the process honestly and tells you what to prepare — it does not claim that following it guarantees acceptance.

---

## Before you apply

Go through this list against the *live, deployed* site — not the local dev version.

1. **The site is fully live and accessible** at `https://bridgesols.com` over HTTPS, with no login wall, "under construction" state, or broken pages.
2. **Navigation works end-to-end** — header nav, mobile menu, footer links, and internal links between articles all resolve correctly.
3. **Articles are original and genuinely useful.** The five articles included with this project were written to be substantive, not filler — but review them yourself and keep publishing new, original guides. A five-article site is a starting point, not a finished publication in Google's eyes.
4. **About, Contact, and Privacy Policy pages are live and reachable** from the site's navigation or footer (all three are included in this project).
5. **There's enough meaningful content overall.** There's no official minimum article count, but a site with only a handful of thin pages is a common rejection reason — plan to keep publishing before and after you apply.
6. **The site doesn't violate AdSense program policies** — no content that's illegal, adult, violent, or otherwise disallowed under Google's publisher policies (review the current policies directly on Google's site, since they do change).

## Step-by-step

1. **Create (or use) a Google account**, and go to [adsense.google.com](https://www.google.com/adsense/).
2. **Add your site** — enter `bridgesols.com` when prompted.
3. **Verify site ownership.** AdSense will give you a snippet to add to your site, or you can verify via Google Search Console if you've already set that up (see README.md). Follow whichever verification method AdSense offers at the time — the exact flow changes periodically.
4. **Add the official AdSense code once Google provides it.** This is the one and only AdSense script that should ever go into this project — do not add a placeholder or guessed publisher ID before this point. Once you have your real code (an `ins.adsbygoogle` snippet plus your `data-ad-client` publisher ID), it typically goes once in the `<head>` of every page, with individual `<ins class="adsbygoogle">` ad units placed where the `.ad-slot` placeholders currently are in this project (`index.html`, and each article in `articles/`).
5. **Request review.** AdSense will review the whole site, not just the page you verified from.
6. **Wait for Google's review.** This can take anywhere from a few days to a few weeks. Don't make major structural changes to the site while waiting, but continuing to publish genuinely useful content is a good sign, not a risk.
7. **If approved:** replace the ad placeholders with your real ad units per Google's instructions, and keep the site compliant with AdSense policies going forward (content changes, prohibited content, click encouragement, etc. are all monitored on an ongoing basis, not just at approval time).
8. **If rejected:** Google will tell you the specific reason (e.g. "low value content," "site under construction," "insufficient content"). Read the reason carefully, make a real fix — not a cosmetic one — and wait before reapplying rather than resubmitting immediately.

## Ad placeholders are hidden by default

The `.ad-slot` placeholder boxes (labeled "Advertisement — ..." with a "No ad network connected" note) are set to `display: none` in `src/styles/main.css` — real visitors never see an empty, unmonetized ad box. They stay in the HTML so the exact reserved spot is easy to find and swap out.

To see the reserved spacing while developing, open your browser devtools console on any page and run:
```js
document.body.setAttribute("data-show-ad-placeholders", "")
```
This is a temporary, per-tab toggle only — it doesn't persist or affect the live site.

## Where the ad slots are

| Location | File(s) |
|---|---|
| Homepage top (after hero) | `index.html` |
| Homepage mid-page | `index.html` |
| Article top | each file in `articles/*.html` |
| Article bottom | each file in `articles/*.html` |
| Article sidebar | each file in `articles/*.html` (`.article-sidebar`) |

Each is marked with an HTML comment (`<!-- Ad slot: ... -->`) directly above it in the source, and rendered with the `.ad-slot` class defined in `src/styles/main.css`, so swapping the placeholder `<div>` for a real `<ins class="adsbygoogle">` unit is a contained, one-line-per-slot change.

## After approval

- Monitor the AdSense dashboard for policy violation warnings — address them immediately, since repeated or unresolved violations can lead to account suspension.
- Keep publishing original content; sites that go quiet for long periods sometimes see reduced ad relevance and revenue.
- Revisit `robots.txt` periodically to make sure Googlebot and `Mediapartners-Google` (AdSense's crawler) are never accidentally blocked — both are explicitly allowed in this project's `robots.txt` already.
