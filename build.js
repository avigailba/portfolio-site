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
const ROOT_PAGE_ID    = '9e31791fdedf4048bb784d0cbae06e51';
const ABOUT_PAGE_ID   = '36e35a9ccf7a81f6953dcab2aebb27fc';
const CONTACT_PAGE_ID = '36e35a9ccf7a8188a447fd3e36ee88cd';

const SKIP_IDS   = new Set([ABOUT_PAGE_ID, CONTACT_PAGE_ID]);
const SKIP_SLUGS = new Set(['about', 'contact', 'cv', 'resume']);
const DIST = 'dist';
const IMAGES = path.join(DIST, 'images');

let imgIdx = 0;
const stats = { pages: 0, images: 0, errors: [] };

// Project metadata: categories, display title overrides, years, featured status
const PROJECT_META = {
  'ai-credits':                          { title: 'AI Credits',                  cats: 'developer',              display: 'Developer tools', year: 2026, featured: true },
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
  'ai-credits',
  'app-installation-page-for-developers',
  'internal-app-review-system',
  'developer-sale',
];

// One-line summaries shown on hover in the project list
const PROJECT_SUMMARIES = {
  'ai-credits':                          'Transparent AI usage billing across Wix\'s developer platform',
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

async function toHtml(blocks) {
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
          bliHtml += await toHtml(ch);
        }
        html += `  <li>${bliHtml}</li>\n`;
        break;
      }
      case 'numbered_list_item': {
        if (!oList) { html += '<ol>\n'; oList = true; }
        let nliHtml = rt(b.numbered_list_item.rich_text);
        if (b.has_children) {
          const ch = await fetchBlocks(b.id);
          nliHtml += await toHtml(ch);
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
          return `<div class="col">${await toHtml(colBlocks)}</div>`;
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
          try {
            await dlFile(url, path.join(IMAGES, fname));
            url = `images/${fname}`;
            stats.images++;
          } catch (e) { stats.errors.push(`img-${imgIdx}: ${e.message}`); }
        }
        html += `<figure>\n  <img src="${url}" alt="${cap}" loading="lazy">\n${cap ? `  <figcaption>${cap}</figcaption>\n` : ''}</figure>\n`;
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

function renderExpTable(rows) {
  return rows.map(row => {
    const cells = row.table_row?.cells || [];
    if (!cells.length) return '';
    const role    = cells[0] ? plainText(cells[0]) : '';
    const company = cells[1] ? plainText(cells[1]) : '';
    const years   = cells[2] ? plainText(cells[2]) : '';
    if (!role) return '';
    return `<div class="exp-row">
    <span class="exp-role">${role}</span><span class="exp-company">${company}</span><span class="exp-years">${years}</span>
  </div>`;
  }).filter(Boolean).join('\n');
}

// ── Layout ──────────────────────────────────────────────────

function hdr() {
  return `<header id="site-header">
  <div class="header-inner">
    <div class="logo-wrap">
      <div class="logo-text">
        <a href="index.html" class="logo-name">Avigail Bahat</a>
        <span class="logo-role">Senior UX Designer</span>
      </div>
      <div class="avail-dot-wrap">
        <span class="avail-dot"></span>
        <span class="avail-label">Available for work</span>
      </div>
    </div>
    <nav>
      <a href="index.html">Home</a>
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
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
  <div class="footer-bottom">© 2026 Avigail Bahat · <a href="design-system.html" style="color:inherit;text-decoration:none;opacity:0.6;">Design system</a></div>
</footer>`;
}

const JS = `<script>
(function() {
  var hdr = document.getElementById('site-header');
  if (!hdr) return;
  window.addEventListener('scroll', function() {
    hdr.classList.toggle('scrolled', window.scrollY > 40);
  });
  var path = window.location.pathname;
  document.querySelectorAll('nav a').forEach(function(a) {
    var href = a.getAttribute('href') || '';
    var page = href.replace(/^\\//, '');
    if (page && path.endsWith(page)) a.classList.add('active');
    else if (!page || page === 'index.html') {
      if (path.endsWith('/') || path.endsWith('index.html')) a.classList.add('active');
    }
  });
})();

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
  if (list.getBoundingClientRect().top < window.innerHeight - 20) openAll();
})();

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

(function() {
  document.querySelectorAll('.ftag').forEach(function(tag) {
    var duration = 2.5 + Math.random() * 2;
    tag.style.animationDuration = duration + 's';
    tag.style.animationDelay = -(Math.random() * duration) + 's';
  });
})();
</script>`;

function wrap(cur, title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter/400.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter/500.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter/700.css">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  ${hdr()}
  ${body}
  ${ftr()}
  ${JS}
</body>
</html>`;
}

// ── Pages ────────────────────────────────────────────────────

function indexPage(projects) {
  const bySlug = {};
  for (const p of projects) bySlug[p.slug] = p;

  // Featured grid: 4 cards
  const featHtml = FEAT_ORDER.map((slug) => {
    const meta = PROJECT_META[slug];
    const summary = PROJECT_SUMMARIES[slug] || '';
    return `<div class="feat-card" onclick="location.href='${slug}.html'">
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
  <div class="row" data-cat="${cats}" onclick="location.href='${slug}.html'">
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
  <div class="page-wrap"><main>
    <p class="lede">Senior UX designer. 12 years at Wix building developer tools, site tools, marketplace, and AI — work I genuinely love.</p>
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
  </main></div>`);
}

function projectPage(proj) {
  const meta  = PROJECT_META[proj.slug] || {};
  const title = meta.title || proj.title;
  const year  = meta.year  || proj.year;

  const allProjectsJs = Object.entries(PROJECT_META)
    .map(([slug, m]) => `  { slug: '${slug}', title: '${m.title.replace(/'/g, "\\'")}', cat: '${m.display}', year: ${m.year}, url: '${slug}.html' }`)
    .join(',\n');

  const moreJs = `<script>
const ALL_PROJECTS = [
${allProjectsJs}
];
const CURRENT_SLUG = '${proj.slug}';
(function() {
  const others = ALL_PROJECTS.filter(p => p.slug !== CURRENT_SLUG);
  const pick = others.sort(() => Math.random() - 0.5).slice(0, 4);
  const list = document.getElementById('more-list');
  if (!list) return;
  pick.forEach((p, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'row-wrap open';
    wrap.innerHTML = '<div class="row"><span class="num">' + String(i + 1).padStart(2, '0') + '</span><div class="rmain"><span class="row-title">' + p.title + '</span></div><span class="row-cat">' + p.cat + '</span><span class="row-year">' + p.year + '</span><span class="row-arr">→</span></div>';
    wrap.addEventListener('click', () => { window.location.href = p.url; });
    list.appendChild(wrap);
  });
})();
</script>`;

  return wrap('', `${title} — Avigail Bahat`, `
  <div class="wrap"><main class="proj-wrap">
    <div class="breadcrumb"><a href="index.html">← Work</a> / ${title}</div>
    <h1 class="proj-h1">${title}</h1>
    ${proj.callout
      ? `<div class="callout"><p>${proj.callout}</p></div>`
      : proj.excerpt
        ? `<div class="callout"><p>${proj.excerpt}</p></div>`
        : ''}
    <div class="proj-body">
      <div class="proj-content">${proj.contentHtml}</div>
      <aside class="proj-aside">
        <div class="meta-row"><span class="meta-lbl">Year</span><span class="meta-val">${year}</span></div>
        <div class="meta-row"><span class="meta-lbl">Type</span><span class="meta-val">Product Design</span></div>
        <div class="meta-row"><span class="meta-lbl">Role</span><span class="meta-val">Lead Designer</span></div>
      </aside>
    </div>
    <section class="more-section">
      <p class="more-label">More work</p>
      <div id="more-list"></div>
      <div class="more-cta">
        <a href="index.html" class="more-cta-link">See all work →</a>
      </div>
    </section>
  </main></div>
  ${moreJs}`);
}

