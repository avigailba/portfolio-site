# Avigail Bahat Portfolio — Claude Code Context

## What this is
A static portfolio site for Avigail Bahat, Senior UX Designer. Content is authored in Notion, a Node.js generator reads from Notion and builds HTML files into `dist/`, and GitHub Actions deploys to GitHub Pages on push.

## How to generate
```
node generate.js
```
This fetches all Notion pages and rebuilds `dist/`. To regenerate a single page, pass the slug: `node generate.js ai-credits-wallet`.

---

## Design system

### Layout
- **Horizontal padding: `clamp(40px, 20%, 240px)`** on header, footer, inner pages, project pages, more-work section.
- Homepage uses `.home-band`: `width: 80vw; max-width: 80vw; margin: 0 auto` — contains lede, feat-grid, work-header, and list. At ≤960px resets to `width: 100%` with clamp padding.
- `.feat-grid` also has `width: 80vw; max-width: 80vw; margin: 0 auto; overflow: hidden` — both the band and grid are 80vw so they share the same left edge.
- Inner pages (about, contact): `.inner-content` has `max-width: 720px`. Project pages: `.proj-content` has no max-width (wide layout is intentional).

### Colors
- `--ac: #0a0a0a` — primary/accent (text, hover backgrounds)
- `--border: #ebebeb` — all borders
- `#555` — **single gray token** for all muted/secondary text: labels, numbers, subtitles, nav links, badges, years, arrows, captions, body copy. Do not use #444, #222, #bbb, #999, #767676, or #888 for text.
- White: `#fff`

### Typography
- **Titles** (`.feat-title`, `.proj-title`, `.lede`, `.footer-statement`): `Plus Jakarta Sans` — weights 300–800
- **Body/UI** (everything else): `Inter` — weights 300–700
- Loaded from Google Fonts: `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap`
- `-webkit-font-smoothing: antialiased` always on body

### Writing rules
- **No em dashes (—)** anywhere in generated copy. Use commas, colons, or periods instead.
- **No specific numbers, percentages, or dollar amounts** in project content — legal constraint. Use directional language ("grew significantly", "majority of users") instead.

---

## File structure
```
dist/
  index.html              — homepage
  about.html              — about + CV + contact (single page, all content from Notion)
  contact.html            — redirect to about.html only
  projects/
    ai-credits-wallet.html
    app-installation-view.html
    ... (one file per project)
style.css                 — all shared styles (single file)
script.js                 — all shared JS (single file)
generate.js               — Notion → HTML generator
prompts/                  — design prompts (reference, not generated)
```

---

## Shared CSS tokens (defined once in style.css)

Row tokens are shared between the homepage list and all project page "More work" sections. Define them **once** in style.css — never redefine per page.

### Type scale
- Lede (homepage): `28px`, `font-weight: 500`
- Logo name: `16px`
- Nav links: `14px`
- Section labels: `15px`, uppercase, `color: #555`
- Featured card title (`.feat-title`): `clamp(18px, 2.2vw, 28px)`, `font-weight: 700`
- Featured card subtitle (`.feat-sub`): `15px`
- Row title (`.row-title`): `20px`, `font-weight: 500`
- Row number (`.num`): `14px`
- Row year (`.row-year`): `14px`
- Tags (`.cat-tag`, `.feat-tag`): `15px`, padding `4px 10px`
- Minimum font size anywhere: `14px`

### Featured cards grid
- `.feat-grid`: `width: 80vw; height: 30vh; margin: 0 auto;` — viewport-relative sizing on desktop
- `.feat-card`: `height: 100%; min-height: 300px; padding: 36px 32px`
- Grid: 4 columns (>960px), 2 columns (≤960px — `width: 100%; height: auto`)

### All work rows
- `.row`: `padding: 28px 0`
- `.row-wrap.open`: `max-height: 120px`
- `#more-list .row-wrap` (project pages, always open): `max-height: 120px`

