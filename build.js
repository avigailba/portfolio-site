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
  'ai-credits':                          { title: 'AI Credits',                  cats: 'ai cms featured',           display: 'AI',              year: 2026, featured: true },
  'app-installation-page-for-developers': { title: 'App Installation View',       cats: 'developer cms featured',    display: 'Developer tools', year: 2026, featured: true },
  'app-reviews-revamp':                  { title: 'App Reviews Revamp',           cats: 'cms',                       display: 'CMS',             year: 2025, featured: false },
  'developer-sale':                      { title: 'Developer Sale',               cats: 'monetisation cms featured', display: 'Monetisation',    year: 2024, featured: true },
  'app-collections-internal-manager':    { title: 'App Collections',              cats: 'internal cms',              display: 'Internal tools',  year: 2023, featured: false },
  'payouts-page':                        { title: 'Payouts Page',                 cats: 'monetisation cms',          display: 'Monetisation',    year: 2023, featured: false },
  'refund-flow':                         { title: 'Refund Flow',                  cats: 'monetisation',              display: 'Monetisation',    year: 2023, featured: false },
  'app-pricing-page-projects':           { title: 'App Pricing Page',             cats: 'monetisation',              display: 'Monetisation',    year: 2023, featured: false },
  'internal-app-review-system':          { title: 'Internal App Review System',   cats: 'internal featured',         display: 'Internal tools',  year: 2022, featured: true },
  'submit-publish-widget':               { title: 'Submit & Publish Widget',      cats: 'developer',                 display: 'Developer tools', year: 2022, featured: false },
  'custom-element-component-settings':   { title: 'Custom Element Settings',      cats: 'developer',                 display: 'Developer tools', year: 2022, featured: false },
  'api-keys-page':                       { title: 'API Keys Page',                cats: 'developer cms',             display: 'Developer tools', year: 2022, featured: false },
  'development-site-creation':           { title: 'Development Site Creation',    cats: 'developer',                 display: 'Developer tools', year: 2022, featured: false },
  'app-coupons':                         { title: 'App Coupons',                  cats: 'monetisation cms',          display: 'Monetisation',    year: 2021, featured: false },
};

// Featured rows shown on homepage (in order)
const FEAT_ORDER = [
  'ai-credits',
  'app-installation-page-for-developers',
  'developer-sale',
  'internal-app-review-system',
];

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

function hdr(cur) {
  const nav = [
    { id: '',        href: 'index.html',   label: 'Home' },
    { id: 'about',   href: 'about.html',   label: 'About' },
    { id: 'cv',      href: 'cv.html',      label: 'CV' },
    { id: 'contact', href: 'contact.html', label: 'Contact' },
  ];
  return `<header>
  <div class="inner">
    <div class="logo-wrap">
      <a href="index.html" class="logo-name">Avigail Bahat</a>
      <span class="logo-role">Senior UX Designer</span>
    </div>
    <nav>
      ${nav.map(l => `<a href="${l.href}"${l.id === cur ? ' class="active"' : ''}>${l.label}</a>`).join('\n      ')}
    </nav>
  </div>
</header>`;
}

function ftr() {
  return `<footer>
  <span>Avigail Bahat · Senior UX Designer</span>
  <div>
    <a href="https://www.linkedin.com/in/avigailbahat/">LinkedIn</a>
    <a href="mailto:avigailba@gmail.com">Email</a>
  </div>
</footer>`;
}

