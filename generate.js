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
const DIST        = 'dist';
const PROJECTS_DIR = path.join(DIST, 'projects');
const IMAGES      = path.join(DIST, 'images');

let imgIdx = 0;
const stats = { pages: 0, images: 0, errors: [] };

// Project metadata: categories, display title overrides, years, featured status
const PROJECT_META = {
  'ai-credits-wallet':                          { title: 'AI Credits',                  cats: 'developer',              display: 'Developer tools', year: 2026, featured: true },
  'app-installation-page-for-developers': { title: 'App Installation View',       cats: 'developer',              display: 'Developer tools', year: 2025, featured: true },
  'app-reviews-revamp':                  { title: 'App Reviews Revamp',           cats: 'developer',              display: 'Developer tools', year: 2024, featured: false },
  'developer-sale':                      { title: 'Developer Sale',               cats: 'developer monetisation', display: 'Monetisation',    year: 2024, featured: true },
  'app-collections-internal-manager':    { title: 'App Collections',              cats: 'developer internal',     display: 'Internal tools',  year: 2024, featured: false },
  'payouts-page':                        { title: 'Payouts Page',                 cats: 'monetisation',           display: 'Monetisation',    year: 2023, featured: false },
  'refund-flow':                         { title: 'Refund Flow',                  cats: 'monetisation',           display: 'Monetisation',    year: 2023, featured: false },
  'app-pricing-page-projects':           { title: 'App Pricing Page',             cats: 'developer monetisation', display: 'Monetisation',    year: 2023, featured: false },
  'internal-app-review-system':          { title: 'Internal App Review System',   cats: 'internal',               display: 'Internal tools',  year: 2022, featured: true },
  'submit-publish-widget':               { title: 'Submit & Publish Widget',      cats: 'developer',              display: 'Developer tools', year: 2022, featured: false },
  'custom-element-component-settings':   { title: 'Custom Element Settings',      cats: 'cms',                    display: 'CMS',             year: 2022, featured: false },
  'api-keys-page':                       { title: 'API Keys Page',                cats: 'developer',              display: 'Developer tools', year: 2022, featured: false },
  'development-site-creation':           { title: 'Development Site Creation',    cats: 'developer',              display: 'Developer tools', year: 2021, featured: false },
  'app-coupons':                         { title: 'App Coupons',                  cats: 'monetisation',           display: 'Monetisation',    year: 2021, featured: false },
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
  'ai-credits-wallet':                          'Transparent AI usage billing across Wix\'s developer platform',
  'app-installation-page-for-developers': 'Redesigned the app installation experience end-to-end',
  'app-reviews-revamp':                  'Improved app review flows for the Wix App Market',
  'developer-sale':                      'A monetisation campaign tool for app developers',
  'app-collections-internal-manager':    'Curated app groupings for discovery and editorial placement',
  'payouts-page':                        'Dashboard for developers to track earnings and payout history',
  'refund-flow':                         'End-to-end refund process for app purchases',
  'app-pricing-page-projects':           'Redesigned pricing presentation for marketplace apps',
  'internal-app-review-system':          'Replaced a spreadsheet-based review process with a structured tool',
  'submit-publish-widget':               'Streamlined app submission and publishing for developers',
  'custom-element-component-settings':   'Settings UI for Wix\'s custom HTML element widget',
  'api-keys-page':                       'Key management interface for Wix\'s developer platform',
  'development-site-creation':           'Onboarding flow for creating Wix development sites',
  'app-coupons':                         'Coupon and discount tools for app monetisation',
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
  <div class="header-inner">
    <div class="logo-wrap">
      <div class="logo-text">
        <a href="${prefix}index.html" class="logo-name">Avigail Bahat</a>
        <span class="logo-role">Senior UX Designer</span>
      </div>
      <div class="avail-dot-wrap">
        <span class="avail-dot"></span>
        <span class="avail-label">Available for work</span>
      </div>
    </div>
    <nav>
      <a href="${prefix}index.html">Home</a>
      <a href="${prefix}about.html">About</a>
      <a href="${prefix}contact.html">Contact</a>
    </nav>
  </div>
</header>`;
}

function ftr() {
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
    </div>
  </div>
  <div class="footer-bottom">© 2026 Avigail Bahat</div>
</footer>`;
}

