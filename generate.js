try { require('dotenv').config(); } catch (e) {}
if (!process.env.NOTION_API_KEY) {
  try {
    const { execSync } = require('child_process');
    const lines = execSync('git worktree list --porcelain', { encoding: 'utf8' }).split('\n');
    const mainPath = lines.find(l => l.startsWith('worktree'))?.split('worktree ')[1];
    if (mainPath) require('dotenv').config({ path: require('path').join(mainPath, '.env') });
  } catch (e) {}
}
process.env.NOTION_API_KEY = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
if (!process.env.NOTION_API_KEY) {
  console.error('ERROR: NOTION_API_KEY is not set — building static fallback only');
} else {
  console.log('NOTION_API_KEY found:', process.env.NOTION_API_KEY.slice(0, 8) + '...');
}
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const ROOT_PAGE_ID      = '9e31791fdedf4048bb784d0cbae06e51';
const ABOUT_PAGE_ID     = '36e35a9ccf7a81f6953dcab2aebb27fc';
const CONTACT_PAGE_ID   = '36e35a9ccf7a8188a447fd3e36ee88cd';
const HOMEPAGE_PAGE_ID  = '37135a9ccf7a81b2a7a7c0a2702d8c98';

const SKIP_IDS   = new Set([ABOUT_PAGE_ID, CONTACT_PAGE_ID, HOMEPAGE_PAGE_ID]);
const SKIP_SLUGS = new Set(['about', 'contact', 'cv', 'resume', 'homepage']);

// Stable slug overrides by Notion page ID — prevents slug changes when Notion titles change
const NOTION_ID_TO_SLUG = {
  '31135a9ccf7a804caf72da07638205bc': 'ai-credits-wallet',
  '31135a9ccf7a80358e3cead5465c89f8': 'app-installation-page-for-developers',
  '31135a9ccf7a80bdad92eff1f90e6ecf': 'app-reviews-revamp',
  '17d35a9ccf7a80c69ceafb3f7973485a': 'developer-sale',
  'da073f156b004fbb87d927849587a28c': 'app-collections-internal-manager',
  '71024356b51b4ce8b46c21fa3a442020': 'internal-app-review-system',
  '0f54649479514c65bc990b4b594d0cb1': 'payouts-page',
  'b103bffdedd247569c67b422c90cfcd3': 'refund-flow',
  '17d35a9ccf7a8021b6ebcccd15c1d39d': 'app-pricing-page-projects',
  'c4b2bd7033384f7792fb167115baac33': 'submit-publish-widget',
  'ad5fdda62b7344068e537404e15ee8ad': 'app-coupons',
  '9053adab5f3144159fc991711d4e82f7': 'custom-element-component-settings',
  'af4b341536b44d5495d067982a1b358c': 'api-keys-page',
  '84911e6052cd480c807e6591b58833a9': 'development-site-creation',
};
const DIST        = 'dist';
const PROJECTS_DIR = path.join(DIST, 'projects');
const IMAGES      = path.join(DIST, 'images');

let imgIdx = 0;
const stats = { pages: 0, images: 0, errors: [] };

// Project metadata: categories, display title overrides, years, featured status
const PROJECT_META = {
  'ai-credits-wallet':                          { title: 'AI Credits', featTitle: 'AI<br>Credits', cats: 'monetisation',          display: 'Monetisation',    year: 2026, featured: true },
  'app-installation-page-for-developers': { title: 'App Installations Page',      cats: 'developer cms',          display: 'Developer tools', year: 2025, featured: true },
  'app-reviews-revamp':                  { title: 'App Reviews Revamp',           cats: 'developer',              display: 'Developer tools', year: 2024, featured: false },
  'developer-sale':                      { title: 'Developer Sale',               cats: 'developer monetisation cms', display: 'Monetisation', year: 2024, featured: true },
  'app-collections-internal-manager':    { title: 'App Collections Manager',      cats: 'developer internal cms', display: 'Internal tools',  year: 2024, featured: false },
  'payouts-page':                        { title: 'Payouts Page',                 cats: 'monetisation cms',       display: 'Monetisation',    year: 2023, featured: false },
  'refund-flow':                         { title: 'Refund Flow',                  cats: 'monetisation',           display: 'Monetisation',    year: 2023, featured: false },
  'app-pricing-page-projects':           { title: 'App Pricing Page Projects',    cats: 'developer monetisation', display: 'Monetisation',    year: 2023, featured: false },
  'internal-app-review-system':          { title: 'App Review System',            cats: 'internal cms',           display: 'Internal tools',  year: 2022, featured: true },
  'submit-publish-widget':               { title: 'Submit & Publish Widget',      cats: 'developer',              display: 'Developer tools', year: 2022, featured: false },
  'custom-element-component-settings':   { title: 'Custom Element Component Settings', cats: 'developer',          display: 'Developer tools', year: 2022, featured: false },
  'api-keys-page':                       { title: 'API Keys Page',                cats: 'developer cms',          display: 'Developer tools', year: 2022, featured: false },
  'development-site-creation':           { title: 'Development Site Creation',    cats: 'developer',              display: 'Developer tools', year: 2021, featured: false },
  'app-coupons':                         { title: 'App Coupons',                  cats: 'monetisation cms',       display: 'Monetisation',    year: 2021, featured: false },
};

// Featured rows shown on homepage (in order)
const FEAT_ORDER = [
  'ai-credits-wallet',
  'app-installation-page-for-developers',
  'internal-app-review-system',
  'developer-sale',
];

// One-line summaries shown on hover in the project list
const PROJECT_SUMMARIES = {
  'ai-credits-wallet':                          'AI credits billing system across Business Manager and Wixel',
  'app-installation-page-for-developers': 'Developer dashboard for installation data and user insights',
  'app-reviews-revamp':                  'Redesigned reviews management experience for App Market developers',
  'developer-sale':                      'Native sales infrastructure for app developers on the marketplace',
  'app-collections-internal-manager':    'Curation tooling for App Market vertical collections',
  'payouts-page':                        'In-product earnings visibility for App Market developers',
  'refund-flow':                         'Self-serve refund flow replacing manual support intervention',
  'app-pricing-page-projects':           'Long-term UX evolution of App Market pricing infrastructure',
  'internal-app-review-system':          'Workflow tool for Account Managers to review marketplace apps',
  'submit-publish-widget':               'Submission requirements surfaced in-context during the publishing flow',
  'custom-element-component-settings':   'Visual settings builder for Wix Custom Element apps',
  'api-keys-page':                       'Secure key generation and management for Wix platform developers',
  'development-site-creation':           'Self-serve provisioning of premium test sites for developers',
  'app-coupons':                         'Self-serve coupon creation for App Market developers',
};

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function stripEmoji(s) {
  return s.replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/gu, '').trim();
}

async function fetchBlocks(pageId) {
  const all = [];
  let cursor;
  do {
    const r = await notion.blocks.children.list({ block_id: pageId, start_cursor: cursor, page_size: 100 });
    all.push(...r.results);
    cursor = r.next_cursor;
  } while (cursor);
  return all;
}

async function collectPages(pageId) {
  const blocks = await fetchBlocks(pageId);
  const children = blocks.filter(b => b.type === 'child_page');
  const pages = [];
  for (const cp of children) {
    const sub = await fetchBlocks(cp.id);
    if (sub.some(b => b.type === 'child_page')) {
      pages.push(...await collectPages(cp.id));
    } else {
      pages.push({ id: cp.id, title: cp.child_page.title, blocks: sub });
    }
  }
  return pages;
}

function dlFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlink(dest, () => {});
        dlFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
  });
}

function rt(richText) {
  return richText
    .filter(t => !(t.type === 'mention' && t.mention?.type === 'date'))
    .map(t => {
      let s = t.plain_text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      if (t.annotations.bold) s = `<strong>${s}</strong>`;
      if (t.annotations.italic) s = `<em>${s}</em>`;
      if (t.annotations.code) s = `<code>${s}</code>`;
      if (t.href) s = `<a href="${t.href}" target="_blank" rel="noopener">${s}</a>`;
      return s;
    }).join('');
}

async function toHtml(blocks, imgPrefix = '') {
  let html = '', uList = false, oList = false, firstParaSeen = false;
  for (const b of blocks) {
    if (b.type !== 'bulleted_list_item' && uList) { html += '</ul>\n'; uList = false; }
    if (b.type !== 'numbered_list_item' && oList) { html += '</ol>\n'; oList = false; }
    switch (b.type) {
      case 'paragraph': {
        const rich = b.paragraph.rich_text.filter(
          t => !(t.type === 'mention' && t.mention?.type === 'date')
        );
        const plain = rich.map(x => x.plain_text).join('').trim();
        if (!plain || isDateString(plain)) break;
        if (!firstParaSeen && rich.length > 0 && rich.every(t => t.annotations?.italic)) {
          firstParaSeen = true;
          break;
        }
        firstParaSeen = true;
        const t = rt(rich);
        if (t) html += `<p>${t}</p>\n`;
        break;
      }
      case 'heading_2': html += `<h2>${rt(b.heading_2.rich_text)}</h2>\n`; break;
      case 'heading_3': html += `<h3>${rt(b.heading_3.rich_text)}</h3>\n`; break;
      case 'bulleted_list_item': {
        if (!uList) { html += '<ul>\n'; uList = true; }
        let bliHtml = rt(b.bulleted_list_item.rich_text);
        if (b.has_children) {
          const ch = await fetchBlocks(b.id);
          bliHtml += await toHtml(ch, imgPrefix);
        }
        html += `  <li>${bliHtml}</li>\n`;
        break;
      }
      case 'numbered_list_item': {
        if (!oList) { html += '<ol>\n'; oList = true; }
        let nliHtml = rt(b.numbered_list_item.rich_text);
        if (b.has_children) {
          const ch = await fetchBlocks(b.id);
          nliHtml += await toHtml(ch, imgPrefix);
        }
        html += `  <li>${nliHtml}</li>\n`;
        break;
      }
      case 'callout': {
        const icon = b.callout.icon?.emoji ? `${b.callout.icon.emoji} ` : '';
        const t = rt(b.callout.rich_text);
        if (t) html += `<div class="callout"><p>${icon}${t}</p></div>\n`;
        break;
      }
      case 'column_list': {
        const cols = await fetchBlocks(b.id);
        const colHtmls = await Promise.all(cols.map(async col => {
          const colBlocks = await fetchBlocks(col.id);
          return `<div class="col">${await toHtml(colBlocks, imgPrefix)}</div>`;
        }));
        html += `<div class="col-layout col-${cols.length}">${colHtmls.join('')}</div>\n`;
        break;
      }
      case 'divider': html += '<hr>\n'; break;
      case 'image': {
        let url = b.image.type === 'external' ? b.image.external.url : b.image.file.url;
        const cap = b.image.caption?.length ? rt(b.image.caption) : '';
        if (url.includes('amazonaws.com') || url.includes('prod-files-secure')) {
          imgIdx++;
          const fname = `img-${imgIdx}.jpg`;
          const dest = path.join(IMAGES, fname);
          if (fs.existsSync(dest)) {
            url = `${imgPrefix}images/${fname}`;
            stats.cached = (stats.cached || 0) + 1;
          } else {
            try {
              await dlFile(url, dest);
              url = `${imgPrefix}images/${fname}`;
              stats.images++;
            } catch (e) { stats.errors.push(`img-${imgIdx}: ${e.message}`); }
          }
        }
        html += `<figure class="proj-img">\n  <img src="${url}" alt="${cap}" loading="lazy">\n${cap ? `  <figcaption>${cap}</figcaption>\n` : ''}</figure>\n`;
        break;
      }
    }
  }
  if (uList) html += '</ul>\n';
  if (oList) html += '</ol>\n';
  return html;
}

function isDateString(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}

function excerpt(blocks) {
  const p = blocks.find(b => {
    if (b.type !== 'paragraph' || !b.paragraph.rich_text.length) return false;
    const plain = b.paragraph.rich_text.map(t => t.plain_text).join('').trim();
    return plain.length > 0 && !isDateString(plain);
  });
  return p ? p.paragraph.rich_text.map(t => t.plain_text).join('').slice(0, 180) : '';
}

function firstSubtitle(blocks) {
  const b = blocks.find(b => {
    if (b.type !== 'paragraph' || !b.paragraph.rich_text.length) return false;
    const plain = b.paragraph.rich_text.map(t => t.plain_text).join('').trim();
    return plain.length > 0 && !isDateString(plain) && b.paragraph.rich_text.every(t => t.annotations?.italic);
  });
  return b ? b.paragraph.rich_text.map(t => t.plain_text).join('').trim() : '';
}

function firstCallout(blocks) {
  const c = blocks.find(b => b.type === 'callout' && b.callout.rich_text.length);
  if (!c) return '';
  const icon = c.callout.icon?.emoji ? `${c.callout.icon.emoji} ` : '';
  return icon + c.callout.rich_text.map(t => t.plain_text).join('');
}

function plainText(richText) {
  return richText.map(t => t.plain_text).join('');
}

async function hydrateTables(blocks) {
  for (const b of blocks) {
    if (b.type === 'table') b._rows = await fetchBlocks(b.id);
  }
}

// ── Layout ──────────────────────────────────────────────────

// prefix: '' for root pages, '../' for project pages in dist/projects/
function hdr(prefix) {
  return `<header id="site-header">
  <div class="hdr-row">
    <a href="${prefix}index.html" class="mob-logo">
      <span class="mob-logo-name">Avigail Bahat</span>
      <span class="mob-logo-role">Senior UX Designer</span>
    </a>
    <nav>
      <a href="${prefix}index.html">Home</a>
      <a href="${prefix}index.html#home-allwork">Work</a>
      <a href="${prefix}about.html">About & Contact</a>
    </nav>
    <button class="mob-burger" id="open-menu" aria-label="Open menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>
<div class="mob-scrim" id="mob-scrim"></div>
<aside class="mob-panel" id="mob-panel">
  <div class="mob-panel-top">
    <span class="mob-panel-title">Avigail Bahat</span>
    <button class="mob-panel-close" id="mob-panel-close" aria-label="Close">✕</button>
  </div>
  <nav class="mob-panel-nav">
    <a href="${prefix}index.html" class="mob-panel-link">Home</a>
    <a href="${prefix}index.html#home-allwork" class="mob-panel-link mob-work-link">Work</a>
    <a href="${prefix}about.html" class="mob-panel-link">About & Contact</a>
  </nav>
  <div class="mob-panel-foot">
    <div class="mob-panel-social">
      <a href="mailto:avigailba@gmail.com"><span>avigailba@gmail.com</span><span class="mob-arr">↗</span></a>
      <a href="https://www.linkedin.com/in/avigailbahat/" target="_blank" rel="noreferrer"><span>LinkedIn</span><span class="mob-arr">↗</span></a>
    </div>
  </div>
</aside>`;
}