const JS = `<script>
(function() {
  const hdr = document.querySelector('header');
  window.addEventListener('scroll', () => {
    hdr.classList.toggle('scrolled', window.scrollY > 40);
  });
})();

document.querySelectorAll('.feat-row[data-href], #list .row[data-href]').forEach(row => {
  row.addEventListener('click', () => { location.href = row.dataset.href; });
});

(function() {
  const filters = document.getElementById('filters');
  if (!filters) return;
  filters.querySelectorAll('.filt').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.f;
      filters.querySelectorAll('.filt').forEach(b => {
        b.classList.remove('active');
        b.style.textDecoration = 'none';
      });
      btn.classList.add('active');
      btn.style.textDecoration = 'underline';
      document.querySelectorAll('#list .row').forEach(row => {
        const cats = (row.dataset.cat || '').split(' ');
        row.classList.toggle('hidden', f !== 'all' && !cats.includes(f));
      });
      let i = 1;
      document.querySelectorAll('#list .row:not(.hidden)').forEach(row => {
        row.querySelector('.num').textContent = String(i++).padStart(2, '0');
      });
    });
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
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="wrap">
    ${hdr(cur)}
    ${body}
    ${ftr()}
  </div>
  ${JS}
</body>
</html>`;
}

// ── Pages ────────────────────────────────────────────────────