// prefix: '' for root pages, '../' for project pages
function wrap(prefix, title, body, extraScript = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap">
  <link rel="stylesheet" href="${prefix}style.css">
</head>
<body>
  ${hdr(prefix)}
  ${body}
  ${ftr()}
  <script src="${prefix}script.js"></script>
  ${extraScript}
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
  <div class="feat-title">${meta.title}</div>
  ${summary ? `<div class="feat-sub">${summary}</div>` : ''}
  <div class="feat-arr">↗</div>
</div>`;
  }).join('\n  ');

  // Full list: sort by year desc, then by PROJECT_META insertion order
  const metaSlugs = Object.keys(PROJECT_META);
  const allSlugs = metaSlugs.filter(s => bySlug[s]);
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
    const title   = meta?.title   || proj?.title   || slug;
    const cats    = meta?.cats    || '';
    const display = meta?.display || '';
    const year    = meta?.year    || proj?.year    || '';
    const summary = proj?.summary || PROJECT_SUMMARIES[slug] || '';
    const featured = meta?.featured || false;
    return `<div class="row-wrap">
  <div class="row" data-cat="${cats}" onclick="location.href='projects/${slug}.html'">
    <span class="num">${String(i + 1).padStart(2, '0')}</span>
    <div class="rmain">
      <div class="row-title">${title}</div>
      ${summary ? `<div class="rsub">${summary}</div>` : ''}
    </div>
    ${featured ? `<span class="feat-tag">Featured</span>` : ''}
    <span class="cat-tag">${display}</span>
    <span class="row-year">${year}</span>
    <span class="row-arr">↗</span>
  </div>
</div>`;
  }).join('\n  ');

  return wrap('', 'Avigail Bahat — Product Designer', `
  <main class="home-band">
    <p class="lede">${tagline}</p>
    <p class="section-label">Featured work</p>
    <div class="feat-grid">
      ${featHtml}
    </div>
    <div class="work-header">
      <span class="section-label">All work</span>
      <div class="filters">
        <button class="filter-btn active" data-f="all">All</button>
        <button class="filter-btn" data-f="developer">Developer tools</button>
        <button class="filter-btn" data-f="monetisation">Monetisation</button>
        <button class="filter-btn" data-f="internal">Internal tools</button>
        <button class="filter-btn" data-f="cms">CMS</button>
      </div>
    </div>
    <div id="list">
      ${listHtml}
    </div>
  </main>`);
}

function projectPage(proj) {
  const prefix = '../';
  const meta  = PROJECT_META[proj.slug] || {};
  const title = meta.title || proj.title;
  const year  = meta.year  || proj.year;
  const cat   = meta.display || 'Product Design';

  const allProjectsJs = Object.entries(PROJECT_META)
    .map(([slug, m]) => {
      const sub = (PROJECT_SUMMARIES[slug] || '').replace(/'/g, "\\'");
      return `  { slug: '${slug}', title: '${m.title.replace(/'/g, "\\'")}', sub: '${sub}', cat: '${m.display}', year: ${m.year}, featured: ${m.featured} }`;
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
    wrap.className = 'row-wrap';
    wrap.innerHTML =
      '<div class="row" onclick="window.location.href=\\'' + p.slug + '.html\\'">' +
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
</script>`;

  return wrap(prefix, `${title} — Avigail Bahat`, `
  <main class="proj-main">
    <div class="proj-content">
      <h1 class="proj-title">${title}</h1>
      <div class="proj-meta">
        <span class="proj-meta-item">${year}</span>
        <span class="proj-meta-sep">·</span>
        <span class="proj-meta-item">${cat}</span>
        <span class="proj-meta-sep">·</span>
        <span class="proj-meta-item">Wix</span>
      </div>
      ${(proj.callout || proj.excerpt) ? `<p class="proj-intro">${proj.callout || proj.excerpt}</p>` : ''}
      ${proj.contentHtml}
    </div>
  </main>
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
  </div>`, moreJs);
}

function aboutPage() {
  return wrap('', 'About — Avigail Bahat', `
  <main class="inner-main">
    <div class="inner-content">

      <p class="section-label">Experience</p>

      <div class="cv-role">
        <div class="cv-role-header"><span class="cv-title">UX Designer · Wix.com · 2014–2026</span></div>
      </div>

      <div class="cv-role">
        <div class="cv-role-header"><span class="cv-years">2025–2026 · OS company</span></div>
        <p class="cv-desc">Designed platform-level AI and developer-facing products. Led UX for the AI Credits system across Business Manager and Wixel, and redesigned the app installation data experience for developers.</p>
        <p class="cv-proj-list">AI Credits Wallet, App Installation View</p>
      </div>

      <div class="cv-role">
        <div class="cv-role-header"><span class="cv-years">2020–2025 · App Market</span></div>
        <p class="cv-desc">Owned design across Wix's developer marketplace: monetisation infrastructure, platform tooling, and internal operations. Worked end-to-end across developer onboarding, payout systems, and marketplace tooling.</p>
        <p class="cv-proj-list">App Pricing, Payouts, Refund Flow, Developer Sale, App Coupons, App Collections, App Reviews, Internal Review System, Submit &amp; Publish, API Keys, Development Site Creation</p>
      </div>

      <div class="cv-role">
        <div class="cv-role-header"><span class="cv-years">2019–2020 · Labs</span></div>
        <p class="cv-desc">Worked on experimental product initiatives within Wix, including a comments app and various early-stage features.</p>
      </div>

      <div class="cv-role">
        <div class="cv-role-header"><span class="cv-years">2018–2019 · Media</span></div>
        <p class="cv-desc">Designed the core video creation and management experience as part of the Wix Video product team.</p>
      </div>

      <div class="cv-role">
        <div class="cv-role-header"><span class="cv-years">2014–2018 · Wix ADI</span></div>
        <p class="cv-desc">One of the founding UX designers on Wix ADI, an AI-powered website builder. Helped define and design the product from the ground up.</p>
      </div>

      <div class="cv-role">
        <div class="cv-role-header"><span class="cv-title">Marketing Designer &amp; Lead · Wix · 2012–2013</span></div>
      </div>

      <div class="cv-role">
        <div class="cv-role-header"><span class="cv-title">Graphic Designer · McCann Erickson Israel · 2010–2012</span></div>
      </div>

      <div class="cv-role">
        <div class="cv-role-header"><span class="cv-title">Graphics · Walla.co.il · 2008–2010</span></div>
      </div>

      <p class="section-label">Education</p>

      <div class="cv-role">
        <div class="cv-role-header"><span class="cv-years">2006–2010 · Shenkar College of Engineering &amp; Design</span></div>
        <p class="cv-desc">B.Des. in Graphic Design</p>
      </div>

      <div class="cv-role">
        <div class="cv-role-header"><span class="cv-years">2012 · Netcraft Academy</span></div>
        <p class="cv-desc">UX course</p>
      </div>

      <div class="cv-role">
        <div class="cv-role-header"><span class="cv-years">2004–2005 · Tel Aviv University</span></div>
        <p class="cv-desc">Studies towards BA in Economics &amp; Philosophy</p>
      </div>

      <p class="section-label">Skills</p>
      <p class="cv-skills">Figma · Google Suite · Cursor · Claude Code · Hebrew (native) · English</p>

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
        I'm currently looking for my next role. If you're working on something interesting — developer tools, AI products, complex B2B systems — I'd love to hear about it.
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

      <p class="contact-location">Based in Tel Aviv. Open to remote and hybrid opportunities.</p>
    </div>
  </main>`);
}

function designSystemPage() {
  const swatches = [
    { hex: '#0a0a0a', name: 'Black',     usage: 'Primary text, hover fill, footer bg' },
    { hex: '#ffffff', name: 'White',     usage: 'Page background, text on dark' },
    { hex: '#ebebeb', name: 'Border',    usage: 'All hairline borders' },
    { hex: '#555555', name: 'Muted',     usage: 'Nav links, secondary text' },
    { hex: '#222222', name: 'Body',      usage: 'Body copy, CV text' },
    { hex: '#22c55e', name: 'Available', usage: 'Availability dot only' },
  ];
  const typeRows = [
    { sample: 'Open to new work.',          spec: '36px / 700 / −0.02em',  style: 'font-size:36px;font-weight:700;letter-spacing:-0.02em;color:#0a0a0a;line-height:1.15' },
    { sample: 'Design system',              spec: '32px / 700 / −0.02em',  style: 'font-size:32px;font-weight:700;letter-spacing:-0.02em;color:#0a0a0a' },
    { sample: 'Senior UX Designer',         spec: '20px / 500 / −0.01em',  style: 'font-size:20px;font-weight:500;letter-spacing:-0.01em;color:#0a0a0a' },
    { sample: 'Body large text sample.',    spec: '16px / 400 / lh 1.65',  style: 'font-size:16px;color:#222;line-height:1.65' },
    { sample: 'General body text.',         spec: '15px / 400 / lh 1.6',   style: 'font-size:15px;color:#444;line-height:1.6' },
    { sample: 'SECTION LABEL',              spec: '13px / 500 / uppercase', style: 'font-size:13px;font-weight:500;letter-spacing:0.07em;text-transform:uppercase;color:#555' },
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

  const typeHtml = typeRows.map(r =>
    `<div class="ds-type-row">
      <span style="${r.style}">${r.sample}</span>
      <span class="ds-type-spec">${r.spec}</span>
    </div>`
  ).join('\n    ');

  const spacingHtml = spacings.map(s =>
    `<div class="ds-sp-row">
      <span class="ds-sp-token">${s.token}</span>
      <div class="ds-sp-bar" style="width:${s.val}"></div>
      <span class="ds-sp-val">${s.val}</span>
      <span style="font-size:14px;color:#555">${s.usage}</span>
    </div>`
  ).join('\n    ');

  const built = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return wrap('', 'Design System — Avigail Bahat', `
  <main class="inner-main">
    <div class="inner-content ds-content">
      <h1>Design system</h1>
      <p class="page-sub">Visual language reference for avigailbahat.com</p>

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

        <div class="ds-comp-block">
          <span class="ds-comp-label">Availability badge</span>
          <div class="ds-comp-demo">
            <div class="avail-dot-wrap" style="position:static;max-height:none;opacity:1;display:inline-flex">
              <span class="avail-dot"></span>
              <span class="avail-label">Available for work</span>
            </div>
          </div>
        </div>

        <div class="ds-comp-block">
          <span class="ds-comp-label">Nav links</span>
          <div class="ds-comp-demo">
            <nav style="display:flex;gap:4px;">
              <a href="#" style="font-size:14px;color:#555;padding:5px 10px;border-radius:5px;">Home</a>
              <a href="#" style="font-size:14px;padding:5px 10px;border-radius:5px;background:#0a0a0a;color:#fff;">About (hover)</a>
              <a href="#" style="font-size:14px;color:#0a0a0a;font-weight:500;padding:5px 10px;border-radius:5px;">CV (active)</a>
            </nav>
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
            <p class="section-label" style="margin:0">Section label</p>
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

      <p class="ds-updated">Last built: ${built}</p>
    </div>
  </main>`);
}

// ── Build ────────────────────────────────────────────────────

async function build() {
  fs.mkdirSync(DIST, { recursive: true });
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  fs.mkdirSync(IMAGES, { recursive: true });
  fs.copyFileSync('style.css', path.join(DIST, 'style.css'));
  fs.copyFileSync('script.js', path.join(DIST, 'script.js'));

  console.log('Fetching project pages from Notion...');
  const raw = (await collectPages(ROOT_PAGE_ID))
    .filter(p => !SKIP_IDS.has(p.id) && !SKIP_SLUGS.has(slugify(p.title)));
  console.log(`Found ${raw.length} projects`);

  const projects = [];
  for (const p of raw) {
    const meta = await notion.pages.retrieve({ page_id: p.id });
    const icon = meta.icon?.type === 'emoji' ? meta.icon.emoji : '';
    const year = new Date(meta.created_time).getFullYear().toString();
    const summary = meta.properties?.Summary?.rich_text?.[0]?.plain_text || '';
    const contentHtml = await toHtml(p.blocks, '../');
    const title = stripEmoji(p.title);
    const slug = slugify(title);
    projects.push({ ...p, title, icon, year, slug, summary, contentHtml, excerpt: excerpt(p.blocks), callout: firstCallout(p.blocks) });
  }

  for (const proj of projects) {
    fs.writeFileSync(path.join(PROJECTS_DIR, `${proj.slug}.html`), projectPage(proj));
    stats.pages++;
    console.log(`  ✓ projects/${proj.slug}.html`);
  }

  // Fetch homepage tagline from Notion
  let tagline = "Senior UX designer. I like the problems that need a whiteboard. I've spent my career building tools - for developers, for internal teams, and for end users.";
  try {
    const hpBlocks = await notion.blocks.children.list({ block_id: HOMEPAGE_PAGE_ID });
    const firstPara = hpBlocks.results.find(b => b.type === 'paragraph');
    if (firstPara) tagline = plainText(firstPara.paragraph.rich_text) || tagline;
  } catch (e) { console.log('Could not fetch homepage tagline, using default'); }

  for (const [file, html] of [
    ['index.html',          indexPage(projects, tagline)],
    ['about.html',          aboutPage()],
    ['contact.html',        contactPage()],
    ['design-system.html',  designSystemPage()],
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

build().catch(err => { console.error(err.message); process.exit(1); });