function aboutPage() {
  return wrap('about', 'About — Avigail Bahat', `
  <main class="inner-main">
    <div class="inner-content">
      <h1>About</h1>
      <p class="page-sub">Senior UX Designer · Tel Aviv</p>

      <p class="about-bio">
        I'm Avigail, a senior UX designer with 12 years at Wix building developer tools, marketplace, and AI products. I work on complex, systems-level problems — the kind where the user is a developer, the surface area is huge, and the stakes are high.
      </p>

      <p class="section-label">What I do</p>
      <p class="about-body">
        I design end-to-end: discovery, definition, detailed UI, and working closely with engineering through delivery. I've led design on platform-level projects — monetisation systems, app marketplaces, developer tooling — where the challenge is as much about the mental model as the interface.
      </p>

      <p class="section-label">Background</p>
      <p class="about-body">
        Before focusing on platform and developer products, I worked across Wix's site builder, templates, and onboarding. I've been around long enough to have seen the company grow from a few hundred people to thousands, and to have shipped products used by millions of developers worldwide.
      </p>

      <p class="section-label">Now</p>
      <p class="about-body">
        I recently left Wix after 12 years and I'm looking for my next challenge. I'm particularly drawn to AI products, complex B2B systems, and places where design can make a meaningful difference to how developers and power users work.
      </p>

      <p class="section-label">Experience</p>

      <div class="cv-role">
        <div class="cv-role-header">
          <span class="cv-title">Senior UX Designer</span>
          <span class="cv-years">2013 – 2025</span>
        </div>
        <div class="cv-company">Wix.com, Tel Aviv</div>
        <p class="cv-desc">
          Led design across developer platform, app marketplace, and monetisation systems. Owned end-to-end design for major platform features including AI billing infrastructure, app installation flows, developer payout systems, and internal tooling. Worked closely with product, engineering, and data teams across multiple squads.
        </p>
      </div>

      <p class="section-label">Selected projects</p>
      <div class="cv-projects">
        <div class="cv-proj-row"><span class="cv-proj-name">AI Credits</span><span class="cv-proj-year">2026</span></div>
        <div class="cv-proj-row"><span class="cv-proj-name">App Installation View</span><span class="cv-proj-year">2025</span></div>
        <div class="cv-proj-row"><span class="cv-proj-name">App Reviews Revamp</span><span class="cv-proj-year">2024</span></div>
        <div class="cv-proj-row"><span class="cv-proj-name">Developer Sale</span><span class="cv-proj-year">2024</span></div>
        <div class="cv-proj-row"><span class="cv-proj-name">App Collections</span><span class="cv-proj-year">2024</span></div>
        <div class="cv-proj-row"><span class="cv-proj-name">Payouts Page</span><span class="cv-proj-year">2023</span></div>
        <div class="cv-proj-row"><span class="cv-proj-name">Refund Flow</span><span class="cv-proj-year">2023</span></div>
        <div class="cv-proj-row"><span class="cv-proj-name">App Pricing Page</span><span class="cv-proj-year">2023</span></div>
        <div class="cv-proj-row"><span class="cv-proj-name">Internal App Review System</span><span class="cv-proj-year">2022</span></div>
        <div class="cv-proj-row"><span class="cv-proj-name">Submit &amp; Publish Widget</span><span class="cv-proj-year">2022</span></div>
        <div class="cv-proj-row"><span class="cv-proj-name">API Keys Page</span><span class="cv-proj-year">2022</span></div>
        <div class="cv-proj-row"><span class="cv-proj-name">Custom Element Settings</span><span class="cv-proj-year">2022</span></div>
        <div class="cv-proj-row"><span class="cv-proj-name">Development Site Creation</span><span class="cv-proj-year">2021</span></div>
        <div class="cv-proj-row"><span class="cv-proj-name">App Coupons</span><span class="cv-proj-year">2021</span></div>
      </div>

      <p class="section-label">Skills</p>
      <p class="cv-skills">
        Product design · Systems design · Design systems · UX research · Interaction design · Prototyping · Figma · Developer experience · B2B SaaS · Marketplace · AI products · Cross-functional collaboration
      </p>

      <p class="section-label">Contact</p>
      <div class="about-links">
        <a href="mailto:avigailba@gmail.com" class="about-link">avigailba@gmail.com ↗</a>
        <a href="https://www.linkedin.com/in/avigailbahat/" class="about-link">LinkedIn ↗</a>
      </div>
    </div>
  </main>`);
}