function ftr(prefix = '') {
  return `<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-left">
      <p class="footer-statement">Open to new work.</p>
      <div class="footer-tags">
        <span class="ftag">Developer tools</span>
        <span class="ftag">AI products</span>
        <span class="ftag">Complex systems</span>
        <span class="ftag">B2B SaaS</span>
        <span class="ftag">Platform design</span>
        <span class="ftag">Marketplace</span>
        <span class="ftag">Design systems</span>
        <span class="ftag">Developer experience</span>
        <span class="ftag">Monetisation</span>
        <span class="ftag">Internal tools</span>
      </div>
      <p class="footer-tagline">Based in Tel Aviv · Open to opportunities</p>
    </div>
    <div class="footer-right">
      <a href="mailto:avigailba@gmail.com" class="footer-link">
        <span>avigailba@gmail.com</span><span class="footer-arr">↗</span>
      </a>
      <a href="https://www.linkedin.com/in/avigailbahat/" class="footer-link">
        <span>LinkedIn</span><span class="footer-arr">↗</span>
      </a>
      <a href="${prefix}design-system.html" class="footer-link">
        <span>Design system</span><span class="footer-arr">↗</span>
      </a>
    </div>
  </div>
  <div class="footer-bottom">© 2026 Avigail Bahat. Built using Notion &amp; Claude.</div>
</footer>`;
}

// prefix: '' for root pages, '../' for project pages
function wrap(prefix, title, body, extraScript = '', extraHead = '', bodyClass = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap">
  <link rel="icon" type="image/png" sizes="32x32" href="${prefix}favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="${prefix}favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="${prefix}apple-touch-icon.png">
  ${extraHead}<link rel="stylesheet" href="${prefix}style.css">
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
  ${hdr(prefix)}
  ${body}
  ${ftr(prefix)}
  <script src="${prefix}script.js"></script>
  ${extraScript}
  <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>`;
}

// ── Pages ────────────────────────────────────────────────────

function indexPage(projects, tagline) {
  tagline = tagline || "Senior UX designer. I like the problems that need a whiteboard. I've spent my career building tools - for developers, for internal teams, and for end users.";
  const bySlug = {};
  for (const p of projects) bySlug[p.slug] = p;

  // Featured grid: 4 cards
  const featHtml = FEAT_ORDER.map((slug) => {
    const meta = PROJECT_META[slug];
    const summary = PROJECT_SUMMARIES[slug] || '';
    return `<div class="feat-card" onclick="location.href='projects/${slug}.html'">
  <div class="feat-title">${meta.featTitle || meta.title}</div>
  ${summary ? `<div class="feat-sub">${summary}</div>` : ''}
  <div class="feat-arr">↗</div>
  <div class="feat-foot">
    <a class="mob-view-btn" href="projects/${slug}.html" onclick="event.stopPropagation()">View project <span>↗</span></a>
  </div>
</div>`;
  }).join('\n  ');

  // Full list: sort by year desc, then by PROJECT_META insertion order
  const metaSlugs = Object.keys(PROJECT_META);
  // When Notion is unavailable projects is empty — fall back to all known slugs
  const allSlugs = projects.length > 0 ? metaSlugs.filter(s => bySlug[s]) : [...metaSlugs];
  for (const p of projects) {
    if (!PROJECT_META[p.slug] && !allSlugs.includes(p.slug)) allSlugs.push(p.slug);
  }
  allSlugs.sort((a, b) => {
    const ya = PROJECT_META[a]?.year || parseInt(bySlug[a]?.year || '0');
    const yb = PROJECT_META[b]?.year || parseInt(bySlug[b]?.year || '0');
    if (yb !== ya) return yb - ya;
    return metaSlugs.indexOf(a) - metaSlugs.indexOf(b);
  });

  const listHtml = allSlugs.map((slug, i) => {
    const meta = PROJECT_META[slug];
    const proj = bySlug[slug];
    const title   = proj?.title   || meta?.title   || slug;
    const cats    = meta?.cats    || '';
    const display = meta?.display || '';
    const year    = meta?.year    || proj?.year    || '';
    const summary = proj?.summary || PROJECT_SUMMARIES[slug] || '';
    const featured = meta?.featured || false;
    return `<div class="row-wrap" data-cat="${cats}">
  <a href="projects/${slug}.html" class="row" data-cat="${cats}">
    <span class="num">${String(i + 1).padStart(2, '0')}</span>
    <div class="rmain">
      <span class="row-title">${title}</span>
      ${summary ? `<span class="rsub">${summary}</span>` : ''}
    </div>
    ${featured ? `<span class="feat-tag" title="Featured">★</span>` : ''}
    ${display ? `<span class="cat-tag">${display}</span>` : ''}
    <span class="row-year">${year}</span>
    <span class="row-arr">View ↗</span>
    <div class="mob-row-foot"><span class="mob-view-btn mob-view-sm">View ↗</span></div>
  </a>
</div>`;
  }).join('\n  ');

  return wrap('', 'Avigail Bahat — Senior UX Designer', `
  <main class="home-band">
    <p class="lede">${tagline}</p>
    <div class="feat-grid">
      ${featHtml}
    </div>
    <div class="home-allwork" id="home-allwork">
      <div class="work-header">
        <div class="filters">
          <button class="filter-btn active" data-filter="all">All projects</button>
          <button class="filter-btn" data-filter="developer">Developer tools</button>
          <button class="filter-btn" data-filter="monetisation">Monetisation</button>
          <button class="filter-btn" data-filter="internal">Internal tools</button>
          <button class="filter-btn" data-filter="cms">CMS</button>
        </div>
        <div class="mob-filter" id="mob-filter">
          <button class="mob-filter-btn" id="mob-filter-btn">All projects <span class="mob-filter-caret">▼</span></button>
          <div class="mob-filter-drop" id="mob-filter-drop">
            <button class="mob-filter-opt active" data-filter="all">All projects</button>
            <button class="mob-filter-opt" data-filter="developer">Developer tools</button>
            <button class="mob-filter-opt" data-filter="monetisation">Monetisation</button>
            <button class="mob-filter-opt" data-filter="internal">Internal tools</button>
            <button class="mob-filter-opt" data-filter="cms">CMS</button>
          </div>
        </div>
      </div>
      <div id="all-list">
        ${listHtml}
      </div>
    </div>
  </main>`);
}

function projectPage(proj, prevProj, nextProj) {
  const prefix = '../';
  const meta  = PROJECT_META[proj.slug] || {};
  const title = proj.title || meta.title;
  const year  = meta.year  || proj.year;
  const CAT_LABELS = { developer: 'Developer tools', monetisation: 'Monetisation', cms: 'CMS', internal: 'Internal tools' };
  const catHtml = (meta.cats || '').split(' ').filter(Boolean)
    .map(c => `<span class="pm">${CAT_LABELS[c] || c}</span>`).join('<span class="psep">·</span>')
    || `<span class="pm">${meta.display || 'Product design'}</span>`;
  const prevTitle = prevProj ? (PROJECT_META[prevProj.slug]?.title || prevProj.title) : null;
  const nextTitle = nextProj ? (PROJECT_META[nextProj.slug]?.title || nextProj.title) : null;

  const allProjectsJs = Object.entries(PROJECT_META)
    .map(([slug, m]) => {
      const sub = (PROJECT_SUMMARIES[slug] || '').replace(/'/g, "\\'");
      return `  { slug: '${slug}', title: '${m.title.replace(/'/g, "\\'")}', sub: '${sub}', cat: '${m.display}', cats: '${m.cats}', year: ${m.year}, featured: ${m.featured} }`;
    })
    .join(',\n');

  // Links between project pages are relative within dist/projects/ (same directory)
  const moreJs = `<script>
var ALL_PROJECTS = [
${allProjectsJs}
];
var CURRENT_SLUG = '${proj.slug}';
(function() {
  var others = ALL_PROJECTS.filter(function(p) { return p.slug !== CURRENT_SLUG; });
  var pick = others.slice().sort(function() { return Math.random() - 0.5; }).slice(0, 4);
  var list = document.getElementById('more-list');
  if (!list) return;
  pick.forEach(function(p, i) {
    var wrap = document.createElement('div');
    wrap.className = 'row-wrap open';
    wrap.setAttribute('data-cat', p.cats);
    wrap.innerHTML =
      '<a href="' + p.slug + '.html" class="row" data-cat="' + p.cats + '">' +
        '<span class="num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<div class="rmain">' +
          '<span class="row-title">' + p.title + '</span>' +
          '<span class="rsub">' + p.sub + '</span>' +
        '</div>' +
        (p.featured ? '<span class="feat-tag" title="Featured">★</span>' : '') +
        '<span class="cat-tag">' + p.cat + '</span>' +
        '<span class="row-year">' + p.year + '</span>' +
        '<span class="row-arr">View ↗</span>' +
        '<div class="mob-row-foot"><span class="mob-view-btn mob-view-sm">View ↗</span></div>' +
      '</a>';
    list.appendChild(wrap);
  });
})();
</script>`;

  return wrap(prefix, `${title} — Avigail Bahat`, `
  <div class="proj-page-grid">
    <div class="proj-gutter proj-gutter-left"></div>
    <main class="proj-main">
      <div class="proj-side-nav">
        ${prevProj ? `<a class="proj-nav-btn proj-nav-prev" href="${prevProj.slug}.html" aria-label="Previous project"><span class="proj-nav-name"><i class="ti ti-arrow-left"></i> ${prevTitle}</span></a>` : '<span></span>'}
        ${nextProj ? `<a class="proj-nav-btn proj-nav-next" href="${nextProj.slug}.html" aria-label="Next project"><span class="proj-nav-name">${nextTitle} <i class="ti ti-arrow-right"></i></span></a>` : '<span></span>'}
      </div>
      <div class="proj-title-sticky" id="proj-title-sticky">
        <div class="proj-title-row">
          ${prevProj ? `<button class="proj-nav-arr" id="proj-prev" aria-label="Previous project" onclick="location.href='${prevProj.slug}.html'">←</button>` : ''}
          <h1 class="proj-title-m">${title}</h1>
          ${nextProj ? `<button class="proj-nav-arr" id="proj-next" aria-label="Next project" onclick="location.href='${nextProj.slug}.html'">→</button>` : ''}
        </div>
        ${proj.subtitle ? `<p class="proj-subtitle-m">${proj.subtitle}</p>` : ''}
        <div class="proj-meta-m">
          ${prevProj ? `<button class="proj-nav-text" aria-label="Previous project" onclick="location.href='${prevProj.slug}.html'">← Previous</button>` : ''}
          <span class="pm">${year}</span>
          <span class="psep">·</span>
          ${catHtml}
          ${nextProj ? `<button class="proj-nav-text proj-nav-text-next" aria-label="Next project" onclick="location.href='${nextProj.slug}.html'">Next →</button>` : ''}
        </div>
      </div>
      <div class="proj-content">
        ${proj.contentHtml}
      </div>
    </main>
    <div class="proj-gutter proj-gutter-right"></div>
  </div>
  <section class="more-section">
    <div class="more-inner">
      <p class="more-label">More work</p>
      <div id="more-list"></div>
      <div class="more-cta">
        <a href="../index.html" class="more-cta-link">See all work →</a>
      </div>
    </div>
  </section>
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
  </div>`, moreJs + `
<script>
(function(){
  var sticky = document.getElementById('proj-title-sticky');
  if (!sticky) return;
  var isMobile = window.innerWidth <= 768;
  if (isMobile) {
    window.addEventListener('scroll', function(){
      sticky.classList.toggle('condensed', window.scrollY > 56);
    }, { passive: true });
    var titleEl2 = sticky.querySelector('.proj-title-m');
    var origTitle = titleEl2 ? titleEl2.textContent : '';
    var sentinel = document.querySelector('.more-section');
    if (sentinel && titleEl2 && window.IntersectionObserver) {
      new IntersectionObserver(function(entries){
        if (entries[0].isIntersecting) {
          titleEl2.textContent = 'More work';
          sticky.classList.add('at-bottom');
        } else {
          titleEl2.textContent = origTitle;
          sticky.classList.remove('at-bottom');
        }
      }, { threshold: 0.1 }).observe(sentinel);
    }
  } else {
    var titleEl = sticky.querySelector('.proj-title-m');
    var R = 110, TITLE_FROM = 54, TITLE_TO = 22, PAD_FROM = 28, PAD_TO = 14;
    var ticking = false;
    function lerp(a, b, t){ return a + (b - a) * t; }
    function ease(t){ return 1 - Math.pow(1 - t, 3); }
    function update(){
      ticking = false;
      var raw = Math.min(Math.max((window.scrollY - 60) / R, 0), 1);
      var p = ease(raw);
      if (titleEl) titleEl.style.fontSize = lerp(TITLE_FROM, TITLE_TO, p) + 'px';
      sticky.style.paddingTop = lerp(PAD_FROM, PAD_TO, p) + 'px';
      sticky.style.paddingBottom = lerp(PAD_FROM, PAD_TO, p) + 'px';
      sticky.classList.toggle('condensed', raw > 0.4);
    }
    window.addEventListener('scroll', function(){ if (!ticking){ ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }
})();
</script>`, '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">\n  ', 'proj-page');
}