function indexPage(projects) {
  const bySlug = {};
  for (const p of projects) bySlug[p.slug] = p;

  // Featured section: 4 projects in defined order
  const featHtml = FEAT_ORDER.map((slug, i) => {
    const meta = PROJECT_META[slug];
    const proj = bySlug[slug];
    const sub = proj?.excerpt || '';
    return `<div class="feat-row" data-href="${slug}.html">
  <span class="feat-num">${String(i + 1).padStart(2, '0')}</span>
  <div class="feat-body">
    <div class="feat-title">${meta.title}</div>
    ${sub ? `<div class="feat-sub">${sub}</div>` : ''}
    <div class="feat-meta">
      <span class="feat-cat">${meta.display}</span>
      <span class="feat-dot"> · </span>
      <span class="feat-year">${meta.year}</span>
    </div>
  </div>
  <span class="feat-arrow">→</span>
</div>`;
  }).join('\n  ');

  // Full list: sort by year desc, then by PROJECT_META insertion order
  const metaSlugs = Object.keys(PROJECT_META);
  const allSlugs = metaSlugs.filter(s => bySlug[s]);
  // Append any Notion projects not in meta
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
    const title  = meta?.title   || proj?.title   || slug;
    const cats   = meta?.cats    || '';
    const display = meta?.display || '';
    const year   = meta?.year    || proj?.year    || '';
    const featured = meta?.featured || false;
    return `<div class="row" data-cat="${cats}" data-href="${slug}.html">
  <span class="num">${String(i + 1).padStart(2, '0')}</span>
  <span class="row-title">${title}</span>
  <span class="badge-f" style="${featured ? 'color:var(--ac)' : 'visibility:hidden'}">${featured ? 'Featured' : 'Featured'}</span>
  <span class="row-cat">${display}</span>
  <span class="row-year">${year}</span>
  <span class="row-arr">→</span>
</div>`;
  }).join('\n  ');

  return wrap('', 'Avigail Bahat — Product Designer', `
  <main>
    <p class="lede">Senior UX designer. 12 years at Wix building <span class="lede-ac">developer tools</span>, marketplace, and AI.</p>
    <section class="feat-section">
      ${featHtml}
    </section>
    <div id="filters">
      <button data-f="all"          class="filt active" style="color:var(--ac)">All</button>
      <button data-f="developer"    class="filt"        style="color:var(--ac)">Developer tools</button>
      <button data-f="monetisation" class="filt"        style="color:var(--ac)">Monetisation</button>
      <button data-f="internal"     class="filt"        style="color:var(--ac)">Internal tools</button>
      <button data-f="cms"          class="filt"        style="color:var(--ac)">CMS</button>
    </div>
    <div id="list">
      ${listHtml}
    </div>
  </main>`);
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
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = '<span class="num">' + String(i + 1).padStart(2, '0') + '</span><span class="row-title">' + p.title + '</span><span class="row-cat">' + p.cat + '</span><span class="row-year">' + p.year + '</span><span class="row-arr">→</span>';
    row.addEventListener('click', () => { window.location.href = p.url; });
    list.appendChild(row);
  });
})();
</script>`;

  return wrap('', `${title} — Avigail Bahat`, `
  <main class="proj-wrap">
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
  </main>
  ${moreJs}`);
}

function aboutPage() {
  return wrap('about', 'About — Avigail Bahat', `
  <main class="about-wrap">
    <p class="about-lede">Senior UX designer. 12 years building products at Wix — developer tools, marketplace, media, and AI.</p>
    <p class="about-body">I spent over a decade at Wix moving through its core product teams — ADI, media, the App Market and developer ecosystem, and OS-level work in my final stretch. My focus for most of that time was the App Market: how developers publish, monetise, and grow their apps, and how users find and install them.</p>
    <p class="about-body">Now looking for what's next — ideally somewhere where design is close to engineering and the problems are genuinely complex.</p>

    <p class="section-label">Experience</p>
    <div class="exp-list">
      <div class="exp-row"><span class="exp-yr">2014–2026</span><div><div class="exp-role">UX Designer → Senior UX Designer</div><div class="exp-co">Wix.com</div><div class="exp-detail">OS · App Market · Labs · Media · ADI</div></div></div>
      <div class="exp-row"><span class="exp-yr">2012–2013</span><div><div class="exp-role">Marketing Designer &amp; Lead</div><div class="exp-co">Wix.com</div></div></div>
      <div class="exp-row"><span class="exp-yr">2010–2012</span><div><div class="exp-role">Graphic Designer</div><div class="exp-co">McCann Erickson Israel</div></div></div>
      <div class="exp-row"><span class="exp-yr">2008–2010</span><div><div class="exp-role">Graphics Department</div><div class="exp-co">Walla.co.il</div></div></div>
    </div>

    <div class="about-grid">
      <div>
        <p class="section-label">Education</p>
        <p>Shenkar College — B.Des Graphic Design <span class="muted">2006–2010</span><br>Netcraft Academy — UX <span class="muted">2012</span></p>
      </div>
      <div>
        <p class="section-label">Tools</p>
        <p>Figma · Google Suite<br>Cursor · Claude Code<br>Hebrew · English</p>
      </div>
      <div>
        <p class="section-label">Get in touch</p>
        <p><a href="mailto:avigailba@gmail.com">avigailba@gmail.com</a><br><a href="https://www.linkedin.com/in/avigailbahat/">LinkedIn →</a></p>
      </div>
      <div>
        <p class="section-label">Based in</p>
        <p>Tel Aviv, Israel</p>
      </div>
    </div>
  </main>`);
}

function cvPage() {
  return wrap('cv', 'CV — Avigail Bahat', `
  <main class="cv-wrap">
    <h1>Avigail Bahat</h1>
    <p class="cv-sub">Senior UX Designer · Tel Aviv, Israel · <a href="mailto:avigailba@gmail.com">avigailba@gmail.com</a> · <a href="https://www.linkedin.com/in/avigailbahat/">LinkedIn</a></p>

    <p class="section-label">Experience</p>
    <div class="exp-list">
      <div class="exp-row"><span class="exp-yr">2014–2026</span><div><div class="exp-role">UX Designer → Senior UX Designer</div><div class="exp-co">Wix.com</div><div class="exp-detail">OS · App Market · Labs · Media · ADI</div></div></div>
      <div class="exp-row"><span class="exp-yr">2012–2013</span><div><div class="exp-role">Marketing Designer &amp; Lead</div><div class="exp-co">Wix.com</div></div></div>
      <div class="exp-row"><span class="exp-yr">2010–2012</span><div><div class="exp-role">Graphic Designer</div><div class="exp-co">McCann Erickson Israel</div></div></div>
      <div class="exp-row"><span class="exp-yr">2008–2010</span><div><div class="exp-role">Graphics Department</div><div class="exp-co">Walla.co.il</div></div></div>
    </div>

    <p class="section-label">Education</p>
    <div class="exp-list">
      <div class="exp-row"><span class="exp-yr">2006–2010</span><div><div class="exp-role">B.Des Graphic Design</div><div class="exp-co">Shenkar College</div></div></div>
      <div class="exp-row"><span class="exp-yr">2012</span><div><div class="exp-role">UX Certificate</div><div class="exp-co">Netcraft Academy</div></div></div>
    </div>

    <p class="section-label">Skills</p>
    <div class="exp-list">
      <div class="exp-row"><span class="exp-yr">Design</span><div><div class="exp-co">Figma, UX research, interaction design, design systems, prototyping</div></div></div>
      <div class="exp-row"><span class="exp-yr">Tools</span><div><div class="exp-co">Figma · Google Suite · Cursor · Claude Code</div></div></div>
      <div class="exp-row"><span class="exp-yr">Languages</span><div><div class="exp-co">Hebrew (native) · English (fluent)</div></div></div>
    </div>
  </main>`);
}

async function contactPage(blocks) {
  await hydrateTables(blocks);

  let heading = "Let's talk";
  let tagline = '';
  let contactRowsHtml = '';
  let recruiterNote = '';
  let inRecruiter = false;

  for (const b of blocks) {
    if (b.type === 'heading_2') {
      const txt = plainText(b.heading_2.rich_text);
      if (/let.?s talk/i.test(txt)) heading = txt;
      else if (/recruit|note/i.test(txt)) inRecruiter = true;
    } else if (b.type === 'paragraph' && b.paragraph.rich_text.length) {
      const text = rt(b.paragraph.rich_text);
      if (inRecruiter && !recruiterNote) recruiterNote = text;
      else if (!tagline && !inRecruiter) tagline = text;
    } else if (b.type === 'table' && b._rows) {
      contactRowsHtml = b._rows.map(row => {
        const cells = row.table_row.cells;
        const lbl = cells[0]?.map(t => t.plain_text).join('').trim() || '';
        const valRt = cells[1] || [];
        const valPlain = valRt.map(t => t.plain_text).join('').trim();
        const ll = lbl.toLowerCase();
        let valHtml;
        if (ll.includes('email') || valPlain.includes('@')) {
          valHtml = `<div class="contact-val">
            <a href="mailto:${valPlain}">${valPlain}</a>
            <button class="copy-btn" onclick="navigator.clipboard.writeText('${valPlain}')" title="Copy">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button></div>`;
        } else if (ll.includes('linkedin') || valPlain.includes('linkedin')) {
          const url = valPlain.startsWith('http') ? valPlain : `https://${valPlain}`;
          const display = valPlain.replace(/^https?:\/\//, '');
          valHtml = `<div class="contact-val">
            <a href="${url}" target="_blank" rel="noopener">${display}</a>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </div>`;
        } else {
          valHtml = `<span>${rt(valRt) || valPlain}</span>`;
        }
        return `<div class="contact-row"><span class="contact-lbl">${lbl}</span>${valHtml}</div>`;
      }).join('\n');
    }
  }

  return wrap('contact', 'Contact — Avigail Bahat', `
  <main class="contact-wrap">
    <h1>${heading}</h1>
    ${tagline ? `<p class="body-large">${tagline}</p>` : ''}
    <div class="avail-badge"><span class="avail-dot"></span>Available for new roles</div>
    ${contactRowsHtml ? `<div class="contact-rows">${contactRowsHtml}</div>` : ''}
    ${recruiterNote ? `<div class="contact-note"><p>${recruiterNote}</p></div>` : ''}
  </main>`);
}