```css
:root { --ac: #0a0a0a; --border: #ebebeb; }

/* Row tokens */
.row-wrap { overflow: hidden; max-height: 0; transition: max-height 0.28s cubic-bezier(0.4,0,0.2,1); }
.row-wrap.open { max-height: 120px; }
.row-wrap.hidden { display: none; }
.row { display: flex; align-items: center; gap: 10px; padding: 28px 0; border-bottom: 0.5px solid #ebebeb; cursor: pointer; transition: background 0.2s ease, padding 0.2s ease; }
.row-wrap:first-of-type .row { border-top: 0.5px solid #ebebeb; }
.row:hover { background: #f7f7f7; padding-left: 8px; padding-right: 8px; }
.row:hover .rsub { max-height: 40px; opacity: 1; }
.row:hover .row-arr { opacity: 1; }
.num { font-size: 14px; font-weight: 500; color: #555; min-width: 22px; flex-shrink: 0; }
.rmain { flex: 1; min-width: 0; }
.row-title { font-size: 20px; font-weight: 500; color: #0a0a0a; }
.rsub { font-size: 14px; color: #555; max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.2s ease, opacity 0.2s ease; margin-top: 1px; white-space: nowrap; text-overflow: ellipsis; }
.row-year { font-size: 14px; color: #555; flex-shrink: 0; min-width: 36px; text-align: right; }
.row-arr { font-size: 14px; color: #555; opacity: 0; transition: opacity 0.2s ease; flex-shrink: 0; }
.cat-tag { font-size: 15px; color: #555; border: 0.5px solid #e0e0e0; border-radius: 3px; padding: 4px 10px; white-space: nowrap; flex-shrink: 0; }
.feat-tag { font-size: 15px; color: #555; border: 0.5px solid #e0e0e0; border-radius: 3px; padding: 4px 10px; white-space: nowrap; flex-shrink: 0; }
.section-label { font-size: 15px; color: #555; letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 16px; }
```

Note: on project pages `.row-wrap` starts at `max-height: 120px` (open by default). On the homepage it starts at `0` and opens via the accordion JS.

---

## Header (all pages)
Sticky, condenses on scroll past 40px. `overflow: hidden` must be on the **base** `.avail-dot-wrap` state (not only on `.scrolled`) to prevent content peeking during transition.

```js
(function() {
  var hdr = document.getElementById('site-header');
  if (!hdr) return;
  window.addEventListener('scroll', function() {
    hdr.classList.toggle('scrolled', window.scrollY > 40);
  });
})();
```

---

## Project page sections (in order)
Each project page in Notion has these sections, which the generator maps to HTML:

1. **Opening paragraph** — 2–3 sentences. First sentence names the problem/gap that motivated the project. Written in first person.
2. **What I Did** — bullet list
3. **Impact** — bullet list or short paragraph
4. **Images** — pulled from Notion image blocks, rendered as `<img>` inside `.proj-img` wrappers
5. **Bottom line** — closing reflection, personal voice, 1–2 sentences
6. **More work** — 4 random other projects (JS-rendered, excludes current page)

### Project page CSS
```css
.proj-main { padding: 0 clamp(40px, 20%, 240px); }
.proj-content { padding: 56px 0 80px; }
.proj-title { font-size: 42px; font-weight: 700; color: #0a0a0a; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 16px; }
.proj-meta { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; }
.proj-meta-item { font-size: 14px; color: #555; }
.proj-meta-sep { font-size: 14px; color: #ccc; }
.proj-intro { font-size: 17px; font-weight: 500; color: #0a0a0a; line-height: 1.6; letter-spacing: -0.01em; margin-bottom: 48px; padding-bottom: 48px; border-bottom: 0.5px solid #ebebeb; }
.proj-body { font-size: 15px; color: #444; line-height: 1.75; }
.proj-body + .proj-body { margin-top: 16px; }
.proj-img { width: 100%; border-radius: 8px; margin: 32px 0; overflow: hidden; background: #f5f5f5; }
.proj-img img { width: 100%; height: auto; display: block; border-radius: 8px; }
```

### Lightbox
Images in `.proj-content` are clickable and open a full-screen lightbox.

Key CSS values:
- `.lb-overlay`: `padding: 48px 16px 24px`
- `.lb-img`: `max-width: 100%; max-height: calc(100vh - 120px); width: auto; height: auto; object-fit: contain;`
- Mobile (≤600px): `.lb-handle { display: none; }`

Mobile interaction (in script.js):
- **Swipe**: `touchstart`/`touchend` on `.lb-overlay` — threshold 40px, swipe left = next, swipe right = prev
- **Tap zones**: when `window.innerWidth < 600`, overlay click uses left/right half of screen to navigate (left half = prev, right half = next) instead of closing
- Desktop: clicking the bare overlay (`.lb-overlay` itself as target) still closes

---

## About page — CV layout

The about page (`aboutPage()` in generate.js) **fetches all content from Notion** (page ID: `36e35a9ccf7a81f6953dcab2aebb27fc`). No separate contact page — `contact.html` is just a redirect.

Structure in Notion (in order): bio → Contact → Education → Experience → Skills