function aboutPage(notionHtml) {
  // If Notion content fetched, use it; otherwise use hardcoded fallback
  if (notionHtml && notionHtml.trim()) {
    const firstParaMatch = notionHtml.match(/^<p>([\s\S]*?)<\/p>/);
    const bioText = firstParaMatch ? firstParaMatch[1] : '';
    const withoutBio = notionHtml.replace(/^<p>[\s\S]*?<\/p>\s*/, '');
    return wrap('', 'About — Avigail Bahat', `
  <main class="inner-main">
    <div class="inner-content">
      <h1>About</h1>
      ${bioText ? `<p class="about-bio">${bioText}</p>` : ''}
      <div class="about-notion">
        ${withoutBio}
      </div>
      <p class="section-label">Contact</p>
      <div class="about-contact">
        <a href="mailto:avigailba@gmail.com" class="about-contact-link">avigailba@gmail.com <span class="about-arr">↗</span></a>
        <a href="https://www.linkedin.com/in/avigailbahat/" target="_blank" rel="noreferrer" class="about-contact-link">LinkedIn <span class="about-arr">↗</span></a>
        <a href="https://docs.google.com/document/d/1f0pEtgv_I89h16hgUF0ncW52EBcFwVPrjrJFzW3teI4/export?format=pdf" target="_blank" rel="noreferrer" class="about-contact-link">CV <span class="about-arr">↗</span></a>
      </div>
    </div>
  </main>`);
  }

  return wrap('', 'About — Avigail Bahat', `
  <main class="inner-main">
    <div class="inner-content">

      <h1>About</h1>
      <p class="about-bio">Senior UX Designer. I've spent my career building tools - for developers, for internal teams, and for end users.</p>

      <p class="section-label">Experience</p>

      <div class="cv-role">
        <span class="cv-title">UX Designer · Wix.com · 2014–2026</span>
        <div class="cv-sub-roles">

          <div class="cv-sub-role">
            <span class="cv-years">2025→2026 · OS Company</span>
            <p class="cv-desc">Designed platform-level AI and developer-facing products. Led UX for the AI Credits system across Business Manager and Wixel, and redesigned the app installation data experience for developers.</p>
            <p class="cv-proj-list">AI Credits Wallet, App Installation View</p>
          </div>

          <div class="cv-sub-role">
            <span class="cv-years">2020→2025 · App Market's Developer Center</span>
            <p class="cv-desc">Owned design across Wix's Developer Center: monetisation infrastructure, platform tooling, and internal operations. Worked end-to-end on developer onboarding, payout systems, pricing, and marketplace tooling.</p>
            <p class="cv-proj-list">App Pricing, Payouts, Refund Flow, Developer Sale, App Coupons, App Collections, App Reviews, Internal Review System, Submit &amp; Publish, API Keys, Development Site Creation</p>
          </div>

          <div class="cv-sub-role">
            <span class="cv-years">2019→2020 · Labs Company</span>
            <p class="cv-desc">Designed experimental product initiatives within Wix Labs, including a comments app and early-stage features.</p>
          </div>

          <div class="cv-sub-role">
            <span class="cv-years">2018→2019 · Media</span>
            <p class="cv-desc">Designed Wix Video's management experience, covering layouts, settings, and live video creation and broadcasting.</p>
          </div>

          <div class="cv-sub-role">
            <span class="cv-years">2014→2018 · ADI Founding</span>
            <p class="cv-desc">One of the founding UX designers on Wix ADI, an AI-powered website builder. Helped shape the product from concept through launch.</p>
          </div>

        </div>
      </div>

      <div class="cv-role">
        <span class="cv-title">Marketing Designer &amp; Lead · Wix · 2012→2013</span>
        <p class="cv-desc">Designed campaigns, landing pages, and banners. Led A/B tests on pricing and paywall pages.</p>
      </div>
      <div class="cv-role">
        <span class="cv-title">Graphic Designer · McCann Erickson · 2010→2012</span>
        <p class="cv-desc">Designed campaigns, print ads, and commercial storyboards as part of a small creative team.</p>
      </div>
      <div class="cv-role">
        <span class="cv-title">Graphic Designer · Walla News · 2008→2010</span>
        <p class="cv-desc">Created visual assets and retouched images for the news site.</p>
      </div>
      <div class="cv-role">
        <span class="cv-title">Trainer · Military Service · 2002→2004</span>
        <p class="cv-desc">Trainer in Armored Corps.</p>
      </div>

      <p class="section-label">Education</p>

      <div class="cv-role">
        <div class="cv-role-header"><span class="cv-years">2006–2010 · Shenkar College of Engineering &amp; Design</span></div>
        <p class="cv-desc">B.Des. in Graphic Design</p>
      </div>

      <p class="section-label">Skills</p>
      <p class="cv-skills">Figma · Google Suite · Cursor · Claude Code · Hebrew (native) · English</p>

      <p class="section-label">Contact</p>
      <div class="about-contact">
        <a href="mailto:avigailba@gmail.com" class="about-contact-link">avigailba@gmail.com <span class="about-arr">↗</span></a>
        <a href="https://www.linkedin.com/in/avigailbahat/" target="_blank" rel="noreferrer" class="about-contact-link">LinkedIn <span class="about-arr">↗</span></a>
        <a href="https://docs.google.com/document/d/1f0pEtgv_I89h16hgUF0ncW52EBcFwVPrjrJFzW3teI4/export?format=pdf" target="_blank" rel="noreferrer" class="about-contact-link">CV <span class="about-arr">↗</span></a>
      </div>

    </div>
  </main>`);
}