function contactPage() {
  return wrap('contact', 'Contact — Avigail Bahat', `
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
    { hex: '#767676', name: 'Muted',     usage: 'Nav links, secondary text' },
    { hex: '#999999', name: 'Subtle',    usage: 'Captions, meta' },
    { hex: '#bbbbbb', name: 'Ghost',     usage: 'Row numbers, category labels' },
    { hex: '#22c55e', name: 'Available', usage: 'Availability dot only' },
  ];
  const typeRows = [
    { sample: 'Open to new work.',          spec: '36px / 700 / −0.02em',  style: 'font-size:36px;font-weight:700;letter-spacing:-0.02em;color:#0a0a0a;line-height:1.15' },
    { sample: 'Design system',              spec: '32px / 700 / −0.02em',  style: 'font-size:32px;font-weight:700;letter-spacing:-0.02em;color:#0a0a0a' },
    { sample: 'Senior UX Designer',         spec: '20px / 500 / −0.01em',  style: 'font-size:20px;font-weight:500;letter-spacing:-0.01em;color:#0a0a0a' },
    { sample: 'Body large text sample.',    spec: '16px / 400 / lh 1.65',  style: 'font-size:16px;color:#444;line-height:1.65' },
    { sample: 'General body text.',         spec: '14px / 400 / lh 1.6',   style: 'font-size:14px;color:#444;line-height:1.6' },
    { sample: 'Project description text.',  spec: '13px / 400 / lh 1.6',   style: 'font-size:13px;color:#555;line-height:1.6' },
    { sample: 'SECTION LABEL',              spec: '11px / 500 / uppercase', style: 'font-size:11px;font-weight:500;letter-spacing:0.07em;text-transform:uppercase;color:#bbb' },
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
      <span style="font-size:11px;color:#bbb;display:block">${s.usage}</span>
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
      <span style="font-size:11px;color:#bbb">${s.usage}</span>
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
              <a href="#" class="nav-demo" style="font-size:12px;color:#767676;padding:5px 10px;border-radius:5px;">Home</a>
              <a href="#" class="nav-demo nav-demo-hovered" style="font-size:12px;padding:5px 10px;border-radius:5px;">About</a>
              <a href="#" class="nav-demo" style="font-size:12px;color:#0a0a0a;font-weight:500;padding:5px 10px;border-radius:5px;">CV (active)</a>
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
  fs.mkdirSync(IMAGES, { recursive: true });
  fs.copyFileSync('styles.css', path.join(DIST, 'styles.css'));

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
    const contentHtml = await toHtml(p.blocks);
    const title = stripEmoji(p.title);
    const slug = slugify(title);
    projects.push({ ...p, title, icon, year, slug, summary, contentHtml, excerpt: excerpt(p.blocks), callout: firstCallout(p.blocks) });
  }

  for (const proj of projects) {
    fs.writeFileSync(path.join(DIST, `${proj.slug}.html`), projectPage(proj));
    stats.pages++;
    console.log(`  ✓ ${proj.slug}.html`);
  }

  for (const [file, html] of [
    ['index.html',         indexPage(projects)],
    ['about.html',         aboutPage()],
    ['contact.html',       contactPage()],
    ['design-system.html', designSystemPage()],
  ]) {
    fs.writeFileSync(path.join(DIST, file), html);
    stats.pages++;
    console.log(`  ✓ ${file}`);
  }

  console.log(`\n✓ Done — ${stats.pages} pages, ${stats.images} images downloaded`);
  if (stats.errors.length) {
    console.log(`  ${stats.errors.length} error(s):`);
    stats.errors.forEach(e => console.log(`  - ${e}`));
  }
}

build().catch(err => { console.error(err.message); process.exit(1); });
