# Homepage (index.html)

Apply the sitewide header and footer from `sitewide-components-prompt.md`. Load Inter from jsDelivr at weights 400, 500, and 700:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter/400.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter/500.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter/700.css">
```

---

## Page structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Avigail Bahat — Senior UX Designer</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter/400.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter/500.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter/700.css">
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  [HEADER]
  <div class="page-wrap">
    [LEDE]
    [FEATURED SECTION]
    [ALL WORK SECTION]
  </div>
  [FOOTER]
  <script src="/script.js"></script>
</body>
</html>
```

---

## Global CSS tokens

```css
:root {
  --ac: #0a0a0a;
  --border: #ebebeb;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  background: #fff;
  color: #0a0a0a;
  -webkit-font-smoothing: antialiased;
}
```

**Single gray token: `#888`** — used for all muted/secondary text (labels, numbers, subtitles, nav links, badges, years, arrows). Do not use #bbb, #999, #767676, or #555 for text. Borders remain #ebebeb / #e0e0e0.

---

## Page wrapper

```css
.page-wrap {
  max-width: 744px;
  margin: 0 auto;
  padding: 0 32px 80px;
}
```

---

## Lede

```html
<p class="lede">Senior UX designer. 12 years at Wix building developer tools, site tools, marketplace, and AI. Work I genuinely love.</p>
```

```css
.lede {
  font-size: 20px;
  font-weight: 500;
  color: #0a0a0a;
  line-height: 1.4;
  letter-spacing: -0.01em;
  max-width: 520px;
  padding: 48px 0 56px;
}
```

---

## Section label (shared)

```css
.section-label {
  font-size: 11px;
  color: #888;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  margin-bottom: 16px;
}
```

---

## Featured work section

Each card has an `onclick` for full-card navigation (corner-to-corner click target).

```html
<p class="section-label">Featured work</p>

<div class="feat-grid">
  <div class="feat-card" onclick="window.location.href='/projects/ai-credits.html'">
    <div class="feat-title">AI Credits</div>
    <div class="feat-sub">Transparent AI usage billing across Wix's developer platform</div>
    <div class="feat-arr">↗</div>
  </div>
  <div class="feat-card" onclick="window.location.href='/projects/app-installation-view.html'">
    <div class="feat-title">App Installation View</div>
    <div class="feat-sub">Redesigned the app installation experience end-to-end</div>
    <div class="feat-arr">↗</div>
  </div>
  <div class="feat-card" onclick="window.location.href='/projects/internal-app-review.html'">
    <div class="feat-title">Internal App Review System</div>
    <div class="feat-sub">Replaced a spreadsheet-based review process with a structured tool</div>
    <div class="feat-arr">↗</div>
  </div>
  <div class="feat-card" onclick="window.location.href='/projects/developer-sale.html'">
    <div class="feat-title">Developer Sale</div>
    <div class="feat-sub">A monetisation campaign tool for app developers</div>
    <div class="feat-arr">↗</div>
  </div>
</div>
```

### Featured cards CSS

```css
.feat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 0.5px solid #ebebeb;
  border-bottom: 0.5px solid #ebebeb;
  margin-bottom: 56px;
}
.feat-card {
  padding: 24px 20px 20px;
  border-right: 0.5px solid #ebebeb;
  cursor: pointer;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  transition: background 0.18s ease;
}
.feat-card:last-child { border-right: none; }
.feat-card:hover { background: #f9f9f9; }

.feat-title {
  font-size: 18px;
  font-weight: 700;
  color: #0a0a0a;
  line-height: 1.3;
  letter-spacing: -0.02em;
  display: inline-block;
  transition: filter 0.2s;
}
.feat-sub {
  font-size: 12px;
  color: #888;
  line-height: 1.5;
  flex: 1;
}
.feat-arr {
  font-size: 13px;
  color: #888;
  align-self: flex-end;
  opacity: 0;
  transform: translate(-3px, 3px);
  transition: opacity 0.18s, transform 0.18s;
}
.feat-card:hover .feat-arr {
  opacity: 1;
  transform: translate(0, 0);
  color: #0a0a0a;
}

/* WordArt gradient hover — color change only, no movement */
.feat-card:nth-child(1):hover .feat-title {
  background: linear-gradient(90deg, #e91e63, #ff6b35, #ffd700, #00c896, #4361ee, #9b5de5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(1px 1px 0 rgba(0,0,0,0.1));
}
.feat-card:nth-child(2):hover .feat-title {
  background: linear-gradient(180deg, #ffe566, #f4a100, #b86e00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(1px 1px 0 #8b5400) drop-shadow(2px 2px 0 #5a3600);
}
.feat-card:nth-child(3):hover .feat-title {
  background: linear-gradient(135deg, #c026d3, #a855f7, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(1px 2px 0 rgba(192,38,211,0.2));
  font-style: italic;
}
.feat-card:nth-child(4):hover .feat-title {
  background: linear-gradient(180deg, #7dd3fc, #0ea5e9, #0369a1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(1px 1px 0 #01507a) drop-shadow(2px 2px 0 #013650);
}
```

---

## All work section

```html
<div class="work-header">
  <p class="section-label" style="margin-bottom:0">All work</p>
  <div class="filters">
    <button class="filter-btn active" data-f="all">All</button>
    <button class="filter-btn" data-f="developer">Developer tools</button>
    <button class="filter-btn" data-f="monetisation">Monetisation</button>
    <button class="filter-btn" data-f="internal">Internal tools</button>
    <button class="filter-btn" data-f="cms">CMS</button>
  </div>
</div>

<div id="list">
  [PROJECT ROWS — see table below]
</div>
```

### Filter CSS