function contactPage() {
  return wrap('', 'Contact — Avigail Bahat', `
  <main class="inner-main">
    <div class="inner-content">
      <h1>Contact</h1>
      <p class="page-sub">Let's talk.</p>

      <p class="contact-intro">
        I'm currently looking for my next role. If you're working on something interesting - developer tools, AI products, complex B2B systems - I'd love to hear about it.
      </p>

      <div class="contact-links">
        <a href="mailto:avigailba@gmail.com" class="contact-link">
          <span class="contact-link-label">Email</span>
          <span class="contact-link-val">avigailba@gmail.com <span class="contact-arr">↗</span></span>
        </a>
        <a href="https://www.linkedin.com/in/avigailbahat/" class="contact-link">
          <span class="contact-link-label">LinkedIn</span>
          <span class="contact-link-val">avigailbahat <span class="contact-arr">↗</span></span>
        </a>
      </div>

    </div>
  </main>`);
}

function designSystemPage(notionConnected) {
  const swatches = [
    { hex: '#0a0a0a', name: 'Black',     usage: 'Primary text, hover fill, footer bg' },
    { hex: '#555555', name: 'Gray',      usage: 'All secondary text: nav, labels, years, body copy' },
    { hex: '#ffffff', name: 'White',     usage: 'Page background, text on dark' },
    { hex: '#ebebeb', name: 'Surface / Border', usage: 'Hairline borders, surface backgrounds (--border)' },
    { hex: '#22c55e', name: 'Available', usage: 'Availability dot only' },
  ];
  const typeRows = [
    { sample: 'AI Credits',                  spec: '54px / 700 / −0.03em / Plus Jakarta Sans', where: 'Project page title, featured cards (.proj-title, .feat-title)',        style: 'font-size:54px;font-weight:700;letter-spacing:-0.03em;color:#0a0a0a;line-height:1.1;font-family:"Plus Jakarta Sans",sans-serif' },
    { sample: 'Design system',               spec: '32px / 700 / −0.02em / Inter',             where: 'Inner page h1, footer statement, project section headings (.inner-content h1, .footer-statement, .proj-content h2)', style: 'font-size:32px;font-weight:700;letter-spacing:-0.02em;color:#0a0a0a' },
    { sample: 'Senior UX designer.',         spec: '28px / 500 / −0.01em / Plus Jakarta Sans', where: 'Homepage lede (.lede)',                                               style: 'font-size:28px;font-weight:500;letter-spacing:-0.01em;color:#0a0a0a;font-family:"Plus Jakarta Sans",sans-serif' },
    { sample: 'Transparent AI usage billing across the platform.', spec: '20px / 500 / Inter', where: 'Project subtitle, content sub-headings, CV role titles (.proj-subtitle, .proj-content h3, .cv-title)', style: 'font-size:20px;font-weight:500;color:#0a0a0a;line-height:1.4' },
    { sample: 'Body copy — project content, about, contact, work rows.', spec: '16px / 400 / Inter / lh 1.7 / #555', where: 'All body and secondary text (.proj-intro, .proj-content p, .proj-body, .row-title, .cv-desc, .cv-years, .contact-intro)', style: 'font-size:16px;color:#555;line-height:1.7' },
    { sample: 'FEATURED WORK · EXPERIENCE',  spec: '14px / 400 / uppercase / 0.07–0.08em',   where: 'Section labels, about page section labels (.section-label, .more-label, .about-notion h2)', style: 'font-size:14px;letter-spacing:0.07em;text-transform:uppercase;color:#555' },
    { sample: 'Nav links, years, tags, meta', spec: '14px / 400 / Inter',                    where: 'Nav links, row meta, tag labels, footer text',                          style: 'font-size:14px;color:#555' },
  ];
  const spacings = [
    { token: '--sp-1', val: '4px',  usage: 'Tight gaps' },
    { token: '--sp-2', val: '8px',  usage: 'Icon-text gaps' },
    { token: '--sp-3', val: '12px', usage: 'List row padding' },
    { token: '--sp-4', val: '16px', usage: 'Component internal' },
    { token: '--sp-5', val: '24px', usage: 'Section gaps' },
    { token: '--sp-6', val: '32px', usage: 'Page horizontal padding' },
    { token: '--sp-7', val: '48px', usage: 'Section vertical spacing' },
    { token: '--sp-8', val: '64px', usage: 'Footer padding, large gaps' },
  ];

  const swatchHtml = swatches.map(s =>
    `<div class="ds-swatch">
      <div class="ds-swatch-box" style="background:${s.hex}"></div>
      <span class="ds-swatch-hex">${s.hex}</span>
      <span class="ds-swatch-name">${s.name}</span>
      <span style="font-size:14px;color:#555;display:block">${s.usage}</span>
    </div>`
  ).join('\n      ');

  const typeHtml = typeRows.map((r, i) => {
    const colorMatch = r.style.match(/color:([^;]+)/);
    const color = colorMatch ? colorMatch[1].trim() : '#0a0a0a';
    return `<div class="ds-type-row">
      <span class="ds-type-num">${i + 1}</span>
      <div class="ds-type-sample" style="${r.style}">${r.sample}</div>
      <div class="ds-type-meta">
        <span class="ds-type-spec">${r.spec}<span class="ds-type-color"><span class="ds-type-dot" style="background:${color}"></span>${color}</span></span>
        <span class="ds-type-where">${r.where}</span>
      </div>
    </div>`;
  }).join('\n    ');

  const spacingHtml = spacings.map(s =>
    `<div class="ds-sp-row">
      <span class="ds-sp-token">${s.token}</span>
      <div class="ds-sp-bar" style="width:${s.val}"></div>
      <span class="ds-sp-val">${s.val}</span>
      <span style="font-size:14px;color:#555">${s.usage}</span>
    </div>`
  ).join('\n    ');

  const built = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const changelog = [
    { date: '2 Jun 2026', change: 'Project page images now use site padding (clamp(40px, 20%, 240px)) — content aligned with header' },
    { date: '2 Jun 2026', change: 'Prev/next project nav buttons changed to blue (#2563eb)' },
    { date: '2 Jun 2026', change: 'All work section label removed — filters shown directly. All filter renamed All projects' },
    { date: '2 Jun 2026', change: 'Work nav link added to desktop header' },
    { date: '2 Jun 2026', change: 'Featured grid no longer bleeds on mobile — negative margins reset to 0 at ≤960px' },
    { date: '2 Jun 2026', change: 'Type scale numbered (1–12) so styles can be referenced by number' },
    { date: '2 Jun 2026', change: 'feat-title merged with proj-title: 42px/800 → 64px/700/−0.03em/Plus Jakarta Sans' },
    { date: '2 Jun 2026', change: 'proj-content h2 merged with inner-content h1: 28px/600 → 32px/700/−0.02em/Inter — type scale consolidated from 14 to 12 steps' },
    { date: '2 Jun 2026', change: 'Featured card WordArt hover: brighter luminous gradients with 5-step coloured depth shadows — blue (card 1), amber (card 2), violet (card 3), emerald (card 4)' },
    { date: '2 Jun 2026', change: 'All-work rows: animated gradient title on hover ("Gradient Flow") — category-coloured accent pair flows across the title; number and arrow pick up flat accent; respects prefers-reduced-motion' },
    { date: '2 Jun 2026', change: 'Row accordion changed from max-height to opacity animation — prevents footer flash on page load' },
    { date: '2 Jun 2026', change: 'Homepage content padding unified to clamp(40px, 20%, 240px) — aligns header, content, and footer left edges' },
    { date: '1 Jun 2026', change: 'Design system: colour swatches in 6-column grid; type scale shows where each style appears' },
    { date: '1 Jun 2026', change: 'feat-title bumped to 42px / weight 800 (Plus Jakarta Sans)' },
    { date: '1 Jun 2026', change: 'All body and secondary text unified to #555 — removed #444 and #121212' },
    { date: '1 Jun 2026', change: 'Type scale consolidated: footer-statement 36px → 32px / Inter; row-title 20px/500 → 18px/400; CV text 15px → 16px; proj-subtitle weight 400 → 500, color #555 → #0a0a0a' },
    { date: '1 Jun 2026', change: 'Design system type scale rows show inline color swatch and hex value' },
    { date: '1 Jun 2026', change: 'Design system swatches and type scale updated to match actual site tokens' },
    { date: '1 Jun 2026', change: 'Removed Wix from project page metadata' },
    { date: '1 Jun 2026', change: 'Project page layout: 3-column grid with sticky gutters for prev/next navigation' },
    { date: '1 Jun 2026', change: 'Sticky condensing title block on project pages (ptb-inner)' },
    { date: '1 Jun 2026', change: 'Tabler icons CDN moved to project pages only' },
    { date: '1 Jun 2026', change: 'Row hover: subtitle fades in, no title movement, overflow fixed' },
    { date: '1 Jun 2026', change: 'Typography: Plus Jakarta Sans for titles, Inter for all UI and body' },
    { date: '1 Jun 2026', change: 'Gray token consolidated to #555 (was #888, then #555)' },
    { date: '1 Jun 2026', change: 'Horizontal padding changed to clamp(40px, 20%, 240px) sitewide' },
  ];
  const changelogHtml = changelog.map(c =>
    `<div class="ds-cl-row">
      <span class="ds-cl-date">${c.date}</span>
      <span class="ds-cl-text">${c.change}</span>
    </div>`
  ).join('\n    ');

  return wrap('', 'Design System — Avigail Bahat', `
  <div id="ds-gate" style="position:fixed;inset:0;z-index:999;background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;">
    <div style="max-width:300px;width:100%;padding:0 24px;">
      <p style="font-size:15px;color:#555;margin-bottom:20px;text-align:center;">Enter password</p>
      <input id="ds-pw" type="password" placeholder="Password" autocomplete="current-password"
        style="width:100%;font-size:15px;padding:10px 14px;border:0.5px solid #ebebeb;border-radius:6px;outline:none;font-family:inherit;box-sizing:border-box;margin-bottom:10px;display:block;">
      <button onclick="dsAuth()"
        style="width:100%;font-size:15px;padding:10px 14px;background:#0a0a0a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-family:inherit;">
        Enter
      </button>
      <p id="ds-err" style="font-size:13px;color:#c00;margin-top:10px;display:none;text-align:center;">Incorrect password</p>
    </div>
  </div>
  <main class="inner-main">
    <div class="inner-content ds-content">
      <h1>Design system</h1>
      <p class="page-sub">Visual language reference for avigailbahat.com</p>
      <p class="ds-notion-status ${notionConnected ? 'ds-notion-connected' : 'ds-notion-static'}"><span class="ds-notion-dot"></span>${notionConnected ? 'Live — content from Notion' : 'Static fallback — Notion not connected'}</p>

      <div class="ds-section">
        <span class="ds-section-title">Colours</span>
        <div class="ds-swatches">
          ${swatchHtml}
        </div>
      </div>

      <div class="ds-section">
        <span class="ds-section-title">Typography</span>
        ${typeHtml}
      </div>

      <div class="ds-section">
        <span class="ds-section-title">Spacing</span>
        <div class="ds-spacing">
          ${spacingHtml}
        </div>
      </div>

      <div class="ds-section">
        <span class="ds-section-title">Components</span>

        <div class="ds-tabs">
          <button class="ds-tab-btn active" onclick="dsTab(this,'desktop')">Desktop</button>
          <button class="ds-tab-btn" onclick="dsTab(this,'mobile')">Mobile</button>
        </div>

        <!-- Desktop tab -->
        <div class="ds-tab-panel active" id="ds-tab-desktop">

          <div class="ds-comp-block">
            <span class="ds-comp-label">Work item row</span>
            <div class="ds-comp-demo" style="padding:0 24px;">
              <div class="row-wrap open" style="max-height:none;">
                <div class="row" data-cat="developer" style="border-top:0.5px solid #ebebeb;">
                  <span class="num">01</span>
                  <div class="rmain">
                    <span class="row-title">AI Credits Wallet</span>
                    <span class="rsub">End-to-end billing transparency for AI usage across the platform</span>
                  </div>
                  <span class="cat-tag">developer</span>
                  <span class="row-year">2026</span>
                  <span class="row-arr">View ↗</span>
                </div>
              </div>
            </div>
          </div>

          <div class="ds-comp-block">
            <span class="ds-comp-label">Filter buttons</span>
            <div class="ds-comp-demo" style="display:flex;gap:16px;align-items:center;">
              <button class="filter-btn active">All projects</button>
              <button class="filter-btn">Developer tools</button>
              <button class="filter-btn">Monetisation</button>
            </div>
          </div>

          <div class="ds-comp-block">
            <span class="ds-comp-label">Nav links</span>
            <div class="ds-comp-demo">
              <nav style="display:flex;gap:4px;">
                <a href="#" style="font-size:14px;color:#555;padding:5px 10px;border-radius:5px;">Home</a>
                <a href="#" style="font-size:14px;color:#555;padding:5px 10px;border-radius:5px;">Work</a>
                <a href="#" style="font-size:14px;padding:5px 10px;border-radius:5px;background:#0a0a0a;color:#fff;">About (hover)</a>
                <a href="#" style="font-size:14px;color:#0a0a0a;font-weight:500;padding:5px 10px;border-radius:5px;">Contact (active)</a>
              </nav>
            </div>
          </div>

          <div class="ds-comp-block">
            <span class="ds-comp-label">Project nav buttons (prev / next)</span>
            <div class="ds-comp-demo" style="display:flex;gap:48px;align-items:center;">
              <a href="#" class="proj-nav-btn" style="position:static;opacity:1;text-decoration:none;"><span class="proj-nav-name"><i class="ti ti-arrow-left"></i> AI Credits</span></a>
              <a href="#" class="proj-nav-btn" style="position:static;opacity:1;text-decoration:none;"><span class="proj-nav-name">App Reviews <i class="ti ti-arrow-right"></i></span></a>
            </div>
          </div>

          <div class="ds-comp-block">
            <span class="ds-comp-label">More work CTA</span>
            <div class="ds-comp-demo">
              <a href="#" class="more-cta-link">See all work →</a>
            </div>
          </div>

          <div class="ds-comp-block">
            <span class="ds-comp-label">Lightbox controls</span>
            <div class="ds-comp-demo ds-comp-demo-dark" style="display:flex;gap:12px;align-items:center;">
              <button class="lb-handle" style="position:static;">‹</button>
              <button class="lb-handle" style="position:static;">›</button>
              <button class="lb-close" style="position:static;font-size:20px;background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;padding:8px;line-height:1;">✕</button>
            </div>
          </div>

          <div class="ds-comp-block">
            <span class="ds-comp-label">Footer tags</span>
            <div class="ds-comp-demo ds-comp-demo-dark" style="padding:20px;">
              <div class="footer-tags" style="margin:0">
                <span class="ftag">Developer tools</span>
                <span class="ftag">AI products</span>
                <span class="ftag">Complex systems</span>
                <span class="ftag">B2B SaaS</span>
              </div>
            </div>
          </div>

          <div class="ds-comp-block">
            <span class="ds-comp-label">Section label</span>
            <div class="ds-comp-demo">
              <p class="section-label" style="margin:0">All projects</p>
            </div>
          </div>

        </div>

        <!-- Mobile tab -->
        <div class="ds-tab-panel" id="ds-tab-mobile">

          <div class="ds-comp-block">
            <span class="ds-comp-label">Hamburger button</span>
            <div class="ds-comp-demo">
              <button class="mob-burger" style="display:flex;position:static;">
                <span></span><span></span><span></span>
              </button>
            </div>
          </div>

          <div class="ds-comp-block">
            <span class="ds-comp-label">Slide-in menu panel</span>
            <div class="ds-comp-demo" style="padding:0;overflow:hidden;">
              <div style="max-width:300px;padding:20px 24px 24px;background:#fff;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
                  <span style="font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:600;color:#0a0a0a;">Avigail Bahat</span>
                  <button style="width:30px;height:30px;border-radius:8px;border:0.5px solid #ebebeb;display:flex;align-items:center;justify-content:center;font-size:14px;color:#555;background:none;cursor:pointer;">✕</button>
                </div>
                <div>
                  <span style="display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;padding:10px 0;color:#0a0a0a;border-bottom:0.5px solid #ebebeb;">Home ↗</span>
                  <span style="display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;padding:10px 0;color:#aaa;border-bottom:0.5px solid #ebebeb;">Work</span>
                  <span style="display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;padding:10px 0;color:#aaa;border-bottom:0.5px solid #ebebeb;">About</span>
                  <span style="display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;padding:10px 0;color:#aaa;border-bottom:0.5px solid #ebebeb;">Contact</span>
                  <span style="display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;padding:10px 0;color:#aaa;">Design system</span>
                </div>
                <div style="margin-top:16px;padding-top:16px;border-top:0.5px solid #ebebeb;">
                  <div style="display:flex;justify-content:space-between;font-size:14px;color:#555;padding:7px 0;">avigailba@gmail.com <span>↗</span></div>
                  <div style="display:flex;justify-content:space-between;font-size:14px;color:#555;padding:7px 0;">LinkedIn <span>↗</span></div>
                </div>
              </div>
            </div>
          </div>

          <div class="ds-comp-block">
            <span class="ds-comp-label">Work row (mobile)</span>
            <div class="ds-comp-demo" style="padding:0 16px;">
              <div style="display:flex;align-items:center;gap:10px;padding:14px 0;border-top:0.5px solid #ebebeb;border-bottom:0.5px solid #ebebeb;">
                <span style="font-size:12px;font-weight:500;color:#555;min-width:22px;flex-shrink:0;">01</span>
                <div style="flex:1;min-width:0;">
                  <span style="display:block;font-size:16px;font-weight:400;color:#0a0a0a;line-height:1.3;">AI Credits Wallet</span>
                  <span style="display:block;font-size:12px;color:#555;margin-top:3px;">AI credits billing system across Business Manager and Wixel</span>
                </div>
                <span style="font-size:13px;font-weight:500;color:#2b6cff;flex-shrink:0;">View ↗</span>
              </div>
            </div>
          </div>

          <div class="ds-comp-block">
            <span class="ds-comp-label">View buttons</span>
            <div class="ds-comp-demo" style="display:flex;gap:24px;align-items:center;">
              <a href="#" style="font-size:14px;font-weight:500;color:#2b6cff;text-decoration:none;">View project ↗</a>
              <a href="#" style="font-size:13px;font-weight:500;color:#2b6cff;text-decoration:none;">View ↗</a>
            </div>
          </div>

          <div class="ds-comp-block">
            <span class="ds-comp-label">Filter pill + dropdown</span>
            <div class="ds-comp-demo" style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;">
              <div>
                <span style="display:block;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:8px;">Closed</span>
                <button style="display:inline-flex;align-items:center;gap:6px;font-size:14px;color:#0a0a0a;padding:7px 13px;border:0.5px solid #ebebeb;border-radius:999px;background:none;cursor:pointer;font-family:inherit;">All projects <span style="font-size:10px;color:#555;">▾</span></button>
              </div>
              <div>
                <span style="display:block;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:8px;">Open</span>
                <button style="display:inline-flex;align-items:center;gap:6px;font-size:14px;color:#fff;padding:7px 13px;border:0.5px solid #0a0a0a;border-radius:999px;background:#0a0a0a;cursor:pointer;font-family:inherit;">All projects <span style="font-size:10px;color:rgba(255,255,255,0.6);">▴</span></button>
              </div>
            </div>
          </div>

          <div class="ds-comp-block">
            <span class="ds-comp-label">Featured card (mobile)</span>
            <div class="ds-comp-demo" style="padding:20px 0;border-left:none;border-right:none;border-radius:0;">
              <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:48px;font-weight:800;letter-spacing:-0.03em;line-height:1.05;color:#0a0a0a;margin-bottom:10px;">AI Credits</div>
              <div style="font-size:15px;color:#555;margin-bottom:14px;">AI credits billing system across Business Manager and Wixel</div>
              <a href="#" style="font-size:14px;font-weight:500;color:#2b6cff;text-decoration:none;">View project ↗</a>
            </div>
          </div>

        </div>

      </div>

      <div class="ds-section">
        <span class="ds-section-title">CSS variable reference</span>
        <div class="ds-code">:root {
  /* Accent */
  --ac: #0a0a0a;

  /* Borders */
  --border: #ebebeb;

  /* Spacing */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 24px;
  --sp-6: 32px;
  --sp-7: 48px;
  --sp-8: 64px;
}</div>
      </div>

      <div class="ds-section">
        <span class="ds-section-title">Changelog</span>
        <div class="ds-changelog">
          ${changelogHtml}
        </div>
      </div>

      <p class="ds-updated">Last built: ${built}</p>
    </div>
  </main>
  <script>
  function dsTab(btn, tab) {
    document.querySelectorAll('.ds-tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.ds-tab-panel').forEach(function(p) { p.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('ds-tab-' + tab).classList.add('active');
  }
  window.dsAuth = function() {
    var val = (document.getElementById('ds-pw').value || '').trim();
    if (val === '2108') {
      sessionStorage.setItem('ds_auth', '1');
      document.getElementById('ds-gate').style.display = 'none';
    } else {
      document.getElementById('ds-err').style.display = 'block';
      document.getElementById('ds-pw').value = '';
      document.getElementById('ds-pw').focus();
    }
  };
  (function() {
    var gate = document.getElementById('ds-gate');
    if (sessionStorage.getItem('ds_auth') === '1') { gate.style.display = 'none'; return; }
    document.getElementById('ds-pw').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') window.dsAuth();
    });
  })();
  </script>`);
}