### Notion content format

Experience entries use Notion's **column layout** (4 columns: year in col 1, content in cols 2–4):
```
[col 1: 2025→2026]  [col 2: **Wix - OS Company - Senior UX Designer**
                             Description text here.
                             *Project A, Project B*            ]
```

The generator post-processes the Notion HTML:
1. Year paragraphs (`\d{4}[→–]\d{4}`) → `<p class="notion-years">`
2. `<p><strong>Company</strong></p><p>Short Role</p>` → `<p><strong>Company · Role</strong></p>` (≤80 chars, no period)
3. Notion `col-layout col-N` divs → `.cv-row` / `.cv-col-year` / `.cv-col-content` grid
4. Standalone link `<p><a href="...">text</a></p>` → adds `class="about-contact-inline"` + icon (↗ external, ↓ for docs.google.com)

### About page CSS classes
```css
.about-notion { max-width: 720px; padding: 56px 0 80px; }
.about-notion h2 { /* section labels: uppercase, #555 */ }
.about-notion > p:first-child { /* bio: 18px/500 */ }
.about-notion .notion-years { font-size: 14px; color: #555; }
.about-notion p:has(> strong:only-child) { /* company·role line: 16px/600/#0a0a0a */ }
.about-notion p:has(> em:only-child) { /* project list: 14px/#555 */ }
/* CV columns */
.about-notion .cv-row { display: grid; grid-template-columns: 100px 1fr; gap: 0 32px; margin-bottom: 32px; }
.about-notion .cv-col-year { padding-top: 3px; }
/* Contact links */
.about-contact-inline { font-size: 14px; font-weight: 500; color: #2b6cff; text-decoration: none; border: none; padding: 0; }
```

### Nav
Single "About & Contact" link → `about.html`. No separate contact page. `SKIP_SLUGS` includes `about-contact` to prevent Notion's "About & Contact" page from being generated as a project.

---

## Notion page IDs

| Page | ID |
|------|----|
| AI Credits | 31135a9ccf7a804caf72da07638205bc |
| App Installation View | 31135a9ccf7a80358e3cead5465c89f8 |
| App Reviews Revamp | 31135a9ccf7a80bdad92eff1f90e6ecf |
| Developer Sale | 17d35a9ccf7a80c69ceafb3f7973485a |
| App Collections | da073f156b004fbb87d927849587a28c |
| Internal App Review System | 71024356b51b4ce8b46c21fa3a442020 |
| Payouts Page | 0f54649479514c65bc990b4b594d0cb1 |
| Refund Flow | b103bffdedd247569c67b422c90cfcd3 |
| App Pricing Page | 17d35a9ccf7a8021b6ebcccd15c1d39d |
| Submit & Publish Widget | c4b2bd7033384f7792fb167115baac33 |
| App Coupons | ad5fdda62b7344068e537404e15ee8ad |
| Custom Element Settings | 9053adab5f3144159fc991711d4e82f7 |
| API Keys Page | af4b341536b44d5495d067982a1b358c |
| Development Site Creation | 84911e6052cd480c807e6591b58833a9 |
| About | 36e35a9ccf7a81f6953dcab2aebb27fc |
| Contact | 36e35a9ccf7a8188a447fd3e36ee88cd |
| Homepage (tagline) | 37135a9ccf7a81b2a7a7c0a2702d8c98 |

---

## Project slugs and categories

| Slug | Category | Year | Featured |
|------|----------|------|---------|
| ai-credits-wallet | developer | 2026 | yes |
| app-installation-view | developer | 2025 | yes |
| app-reviews-revamp | developer | 2024 | no |
| developer-sale | developer monetisation | 2024 | yes |
| app-collections | developer internal | 2024 | no |
| payouts-page | monetisation | 2023 | no |
| refund-flow | monetisation | 2023 | no |
| app-pricing-page | developer monetisation | 2023 | no |
| internal-app-review | internal | 2022 | yes |
| submit-publish-widget | developer | 2022 | no |
| custom-element-settings | cms | 2022 | no |
| api-keys-page | developer | 2022 | no |
| development-site-creation | developer | 2021 | no |
| app-coupons | monetisation | 2021 | no |

---

## Prompt files (in prompts/)
- `homepage-prompt.md` — homepage layout, featured cards, filter, row tokens
- `project-page-prompt.md` — project page layout, lightbox, more-work section
- `sitewide-components-prompt.md` — header + footer used on all pages
- `inner-pages-prompt.md` — About and Contact page layouts