function designSystemPage() {
  const swatches = [
    { hex: '#0a0a0a', name: 'Primary text',   usage: 'Headings, titles, body' },
    { hex: '#767676', name: 'Secondary text',  usage: 'Descriptions, meta, labels' },
    { hex: 'var(--ac)', name: 'Accent',        usage: 'Numbers, hover, callout border' },
    { hex: '#ebebeb', name: 'Border',          usage: 'Dividers, row borders' },
    { hex: '#f8f8f8', name: 'Background alt',  usage: 'Callouts, hover state' },
  ];

  const typeRows = [
    { name: 'Featured title', style: 'font-size:46px;font-weight:500;letter-spacing:-0.02em;line-height:1.0;color:#0a0a0a', spec: '46px · 500 · −0.02em' },
    { name: 'Project h1',     style: 'font-size:40px;font-weight:500;letter-spacing:-0.02em;color:#0a0a0a',                  spec: '40px · 500 · −0.02em' },
    { name: 'About lede',     style: 'font-size:22px;font-weight:500;letter-spacing:-0.01em;color:#0a0a0a',                  spec: '22px · 500 · −0.01em' },
    { name: 'Row title',      style: 'font-size:14px;font-weight:500;color:#0a0a0a',                                          spec: '14px · 500' },
    { name: 'Body',           style: 'font-size:15px;font-weight:400;color:#555;line-height:1.7',                             spec: '15px · 400 · lh 1.7' },
    { name: 'Nav / meta',     style: 'font-size:13px;font-weight:400;color:#767676',                                          spec: '13px · 400' },
    { name: 'Label',          style: 'font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;color:#bbb', spec: '12px · 500 · uppercase · min size' },
  ];

  const swatchHtml = swatches.map(({ hex, name, usage }) =>
    `<div class="ds-swatch">
      <div style="height:48px;background:${hex};border-radius:6px;border:0.5px solid #ebebeb;margin-bottom:10px"></div>
      <span style="font-size:13px;font-weight:500;color:#0a0a0a;display:block;margin-bottom:2px">${hex}</span>
      <span style="font-size:12px;color:#767676;display:block">${name}</span>
      <span style="font-size:12px;color:#bbb;display:block">${usage}</span>
    </div>`
  ).join('\n    ');

  const typeHtml = typeRows.map(({ name, style, spec }) =>
    `<div class="ds-type-row">
      <span style="${style}">${name}</span>
      <span style="font-size:12px;color:#767676;flex-shrink:0">${spec}</span>
    </div>`
  ).join('\n    ');

  return wrap('', 'Design System — Avigail Bahat', `
  <main class="ds-main">
    <h1 style="font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:6px">Design System</h1>
    <p style="font-size:13px;color:#767676;margin-bottom:56px">Tokens, typography, spacing, and components.</p>

    <div class="ds-section">
      <h2>Colors</h2>
      <div class="ds-swatch-row">${swatchHtml}</div>
    </div>

    <div class="ds-section">
      <h2>Typography</h2>
      ${typeHtml}
    </div>

    <div class="ds-section">
      <h2>Accent slider</h2>
      <p style="font-size:13px;color:#767676;line-height:1.6">The accent color is controlled by the hue slider in the header. It defaults to <code>hsl(156,65%,40%)</code> (teal) and is stored in <code>localStorage</code> between visits. Use <code>var(--ac)</code> everywhere.</p>
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
    const contentHtml = await toHtml(p.blocks);
    const title = stripEmoji(p.title);
    const slug = slugify(title);
    projects.push({ ...p, title, icon, year, slug, contentHtml, excerpt: excerpt(p.blocks), callout: firstCallout(p.blocks) });
  }

  for (const proj of projects) {
    fs.writeFileSync(path.join(DIST, `${proj.slug}.html`), projectPage(proj));
    stats.pages++;
    console.log(`  ✓ ${proj.slug}.html`);
  }

  console.log('Fetching contact page from Notion...');
  const contactBlocks = await fetchBlocks(CONTACT_PAGE_ID);

  for (const [file, html] of [
    ['index.html',         indexPage(projects)],
    ['about.html',         aboutPage()],
    ['cv.html',            cvPage()],
    ['contact.html',       await contactPage(contactBlocks)],
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