// ── Build ────────────────────────────────────────────────────

async function build() {
  fs.mkdirSync(DIST, { recursive: true });
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  fs.mkdirSync(IMAGES, { recursive: true });
  fs.copyFileSync('style.css', path.join(DIST, 'style.css'));
  fs.copyFileSync('script.js', path.join(DIST, 'script.js'));
  ['favicon-32x32.png','favicon-16x16.png','apple-touch-icon.png'].forEach(f => {
    if (fs.existsSync(f)) fs.copyFileSync(f, path.join(DIST, f));
  });

  let projects = [];
  let tagline = "Senior UX designer. I like the problems that need a whiteboard. I've spent my career building tools - for developers, for internal teams, and for end users.";
  let aboutHtml = '';

  try {
    console.log('Fetching project pages from Notion...');
    const raw = (await collectPages(ROOT_PAGE_ID))
      .filter(p => !SKIP_IDS.has(p.id) && !SKIP_SLUGS.has(slugify(p.title)));
    console.log(`Found ${raw.length} projects`);

    for (const p of raw) {
      const meta = await notion.pages.retrieve({ page_id: p.id });
      const icon = meta.icon?.type === 'emoji' ? meta.icon.emoji : '';
      const year = new Date(meta.created_time).getFullYear().toString();
      const summary = meta.properties?.Summary?.rich_text?.[0]?.plain_text || '';
      const contentHtml = await toHtml(p.blocks, '../');
      const title = stripEmoji(p.title);
      const slug = NOTION_ID_TO_SLUG[p.id.replace(/-/g, '')] || slugify(title);
      const subtitle = firstSubtitle(p.blocks) || summary || PROJECT_SUMMARIES[slug] || '';
      projects.push({ ...p, title, icon, year, slug, summary, subtitle, contentHtml, excerpt: excerpt(p.blocks), callout: firstCallout(p.blocks) });
    }

    for (let i = 0; i < projects.length; i++) {
      const prev = projects[(i - 1 + projects.length) % projects.length];
      const next = projects[(i + 1) % projects.length];
      fs.writeFileSync(path.join(PROJECTS_DIR, `${projects[i].slug}.html`), projectPage(projects[i], prev, next));
      stats.pages++;
      console.log(`  ✓ projects/${projects[i].slug}.html`);
    }

    try {
      const hpBlocks = await notion.blocks.children.list({ block_id: HOMEPAGE_PAGE_ID });
      const firstPara = hpBlocks.results.find(b => b.type === 'paragraph');
      if (firstPara) tagline = plainText(firstPara.paragraph.rich_text) || tagline;
    } catch (e) { console.log('Could not fetch homepage tagline, using default'); }

    try {
      const aboutBlocks = await fetchBlocks(ABOUT_PAGE_ID);
      aboutHtml = await toHtml(aboutBlocks, '');
    } catch (e) { console.log('Could not fetch About page from Notion, using fallback'); }

  } catch (e) {
    console.error('Notion fetch failed:', e.code || e.status, e.message);
    console.error('Full error:', JSON.stringify(e.body || e, null, 2));
  }

  // Generate fallback pages for any META slugs not fetched from Notion
  const generatedSlugs = new Set(projects.map(p => p.slug));
  for (const [slug, meta] of Object.entries(PROJECT_META)) {
    if (generatedSlugs.has(slug)) continue;
    const summary = PROJECT_SUMMARIES[slug] || '';
    const fallbackProj = {
      slug,
      title: meta.title,
      year: String(meta.year),
      summary,
      subtitle: summary,
      contentHtml: '',
    };
    fs.writeFileSync(path.join(PROJECTS_DIR, `${slug}.html`), projectPage(fallbackProj, null, null));
    stats.pages++;
    console.log(`  ✓ projects/${slug}.html (static fallback)`);
  }

  for (const [file, html] of [
    ['index.html',          indexPage(projects, tagline)],
    ['about.html',          aboutPage(aboutHtml)],
    ['contact.html',        contactPage()],
    ['design-system.html',  designSystemPage(projects.length > 0)],
  ]) {
    fs.writeFileSync(path.join(DIST, file), html);
    stats.pages++;
    console.log(`  ✓ ${file}`);
  }

  console.log(`\n✓ Done — ${stats.pages} pages, ${stats.images} images downloaded, ${stats.cached || 0} cached`);
  if (stats.errors.length) {
    console.log(`  ${stats.errors.length} error(s):`);
    stats.errors.forEach(e => console.log(`  - ${e}`));
  }
}

build().catch(err => { console.error('Build error:', err.message); process.exit(0); });
