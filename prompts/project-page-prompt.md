# Project page layout — /projects/[slug].html

Apply the sitewide header and footer from `sitewide-components-prompt.md`. Row tokens (`.row`, `.row-wrap`, `.num`, `.rmain`, `.row-title`, `.rsub`, `.row-year`, `.row-arr`, `.cat-tag`, `.feat-tag`) and `.section-label` are **shared with the homepage** — define them once in `style.css`, do not redefine per-page.

---

## Page structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>[Project Title] — Avigail Bahat</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter/400.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter/500.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter/700.css">
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  [HEADER]
  <main class="proj-main">
    <div class="proj-content">
      [TITLE BLOCK]
      [INTRO]
      [BODY SECTIONS]
    </div>
  </main>
  [MORE WORK SECTION]
  [FOOTER]
  <script src="/script.js"></script>
  <script>[MORE WORK JS — see below]</script>
</body>
</html>
```

---

## Project content CSS

```css
.proj-main { padding: 0 32px; }
.proj-content {
  max-width: 640px;
  margin: 0 auto;
  padding: 56px 0 80px;
}

/* Title block */
.proj-title {
  font-size: 42px;
  font-weight: 700;
  color: #0a0a0a;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 16px;
}
.proj-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;
}
.proj-meta-item { font-size: 12px; color: #888; }
.proj-meta-sep  { font-size: 12px; color: #ccc; }

/* Intro paragraph */
.proj-intro {
  font-size: 17px;
  font-weight: 500;
  color: #0a0a0a;
  line-height: 1.6;
  letter-spacing: -0.01em;
  margin-bottom: 48px;
  padding-bottom: 48px;
  border-bottom: 0.5px solid #ebebeb;
}

/* Section label — shared token, defined in style.css */
/* .section-label already defined globally */

/* Body paragraphs */
.proj-body {
  font-size: 15px;
  color: #444;
  line-height: 1.75;
}
.proj-body + .proj-body { margin-top: 16px; }

/* Image placeholder */
.proj-img {
  width: 100%;
  background: #f5f5f5;
  border-radius: 6px;
  margin: 32px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 12px;
  letter-spacing: 0.04em;
}
.proj-img.tall  { height: 360px; }
.proj-img.short { height: 220px; }
```

---

## Title block HTML

```html
<h1 class="proj-title">[Project Title]</h1>
<div class="proj-meta">
  <span class="proj-meta-item">[Year]</span>
  <span class="proj-meta-sep">·</span>
  <span class="proj-meta-item">[Category]</span>
  <span class="proj-meta-sep">·</span>
  <span class="proj-meta-item">Wix</span>
</div>
```

---

## Body section pattern

```html
<p class="proj-intro">[One-paragraph summary of the project]</p>

<p class="section-label">Problem</p>
<p class="proj-body">[Body copy]</p>
<p class="proj-body">[Continuation if needed]</p>

<div class="proj-img tall">[ project image ]</div>

<p class="section-label">Approach</p>
<p class="proj-body">[Body copy]</p>

<div class="proj-img short">[ project image ]</div>

<p class="section-label">Outcome</p>
<p class="proj-body">[Body copy]</p>

<p class="section-label">Bottom line</p>
<p class="proj-body">[One closing paragraph — a personal reflection on the challenge, what made it hard, or what you'd do differently. This is the designer's voice, not a metrics summary.]</p>
```

---

## More work section

Placed immediately after `</main>`, before `[FOOTER]`. Shows 4 randomly selected projects (excluding the current page's project). Uses the same shared row tokens as the homepage list.

```html
<section class="more-section">
  <div class="more-inner">
    <p class="more-label">More work</p>
    <div id="more-list"></div>
    <div class="more-cta">
      <a href="/index.html" class="more-cta-link">See all work →</a>
    </div>
  </div>
</section>
```

### More section CSS

```css
.more-section { padding: 0 32px; }
.more-inner {
  max-width: 640px;
  margin: 0 auto;
  padding-top: 64px;
  border-top: 0.5px solid #ebebeb;
}
.more-label {
  font-size: 11px;
  color: #888;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  margin-bottom: 16px;
}
.more-cta { display: flex; justify-content: flex-end; padding-top: 16px; padding-bottom: 64px; }
.more-cta-link {
  font-size: 13px;
  font-weight: 500;
  color: #0a0a0a;
  text-decoration: none;
  transition: opacity 0.15s;
}
.more-cta-link:hover { opacity: 0.45; }
```

---

## More work JS

Inject this script block at the bottom of each project page, just before `</body>`. The `ALL_PROJECTS` array contains **all 14 projects** (including the current one). `CURRENT_SLUG` is set to the current page's slug at build time so it gets excluded from the random picks.

```html
<script>
var ALL_PROJECTS = [
  { slug: 'ai-credits',                title: 'AI Credits',                  sub: 'Transparent AI usage billing across Wix\'s developer platform',              cat: 'Developer tools', year: 2026, featured: true  },
  { slug: 'app-installation-view',     title: 'App Installation View',       sub: 'Redesigned the app installation experience end-to-end',                       cat: 'Developer tools', year: 2025, featured: true  },
  { slug: 'app-reviews-revamp',        title: 'App Reviews Revamp',          sub: 'Improved app review flows for the Wix App Market',                            cat: 'Developer tools', year: 2024, featured: false },
  { slug: 'developer-sale',            title: 'Developer Sale',              sub: 'A monetisation campaign tool for app developers',                             cat: 'Monetisation',    year: 2024, featured: true  },
  { slug: 'app-collections',           title: 'App Collections',             sub: 'Curated app groupings for discovery and editorial placement',                  cat: 'Internal tools',  year: 2024, featured: false },
  { slug: 'payouts-page',              title: 'Payouts Page',                sub: 'Dashboard for developers to track earnings and payout history',                cat: 'Monetisation',    year: 2023, featured: false },
  { slug: 'refund-flow',               title: 'Refund Flow',                 sub: 'End-to-end refund process for app purchases',                                 cat: 'Monetisation',    year: 2023, featured: false },
  { slug: 'app-pricing-page',          title: 'App Pricing Page',            sub: 'Redesigned pricing presentation for marketplace apps',                        cat: 'Monetisation',    year: 2023, featured: false },
  { slug: 'internal-app-review',       title: 'Internal App Review System',  sub: 'Replaced a spreadsheet-based review process with a structured tool',          cat: 'Internal tools',  year: 2022, featured: true  },
  { slug: 'submit-publish-widget',     title: 'Submit & Publish Widget',     sub: 'Streamlined app submission and publishing for developers',                     cat: 'Developer tools', year: 2022, featured: false },
  { slug: 'custom-element-settings',   title: 'Custom Element Settings',     sub: 'Settings UI for Wix\'s custom HTML element widget',                           cat: 'CMS',             year: 2022, featured: false },
  { slug: 'api-keys-page',             title: 'API Keys Page',               sub: 'Key management interface for Wix\'s developer platform',                      cat: 'Developer tools', year: 2022, featured: false },
  { slug: 'development-site-creation', title: 'Development Site Creation',   sub: 'Onboarding flow for creating Wix development sites',                          cat: 'Developer tools', year: 2021, featured: false },
  { slug: 'app-coupons',               title: 'App Coupons',                 sub: 'Coupon and discount tools for app monetisation',                              cat: 'Monetisation',    year: 2021, featured: false },
];
var CURRENT_SLUG = '[[SLUG]]'; // replaced at build time, e.g. 'ai-credits'

(function() {
  var others = ALL_PROJECTS.filter(function(p) { return p.slug !== CURRENT_SLUG; });
  var pick = others.slice().sort(function() { return Math.random() - 0.5; }).slice(0, 4);
  var list = document.getElementById('more-list');
  pick.forEach(function(p, i) {
    var wrap = document.createElement('div');
    wrap.className = 'row-wrap';
    wrap.innerHTML =
      '<div class="row" onclick="window.location.href=\'/projects/' + p.slug + '.html\'">' +
        '<span class="num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<div class="rmain">' +
          '<div class="row-title">' + p.title + '</div>' +
          '<div class="rsub">' + p.sub + '</div>' +
        '</div>' +
        (p.featured ? '<span class="feat-tag">Featured</span>' : '') +
        '<span class="cat-tag">' + p.cat + '</span>' +
        '<span class="row-year">' + p.year + '</span>' +
        '<span class="row-arr">↗</span>' +
      '</div>';
    list.appendChild(wrap);
  });
})();
</script>
```

---

## Shared row tokens (defined once in style.css)

These are identical to the homepage list rows. Do not redefine per project page.

```css
/* Row tokens — homepage list + project page more-work */
.row-wrap { overflow: hidden; max-height: 80px; }
.row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0;
  border-bottom: 0.5px solid #ebebeb;
  cursor: pointer;
  transition: background 0.2s ease, padding 0.2s ease;
}
.row-wrap:first-of-type .row { border-top: 0.5px solid #ebebeb; }
.row:hover { background: #f7f7f7; padding-left: 8px; padding-right: 8px; }
.row:hover .rsub { max-height: 40px; opacity: 1; }
.row:hover .row-arr { opacity: 1; }
.num { font-size: 12px; font-weight: 500; color: #888; min-width: 22px; flex-shrink: 0; }
.rmain { flex: 1; min-width: 0; }
.row-title { font-size: 14px; font-weight: 500; color: #0a0a0a; }
.rsub {
  font-size: 12px; color: #888;
  max-height: 0; opacity: 0; overflow: hidden;
  transition: max-height 0.2s ease, opacity 0.2s ease;
  margin-top: 1px; white-space: nowrap; text-overflow: ellipsis;
}
.row-year { font-size: 12px; color: #888; flex-shrink: 0; min-width: 36px; text-align: right; }
.row-arr  { font-size: 12px; color: #888; opacity: 0; transition: opacity 0.2s ease; flex-shrink: 0; }
.cat-tag  { font-size: 10px; color: #888; border: 0.5px solid #e0e0e0; border-radius: 3px; padding: 2px 6px; white-space: nowrap; flex-shrink: 0; }
.feat-tag { font-size: 10px; color: #888; border: 0.5px solid #e0e0e0; border-radius: 3px; padding: 2px 6px; white-space: nowrap; flex-shrink: 0; }
```

Note: on project pages `.row-wrap` starts at `max-height: 80px` (already open — no accordion effect needed). On the homepage it starts at `max-height: 0` and opens via JS.

---

## Lightbox

Clicking any image in `.proj-content` opens a full-screen lightbox: dark overlay, the image centered, caption below, a close button top-right, and circular handle buttons on each side of the image for navigation. Keyboard: Esc closes, arrow keys navigate.

### Lightbox HTML (add once, just before `</body>`)

```html
<div id="lightbox" class="lb-overlay" role="dialog" aria-modal="true">
  <button class="lb-close" aria-label="Close">✕</button>
  <div class="lb-stage">
    <button class="lb-handle lb-prev" aria-label="Previous">‹</button>
    <div class="lb-content">
      <img class="lb-img" src="" alt="">
      <p class="lb-caption"></p>
    </div>
    <button class="lb-handle lb-next" aria-label="Next">›</button>
  </div>
</div>
```

### Lightbox CSS

```css
.lb-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.92);
  z-index: 1000; display: none;
  align-items: center; justify-content: center;
  padding: 56px 72px 40px;
}
.lb-overlay.open { display: flex; }
.lb-stage {
  display: flex; align-items: center; gap: 20px;
  width: 100%; height: 100%;
}
.lb-content { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 16px; min-width: 0; height: 100%; justify-content: center; }
.lb-img { max-width: 100%; max-height: calc(100vh - 140px); object-fit: contain; border-radius: 4px; display: block; }
.lb-caption { font-size: 13px; color: rgba(255,255,255,0.5); text-align: center; line-height: 1.5; }
.lb-close {
  position: fixed; top: 20px; right: 28px;
  background: none; border: none; color: rgba(255,255,255,0.6);
  font-size: 20px; cursor: pointer; padding: 8px; line-height: 1; transition: color 0.15s;
}
.lb-close:hover { color: #fff; }
.lb-handle {
  flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%;
  background: rgba(255,255,255,0.12); border: none;
  color: rgba(255,255,255,0.8); font-size: 20px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s; user-select: none; line-height: 1;
}
.lb-handle:hover { background: rgba(255,255,255,0.22); color: #fff; }
.lb-handle[hidden] { visibility: hidden; pointer-events: none; }
.proj-content img { cursor: zoom-in; }
```

### Lightbox JS (add to script.js or inline on each project page)

```js
(function() {
  var lb = document.getElementById('lightbox');
  if (!lb) return;
  var lbImg     = lb.querySelector('.lb-img');
  var lbCaption = lb.querySelector('.lb-caption');
  var lbClose   = lb.querySelector('.lb-close');
  var lbPrev    = lb.querySelector('.lb-prev');
  var lbNext    = lb.querySelector('.lb-next');
  var images = [], current = 0;

  var imgs = Array.from(document.querySelectorAll('.proj-content img'));
  imgs.forEach(function(img, i) {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', function() { open(i); });
  });
  images = imgs;

  function open(i) {
    current = i;
    lbImg.src = images[i].src;
    lbImg.alt = images[i].alt;
    lbCaption.textContent = images[i].alt || '';
    lbPrev.hidden = (i === 0);
    lbNext.hidden = (i === images.length - 1);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  lbClose.addEventListener('click', close);
  lb.addEventListener('click', function(e) { if (e.target === lb) close(); });
  lbPrev.addEventListener('click', function(e) { e.stopPropagation(); if (current > 0) open(current - 1); });
  lbNext.addEventListener('click', function(e) { e.stopPropagation(); if (current < images.length - 1) open(current + 1); });
  document.addEventListener('keydown', function(e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft'  && current > 0) open(current - 1);
    if (e.key === 'ArrowRight' && current < images.length - 1) open(current + 1);
  });
})();
```