```css
.work-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}
.filters { display: flex; gap: 16px; align-items: center; }
.filter-btn {
  font-size: 12px;
  color: #888;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.13s;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
}
.filter-btn:hover { color: #0a0a0a; }
.filter-btn.active {
  color: #0a0a0a;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
}
```

### Row markup

`data-cat` is on the `.row` element (space-separated values used by filter JS). Featured projects include a `.feat-tag` span.

```html
<div class="row-wrap">
  <div class="row" data-cat="developer">
    <span class="num">01</span>
    <div class="rmain">
      <div class="row-title">AI Credits</div>
      <div class="rsub">Transparent AI usage billing across Wix's developer platform</div>
    </div>
    <span class="feat-tag">Featured</span>   <!-- omit for non-featured -->
    <span class="cat-tag">Developer tools</span>
    <span class="row-year">2026</span>
    <span class="row-arr">↗</span>
  </div>
</div>
```

### Row CSS

Hover is a very subtle light gray background with a smooth 8px horizontal padding shift. No text color change on hover.

```css
.row-wrap {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.row-wrap.open { max-height: 80px; }
.row-wrap.hidden { display: none; }

.row {
  display: flex;
  align-items: center;
  gap: 10px;
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
  font-size: 12px;
  color: #888;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.2s ease, opacity 0.2s ease;
  margin-top: 1px;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.row-year { font-size: 12px; color: #888; flex-shrink: 0; min-width: 36px; text-align: right; }
.row-arr { font-size: 12px; opacity: 0; transition: opacity 0.2s ease; color: #888; flex-shrink: 0; }

.cat-tag {
  font-size: 10px;
  color: #888;
  border: 0.5px solid #e0e0e0;
  border-radius: 3px;
  padding: 2px 6px;
  white-space: nowrap;
  flex-shrink: 0;
}
.feat-tag {
  font-size: 10px;
  color: #888;
  border: 0.5px solid #e0e0e0;
  border-radius: 3px;
  padding: 2px 6px;
  white-space: nowrap;
  flex-shrink: 0;
}
```

### Project list

Sorted newest first. `data-cat` on `.row` drives the filter (space-separated). Featured items get the `.feat-tag` badge.

| # | Title | data-cat | cat-tag label | Year | Featured |
|---|-------|----------|---------------|------|---------|
| 01 | AI Credits | developer | Developer tools | 2026 | yes |
| 02 | App Installation View | developer | Developer tools | 2025 | yes |
| 03 | App Reviews Revamp | developer | Developer tools | 2024 | no |
| 04 | Developer Sale | developer monetisation | Monetisation | 2024 | yes |
| 05 | App Collections | developer internal | Internal tools | 2024 | no |
| 06 | Payouts Page | monetisation | Monetisation | 2023 | no |
| 07 | Refund Flow | monetisation | Monetisation | 2023 | no |
| 08 | App Pricing Page | developer monetisation | Monetisation | 2023 | no |
| 09 | Internal App Review System | internal | Internal tools | 2022 | yes |
| 10 | Submit & Publish Widget | developer | Developer tools | 2022 | no |
| 11 | Custom Element Settings | cms | CMS | 2022 | no |
| 12 | API Keys Page | developer | Developer tools | 2022 | no |
| 13 | Development Site Creation | developer | Developer tools | 2021 | no |
| 14 | App Coupons | monetisation | Monetisation | 2021 | no |

One-line subtitles (`.rsub`):
- AI Credits: Transparent AI usage billing across Wix's developer platform
- App Installation View: Redesigned the app installation experience end-to-end
- App Reviews Revamp: Improved app review flows for the Wix App Market
- Developer Sale: A monetisation campaign tool for app developers
- App Collections: Curated app groupings for discovery and editorial placement
- Payouts Page: Dashboard for developers to track earnings and payout history
- Refund Flow: End-to-end refund process for app purchases
- App Pricing Page: Redesigned pricing presentation for marketplace apps
- Internal App Review System: Replaced a spreadsheet-based review process with a structured tool
- Submit & Publish Widget: Streamlined app submission and publishing for developers
- Custom Element Settings: Settings UI for Wix's custom HTML element widget
- API Keys Page: Key management interface for Wix's developer platform
- Development Site Creation: Onboarding flow for creating Wix development sites
- App Coupons: Coupon and discount tools for app monetisation

---

## JS — add to script.js

### Accordion (opens rows on scroll into view, fires once)

```js
(function() {
  var list = document.getElementById('list');
  if (!list) return;
  var wraps = Array.from(list.querySelectorAll('.row-wrap'));
  var fired = false;
  function openAll() {
    fired = true;
    wraps.forEach(function(w, i) {
      setTimeout(function() { w.classList.add('open'); }, i * 55);
    });
  }
  window.addEventListener('scroll', function() {
    if (fired) return;
    if (list.getBoundingClientRect().top < window.innerHeight - 20) openAll();
  });
  // open immediately if list is already in view on load
  if (list.getBoundingClientRect().top < window.innerHeight - 20) openAll();
})();
```

### Filter

`data-cat` lives on the `.row` element (not on `.row-wrap`). Uses explicit classList add/remove.

```js
document.querySelectorAll('.filter-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var f = btn.dataset.f;
    document.querySelectorAll('#list .row-wrap').forEach(function(wrap) {
      var row = wrap.querySelector('.row');
      var cats = (row ? (row.dataset.cat || '') : '').split(' ');
      if (f === 'all' || cats.indexOf(f) !== -1) {
        wrap.classList.remove('hidden');
      } else {
        wrap.classList.add('hidden');
      }
    });
    var i = 1;
    document.querySelectorAll('#list .row-wrap:not(.hidden) .num').forEach(function(n) {
      n.textContent = String(i++).padStart(2, '0');
    });
  });
});
```
