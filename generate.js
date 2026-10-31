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
const STRICT_BUILD = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true' || process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
if (!process.env.NOTION_API_KEY) {
  console.warn('NOTION_API_KEY is not set, building a local static fallback');
} else {
  console.log('Notion credentials found');
}
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

function assetVersion(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, file))).digest('hex').slice(0, 10);
}

const STYLE_VERSION = assetVersion('style.css');
const SCRIPT_VERSION = assetVersion('script.js');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const ROOT_PAGE_ID      = '9e31791fdedf4048bb784d0cbae06e51';
const ABOUT_PAGE_ID     = '36e35a9ccf7a81f6953dcab2aebb27fc';
const CV_EXPORT_URL     = 'https://docs.google.com/document/d/1k96v_RDnLF1MwT3K43FXrcU0St67WObuXRArSz6AqSw/export?format=pdf';
const CONTACT_PAGE_ID   = '36e35a9ccf7a8188a447fd3e36ee88cd';
const HOMEPAGE_PAGE_ID  = '37135a9ccf7a81b2a7a7c0a2702d8c98';

const SKIP_IDS   = new Set([ABOUT_PAGE_ID, CONTACT_PAGE_ID, HOMEPAGE_PAGE_ID]);
const SKIP_SLUGS = new Set(['about', 'contact', 'about-contact', 'cv', 'resume', 'homepage', 'development-site-creation', 'tooltip-glossary', 'custom-element-component-settings']);

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

const stats = { pages: 0, images: 0, errors: [] };

// Project metadata: categories, display title overrides, years, featured status
const PROJECT_META = {
  'ai-credits-wallet':                    { title: 'AI Credits Wallet',        subtitle: 'Transparent AI usage billing across Wix\'s developer platform', cats: 'monetisation',          display: 'Monetisation',    year: 2026, featured: true },
  'app-installation-page-for-developers': { title: 'Installations Page',      subtitle: 'Designed and shipped installation analytics that gave developers site-level visibility into how their apps were used', cats: 'developer cms',         display: 'Developer tools', year: 2025, featured: true },
  'internal-app-review-system':          { title: 'App Review Platform',   subtitle: 'Replaced a spreadsheet-based review process with a structured tool', cats: 'internal cms',       display: 'Internal tools',  year: 2022, featured: true },
  'developer-sale':                      { title: 'Developer Sale',           subtitle: 'A monetisation campaign tool for app developers',                cats: 'developer monetisation cms', display: 'Monetisation', year: 2024, featured: false },
  'app-reviews-revamp':                  { title: 'App Reviews Revamp',           cats: 'developer cms',          display: 'Developer tools', year: 2024, featured: false },
  'app-collections-internal-manager':    { title: 'App Collections Manager',      cats: 'internal cms',           display: 'Internal tools',  year: 2024, featured: false },
  'payouts-page':                        { title: 'Payouts Page',                 cats: 'monetisation cms',       display: 'Monetisation',    year: 2023, featured: false },
  'refund-flow':                         { title: 'Refund Flow',                  cats: 'monetisation',           display: 'Monetisation',    year: 2023, featured: false },
  'app-pricing-page-projects':           { title: 'App Pricing Page Projects',    cats: 'developer monetisation', display: 'Monetisation',    year: 2023, featured: false },
  'submit-publish-widget':               { title: 'Submit & Publish Widget',      cats: 'developer',              display: 'Developer tools', year: 2022, featured: false },
  'api-keys-page':                       { title: 'API Keys Page',                cats: 'developer cms',          display: 'Developer tools', year: 2022, featured: false },
  'app-coupons':                         { title: 'App Coupons',                  cats: 'monetisation cms',       display: 'Monetisation',    year: 2021, featured: false },
  'development-site-creation':           { title: 'Development Site Creation',    cats: 'developer',              display: 'Developer tools', year: 2021, featured: false },
};

// Featured rows shown on homepage (in order)
const FEAT_ORDER = [
  'internal-app-review-system',
  'ai-credits-wallet',
  'app-installation-page-for-developers',
];


function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function stripEmoji(s) {
  return s.replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/gu, '').trim();
}

function titleCase(s) {
  return s.replace(/\b([a-z])([a-z]*)/gi, (word, first, rest) => first.toUpperCase() + rest);
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
      if (t.href) {
        // Rewrite Notion internal page links (/p/<id> or notion.so URLs) to local project URLs
        let href = t.href;
        const notionIdMatch = href.match(/(?:\/p\/|notion\.so\/(?:[^/]+-)?|notion\.so\/)([a-f0-9]{32})/);
        if (notionIdMatch) {
          const rawId = notionIdMatch[1].replace(/-/g, '');
          const slug = NOTION_ID_TO_SLUG[rawId];
          href = slug ? `${slug}.html` : href;
        }
        const isExternal = href.startsWith('http') || href.startsWith('mailto');
        s = `<a href="${escapeAttr(href)}"${isExternal ? ' target="_blank" rel="noopener"' : ''}>${s}</a>`;
      }
      return s;
    }).join('');
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
      case 'heading_2': {
        html += `<h2>${rt(b.heading_2.rich_text)}</h2>\n`;
        if (b.has_children) { const ch = await fetchBlocks(b.id); html += await toHtml(ch, imgPrefix); }
        break;
      }
      case 'heading_3': {
        html += `<h3>${rt(b.heading_3.rich_text)}</h3>\n`;
        if (b.has_children) { const ch = await fetchBlocks(b.id); html += await toHtml(ch, imgPrefix); }
        break;
      }
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
        // Callout text is surfaced as inline tooltips via injectTooltips() — not rendered as a block
        break;
      }
      case 'column_list': {
        const cols = await fetchBlocks(b.id);
        const colInner = await Promise.all(cols.map(async col => {
          const colBlocks = await fetchBlocks(col.id);
          return await toHtml(colBlocks, imgPrefix);
        }));
        // A column holding "Design principles" cards: the cards leave the columns and run full width underneath
        let rulesHtml = '';
        const kept = colInner.map(inner => {
          const r = splitRules(inner);
          if (!r) return inner;
          rulesHtml = r.cards;
          return r.before + r.after;
        }).filter(inner => !rulesHtml || inner.trim());
        if (rulesHtml && kept.length === 1) {
          html += kept[0] + rulesHtml;
        } else {
          html += `<div class="col-layout col-${kept.length}">${kept.map(c => `<div class="col">${c}</div>`).join('')}</div>\n${rulesHtml}`;
        }
        break;
      }
      case 'divider': html += '<hr>\n'; break;
      case 'image': {
        let url = b.image.type === 'external' ? b.image.external.url : b.image.file.url;
        const caption = b.image.caption || [];
        const capHtml = caption.length ? rt(caption) : '';
        const capText = caption.length ? plainText(caption).trim() : '';
        if (url.includes('amazonaws.com') || url.includes('prod-files-secure')) {
          const blockId = b.id.replace(/-/g, '');
          const fname = `img-${blockId}.jpg`;
          const dest = path.join(IMAGES, fname);
          if (fs.existsSync(dest)) {
            url = `${imgPrefix}images/${fname}`;
            stats.cached = (stats.cached || 0) + 1;
          } else {
            try {
              await dlFile(url, dest);
              url = `${imgPrefix}images/${fname}`;
              stats.images++;
            } catch (e) { stats.errors.push(`${fname}: ${e.message}`); }
          }
        }
        html += `<figure class="proj-img">\n  <img src="${escapeAttr(url)}" alt="${escapeAttr(capText)}" loading="lazy">\n${capHtml ? `  <figcaption class="proj-caption">${capHtml}</figcaption>\n` : ''}</figure>\n`;
        break;
      }
    }
  }
  if (uList) html += '</ul>\n';
  if (oList) html += '</ol>\n';
  return html;
}

function isDateString(s) {
  const t = s.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ||
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i.test(t);
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
  return c.callout.rich_text.map(t => t.plain_text).join('');
}

// Term-level tooltips: each key term gets its own explanatory popup
const TERM_TIPS = {
  'Wix App Market':   'Wix App Market is a marketplace where third-party developers publish apps for Wix site owners. Developers manage their apps through the Wix Developer Center, a dashboard covering submissions, reviews, payouts, and analytics.',
  'Business Manager': 'Business Manager is the dashboard where Wix business owners manage their site and services.',
  'Wix Blocks':       'Wix Blocks was a visual development platform for building Wix apps, now retired.',
  'Wixel':            "Wixel is Wix's AI-native product for creating and managing digital presence.",
  'Wix':              'Wix is a website builder and development platform used by millions of businesses and creators worldwide.',
};

function injectTooltips(html) {
  // Process all text content up to the first image block (excludes captions/image HTML)
  const stopRe = /<figcaption class="proj-caption"|<figure class="proj-img"|<div class="col-layout/;
  const stopIdx = html.search(stopRe);
  const intro = stopIdx >= 0 ? html.slice(0, stopIdx) : html;
  const rest  = stopIdx >= 0 ? html.slice(stopIdx) : '';

  // Longest terms first so "Wix App Market" matches before "Wix"
  const terms   = Object.keys(TERM_TIPS).sort((a, b) => b.length - a.length);
  const pattern = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  // Skip tags and attributes; only visible text can receive tooltip markup.
  const re      = new RegExp(`<[^>]*>|\\b(${pattern})\\b`, 'g');

  const seen = new Set();
  let tipIndex = 0;
  const processed = intro.replace(re, (match) => {
    if (match.startsWith('<')) return match;
    if (seen.has(match)) return match; // only first occurrence of each term
    seen.add(match);
    const tipText = TERM_TIPS[match];
    const tipId = `term-tip-${++tipIndex}`;
    return `<span class="ctx-tip" role="button" tabindex="0" data-tip="${escapeAttr(tipText)}" aria-label="${escapeAttr(match)}" aria-describedby="${tipId}" aria-expanded="false">${match}<span class="ctx-tip-pop" id="${tipId}" role="tooltip" hidden>${escapeAttr(tipText)}</span></span>`;
  });

  return processed + rest;
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

// Hand-edited presentation decks (not generated): project slug -> deck file in dist/projects/. Also listed in KEEP_PROJECT_FILES.
const PROJECT_DECKS = {
  // Presentation button switched off for now: add the next line back to show it.
  // 'internal-app-review-system': 'internal-review-demo.html',
  // Installations deck is built (installations-demo.html) but switched off for now: add the next line back to show the button.
  // 'app-installation-page-for-developers': 'installations-demo.html',
};

// prefix: '' for root pages, '../' for project pages in dist/projects/
function hdr(prefix, current = '') {
  const cur = (name) => current === name ? ' aria-current="page"' : '';
  return `<header id="site-header">
  <div class="hdr-row">
    <a href="${prefix}index.html" class="mob-logo">
      <span class="mob-logo-name">Avigail Bahat</span>
      <span class="mob-logo-role">Senior Product Designer</span>
    </a>
    <nav>
      <a href="${prefix}index.html"${cur('projects')}>Projects</a>
      <a href="${prefix}about.html"${cur('about')}>About & Contact</a>
    </nav>
    <button class="mob-burger" id="open-menu" aria-label="Open menu" aria-controls="mob-panel" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>
<div class="mob-scrim" id="mob-scrim" aria-hidden="true"></div>
<aside class="mob-panel" id="mob-panel" aria-hidden="true" inert>
  <div class="mob-panel-top">
    <span class="mob-panel-title">Avigail Bahat</span>
    <button class="mob-panel-close" id="mob-panel-close" aria-label="Close">✕</button>
  </div>
  <nav class="mob-panel-nav">
    <a href="${prefix}index.html" class="mob-panel-link"${cur('projects')}>Projects</a>
    <a href="${prefix}about.html" class="mob-panel-link"${cur('about')}>About & Contact</a>
  </nav>
  <div class="mob-panel-foot">
    <div class="mob-panel-social">
      <a href="mailto:avigailba@gmail.com"><span>avigailba@gmail.com</span><span class="mob-arr" aria-hidden="true">↗</span></a>
      <a href="https://www.linkedin.com/in/avigailbahat/" target="_blank" rel="noreferrer"><span>LinkedIn</span><span class="mob-arr" aria-hidden="true">↗</span></a>
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
        <span>avigailba@gmail.com</span><span class="footer-arr" aria-hidden="true">↗</span>
      </a>
      <a href="https://www.linkedin.com/in/avigailbahat/" class="footer-link">
        <span>LinkedIn</span><span class="footer-arr" aria-hidden="true">↗</span>
      </a>
      <a href="${prefix}design-system.html" class="footer-link">
        <span>Design system</span><span class="footer-arr" aria-hidden="true">↗</span>
      </a>
    </div>
  </div>
  <div class="footer-bottom">© 2026 Avigail Bahat. Built using Notion &amp; Claude.</div>
</footer>`;
}

// prefix: '' for root pages, '../' for project pages
function wrap(prefix, title, body, extraScript = '', extraHead = '', bodyClass = '', current = '') {
  const analyticsScript = process.env.VERCEL === '1'
    ? '\n<script defer src="/_vercel/insights/script.js"></script>'
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Roboto:wght@300;400;500;700&display=swap">
  <link rel="icon" type="image/png" sizes="32x32" href="${prefix}favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="${prefix}favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="${prefix}apple-touch-icon.png">
  ${extraHead}<link rel="stylesheet" href="${prefix}style.css?v=${STYLE_VERSION}">
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
  ${hdr(prefix, current)}
  ${body}
  ${ftr(prefix)}
  <script src="${prefix}script.js?v=${SCRIPT_VERSION}"></script>
${extraScript}${analyticsScript}
</body>
</html>`;
}

// ── Pages ────────────────────────────────────────────────────

function homeAboutSnippet(homepageBlocks, aboutBlocks) {
  const start = homepageBlocks.findIndex(block => block.type === 'heading_2' && plainText(block.heading_2.rich_text).trim().toLowerCase() === 'about me');
  if (start < 0) return '';
  const end = homepageBlocks.findIndex((block, i) => i > start && block.type === 'heading_2');
  const section = homepageBlocks.slice(start + 1, end < 0 ? undefined : end);
  const summary = aboutBlocks.find(block => block.type === 'paragraph' && plainText(block.paragraph.rich_text).trim());
  const contact = section.find(block => block.type === 'paragraph' && block.paragraph.rich_text.some(item => item.href));
  const facts = section.filter(block => block.type === 'bulleted_list_item');
  if (!summary || !contact || facts.length !== 3) {
    throw new Error('Homepage About me needs an About-page summary, a contact link and three facts in Notion');
  }
  function localLink(richText) {
    const href = richText.find(item => item.href)?.href || '';
    const id = href.replace(/-/g, '').match(/[a-f0-9]{32}/)?.[0];
    if (id === ABOUT_PAGE_ID) return 'about.html';
    if (id && NOTION_ID_TO_SLUG[id]) return `projects/${NOTION_ID_TO_SLUG[id]}.html`;
    return '';
  }
  const factHtml = facts.map(block => {
    const rich = block.bulleted_list_item.rich_text;
    const text = plainText(rich);
    const separator = text.indexOf(':');
    if (separator < 0) throw new Error('Homepage About me facts must use Label: value in Notion');
    const label = escapeAttr(text.slice(0, separator).trim());
    const value = escapeAttr(text.slice(separator + 1).trim());
    const href = localLink(rich);
    return `<div class="home-about-fact"><dt>${label}</dt><dd>${href ? `<a href="${href}">${value}</a>` : value}</dd></div>`;
  }).join('');
  const contactText = plainText(contact.paragraph.rich_text).trim();
  const contactArrow = contactText.match(/[↗→←]$/)?.[0] || '';
  const contactLabel = contactArrow ? contactText.slice(0, -1).trim() : contactText;
  return `<section class="home-about" aria-labelledby="home-about-title">
    <div class="home-about-copy">
      <h2 id="home-about-title">${escapeAttr(plainText(homepageBlocks[start].heading_2.rich_text))}</h2>
      <p>${escapeAttr(plainText(summary.paragraph.rich_text))}</p>
      <a class="home-about-link" href="${localLink(contact.paragraph.rich_text)}"><span class="link-label">${escapeAttr(contactLabel)}</span> ${escapeAttr(contactArrow)}</a>
    </div>
    <dl class="home-about-facts">${factHtml}</dl>
  </section>`;
}

function indexPage(projects, tagline, homepageBlocks = [], aboutBlocks = []) {
  tagline = tagline || "Senior UX designer. I like the problems that need a whiteboard. I've spent my career building tools - for developers, for internal teams, and for end users.";
  const bySlug = {};
  for (const p of projects) bySlug[p.slug] = p;

  // Featured projects are the big rows at the top of the list (see row-feat below)

  // Full list: Notion insertion order (PROJECT_META key order)
  const metaSlugs = Object.keys(PROJECT_META);
  // When Notion is unavailable projects is empty — fall back to all known slugs
  const allSlugs = projects.length > 0
    ? metaSlugs.filter(s => bySlug[s] && !SKIP_SLUGS.has(s))
    : metaSlugs.filter(s => !SKIP_SLUGS.has(s));
  for (const p of projects) {
    if (!PROJECT_META[p.slug] && !allSlugs.includes(p.slug)) allSlugs.push(p.slug);
  }
  allSlugs.sort((a, b) => metaSlugs.indexOf(a) - metaSlugs.indexOf(b));

  const listHtml = allSlugs.map((slug, i) => {
    const meta = PROJECT_META[slug];
    const proj = bySlug[slug];
    const title   = proj?.title   || meta?.title   || slug;
    const cats    = meta?.cats    || '';
    const catLabels = { developer: 'Developer tools', monetisation: 'Monetisation', internal: 'Internal tools', cms: 'CMS' };
    const badges = cats.split(/\s+/).filter(Boolean).map(cat => catLabels[cat] || cat);
    const year    = meta?.year    || proj?.year    || '';
    const summary = proj?.subtitle || proj?.summary || '';
    const featured = meta?.featured || false;
    const featCls = featured ? ' row-feat' : '';
    return `<div class="row-wrap${featCls}" data-cat="${cats}">
  <a href="projects/${slug}.html" class="row${featCls}" data-cat="${cats}">
    <span class="num">${String(i + 1).padStart(2, '0')}</span>
    <div class="rmain">
      <span class="row-title">${title}</span>
      ${summary ? `<span class="rsub">${summary}</span>` : ''}
    </div>
    ${badges.length ? `<span class="cat-tags">${badges.map(label => `<span class="cat-tag">${label}</span>`).join('')}</span>` : ''}
    <span class="row-arr"><span class="link-label">View</span> ↗</span>
    <div class="mob-row-foot"><span class="mob-view-btn mob-view-sm"><span class="link-label">View</span> ↗</span></div>
  </a>
</div>`;
  }).join('\n  ');

  return wrap('', 'Avigail Bahat | Senior Product Designer', `
  <main class="home-band">
    <p class="lede">${tagline}</p>
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
    ${homeAboutSnippet(homepageBlocks, aboutBlocks)}
  </main>`);
}

// Design principles as numbered cards (the layout from her Intuit deck).
// Notion shape: an "h3 Design principles", an optional bridge line, then a list whose items read
// "**Title** sentence | Tag" (the tag after " | " is optional). The cards run full width, so a
// two-column "Research | Design principles" block is split: Research stays, the cards go under it.
function splitRules(html) {
  const hm = /<h3>\s*(?:<strong>)?\s*Design principles\s*(?:<\/strong>)?\s*<\/h3>\s*/i.exec(html);
  if (!hm) return null;
  const afterH = hm.index + hm[0].length;
  const lm = /<(ul|ol)>([\s\S]*?)<\/\1>\n?/.exec(html.slice(afterH));
  if (!lm) return null;
  const between = html.slice(afterH, afterH + lm.index);
  if (/<h[23]|<figure|<div/.test(between)) return null;
  const items = [...lm[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1].trim()).filter(Boolean);
  if (!items.length) return null;
  const cards = items.map((raw, i) => {
    let it = raw, tag = '';
    const parts = it.split(/\s+\|\s+/);
    if (parts.length > 1) { tag = parts.pop().replace(/<[^>]+>/g, '').trim(); it = parts.join(' | '); }
    let title, text;
    const sm = /^\s*<strong>([\s\S]*?)<\/strong>\s*([\s\S]*)$/.exec(it);
    if (sm) { title = sm[1]; text = sm[2]; }
    else { const dm = /^([^.]+?)\.\s+([\s\S]*)$/.exec(it); title = dm ? dm[1] : it; text = dm ? dm[2] : ''; }
    title = title.replace(/[.:]\s*$/, '').trim();
    return `<div class="pr-card"><span class="pr-num">${String(i + 1).padStart(2, '0')}</span><p class="pr-title">${title}</p><p class="pr-text">${text.trim()}</p>${tag ? `<span class="pr-tag">${tag}</span>` : ''}</div>`;
  }).join('');
  const cardsHtml = `<h3>Design principles</h3>\n${between.trim() ? between : ''}<div class="proj-rules" data-cols="${items.length}">${cards}</div>\n`;
  return { before: html.slice(0, hm.index), after: html.slice(afterH + lm.index + lm[0].length), cards: cardsHtml };
}

// Results as a lead sentence plus labelled rows (the layout from her Intuit deck).
// Notion shape under "Results" or "Impact": a lead paragraph, then a list whose items read "**Label** sentence",
// optional italic list items as quotes, and the next steps either as an "h3 Next steps" inside the section or
// as the "h2 Next steps" right after it. The next steps become the last row.
// Screen-plus-explanation layouts (the deck's design slides). A two-column block whose first column is an image and whose second
// column starts with a bullet list becomes `proj-shot` (image 2/3, text 1/3, an optional "### The principle in action" block under the bullets).
// A two-column block whose columns are each an image followed by a bullet list becomes `proj-shot2` (two screens, text under each).
function markShotLayouts(html) {
  return html.replace(/<div class="col-layout col-2"><div class="col">([\s\S]*?)<\/div><div class="col">([\s\S]*?)<\/div><\/div>/g, (m, a, b) => {
    const A = a.trim(), B = b.trim();
    const imgThenList = /^<figure[\s\S]*?<\/figure>\s*<ul>/;
    let cls = '';
    if (/^<figure/.test(A) && /^<ul>/.test(B)) cls = 'proj-shot';
    else if (imgThenList.test(A) && imgThenList.test(B)) cls = 'proj-shot2';
    return cls ? `<div class="col-layout col-2 ${cls}"><div class="col">${a}</div><div class="col">${b}</div></div>` : m;
  });
}

// Product areas as a grid of cards (the deck's "four product areas" slide). In Notion: an "h3 Product areas" followed by a list whose
// items read "**Title** what it is | the bold line saying what it fixes". The heading itself is dropped (the section title says it).
function buildAreaCards(html) {
  const hm = /<h3>\s*(?:<strong>)?\s*Product areas\s*(?:<\/strong>)?\s*<\/h3>\s*/i.exec(html);
  if (!hm) return html;
  const afterH = hm.index + hm[0].length;
  const lm = /<(ul|ol)>([\s\S]*?)<\/\1>\n?/.exec(html.slice(afterH));
  if (!lm || lm.index > 0) return html;
  const items = [...lm[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1].trim()).filter(Boolean);
  if (!items.length) return html;
  const cards = items.map(raw => {
    let it = raw, fix = '';
    const parts = it.split(/\s+\|\s+/);
    if (parts.length > 1) { fix = parts.pop().trim(); it = parts.join(' | '); }
    const sm = /^\s*<strong>([\s\S]*?)<\/strong>\s*([\s\S]*)$/.exec(it);
    const title = sm ? sm[1].replace(/[.:]\s*$/, '').trim() : it;
    const text = sm ? sm[2].trim() : '';
    return `<div class="pa-card"><p class="pa-title">${title}</p><p class="pa-text">${text}</p>${fix ? `<p class="pa-fix">${fix}</p>` : ''}</div>`;
  }).join('');
  return html.slice(0, hm.index) + `<div class="proj-areas">${cards}</div>\n` + html.slice(afterH + lm[0].length);
}

function buildResults(html) {
  const hm = /<h2>\s*(?:<strong>)?\s*(?:Results|Impact)[^<]*(?:<\/strong>)?\s*<\/h2>\n?/i.exec(html);
  if (!hm) return html;
  const bodyStart = hm.index + hm[0].length;
  // The section runs to the next h2, or to the first h3 other than "Next steps", or to the first image block
  const stopRe = /<h2[ >]|<h3>(?!\s*(?:<strong>)?\s*Next steps)|<figure|<div class="col-layout/g;
  stopRe.lastIndex = bodyStart;
  const n1 = stopRe.exec(html);
  let bodyEnd = n1 ? n1.index : html.length;
  let body = html.slice(bodyStart, bodyEnd);
  let nextSteps = '';
  const ns = /<h3>\s*(?:<strong>)?\s*Next steps\s*(?:<\/strong>)?\s*<\/h3>\n?([\s\S]*)$/i.exec(body);
  if (ns) { nextSteps = ns[1]; body = body.slice(0, ns.index); }
  else if (n1 && /^<h2[^>]*>\s*(?:<strong>)?\s*Next steps\s*(?:<\/strong>)?\s*<\/h2>/i.test(html.slice(n1.index))) {
    const h2End = html.indexOf('</h2>', n1.index) + 5;
    stopRe.lastIndex = h2End;
    const n2 = stopRe.exec(html);
    const end2 = n2 ? n2.index : html.length;
    nextSteps = html.slice(h2End, end2);
    bodyEnd = end2;
  }
  if (/<div|<h3/.test(body) || /<div|<h3/.test(nextSteps)) return html;
  const lists = [...body.matchAll(/<ul>([\s\S]*?)<\/ul>/g)];
  if (!lists.length) return html;
  const lis = lists.flatMap(u => [...u[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1].trim()));
  const rowLis = lis.filter(l => l.startsWith('<strong>'));
  if (!rowLis.length) return html;
  const quotes = lis.filter(l => l.startsWith('<em>')).map(l => l.replace(/^<em>([\s\S]*)<\/em>$/, '$1'));
  const paras = [...body.replace(/<ul>[\s\S]*?<\/ul>/g, '').matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m => m[1].trim());
  const lead = paras.filter(p => !/:$/.test(p.replace(/<[^>]+>/g, '').trim()));
  if (!lead.length) return html;
  const rows = rowLis.map(l => {
    const m = /^<strong>([\s\S]*?)<\/strong>\s*([\s\S]*)$/.exec(l);
    return `<div class="pr-row"><p class="pr-label">${m[1].replace(/[.:]\s*$/, '')}</p><p class="pr-rtext">${m[2]}</p></div>`;
  });
  const nsParas = [...nextSteps.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m => m[1].trim());
  if (nsParas.length) rows.push(`<div class="pr-row"><p class="pr-label">Next steps</p><p class="pr-rtext">${nsParas.join('<br><br>')}</p></div>`);
  const leadHtml = `<p class="pr-headline">${lead[0]}</p>${lead.slice(1).map(p => `<p class="pr-more">${p}</p>`).join('')}` +
    quotes.map(q => `<blockquote class="pr-quote">${q}</blockquote>`).join('');
  const out = `<div class="proj-results"><div class="pr-lead">${leadHtml}</div><div class="pr-rows">${rows.join('')}</div></div>\n`;
  return html.slice(0, bodyStart) + out + html.slice(bodyEnd);
}

// Delivery & challenges as two columns of rows (the layout from her deck). In Notion: under the h2 a two-column
// block, "### Process" with a bullet list on one side and "### Challenges" with a bullet list on the other.
// Each bullet becomes a bordered row; a bold lead in the bullet stays bold.
// The same two-column rows are used for Approach when it reads "Research process | Pain points" (equal halves, like the deck's discovery slide).
function buildDeliveryColumns(html) {
  html = buildRowColumns(html, /<h2>\s*(?:<strong>)?\s*Approach[^<]*(?:<\/strong>)?\s*<\/h2>\n?/i, 'proj-dc proj-dc-even');
  return buildRowColumns(html, /<h2>\s*(?:<strong>)?\s*Delivery\s*(?:&amp;|and)\s*challenges[^<]*(?:<\/strong>)?\s*<\/h2>\n?/i, 'proj-dc');
}

function buildRowColumns(html, headingRe, cls) {
  const hm = headingRe.exec(html);
  if (!hm) return html;
  const start = hm.index + hm[0].length;
  const nextH2 = html.slice(start).search(/<h2[ >]/);
  const end = nextH2 === -1 ? html.length : start + nextH2;
  let seg = html.slice(start, end);
  if (!seg.includes('<div class="col-layout col-2">')) return html;
  // Only the two-column block turns into rows: anything from a "Design principles" sub-heading on is left alone
  const cut = seg.search(/<h3>\s*(?:<strong>)?\s*Design principles/i);
  const head = cut === -1 ? seg : seg.slice(0, cut);
  const tail = cut === -1 ? '' : seg.slice(cut);
  // A statement-only first column next to a rows column: the statement takes a third, the rows two thirds
  const firstCol = head.split('</div><div class="col">')[0];
  if (cls.includes('proj-dc-even') && !/<ul>/.test(firstCol)) cls = 'proj-dc proj-dc-lead';
  seg = head.replace('<div class="col-layout col-2">', `<div class="col-layout col-2 ${cls}">`)
    .replace(/<ul>([\s\S]*?)<\/ul>/g, (m, inner) =>
      `<div class="dc-rows">${[...inner.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(x => `<p class="dc-row">${x[1].trim()}</p>`).join('')}</div>`) + tail;
  return html.slice(0, start) + seg + html.slice(end);
}

// The problem as a statement on the left and a rows list on the right (the layout from her deck). In Notion: under the h2
// a two-column block, the statement paragraphs on one side and "### What users needed to understand" with a bullet list on the other.
function buildProblemColumns(html) {
  const hm = /<h2>\s*(?:<strong>)?\s*The problem[^<]*(?:<\/strong>)?\s*<\/h2>\n?/i.exec(html);
  if (!hm) return html;
  const start = hm.index + hm[0].length;
  const nextH2 = html.slice(start).search(/<h2[ >]/);
  const end = nextH2 === -1 ? html.length : start + nextH2;
  let seg = html.slice(start, end);
  if (!seg.includes('<div class="col-layout col-2">')) return html;
  // An italic paragraph, optionally followed by plain text on the same line, becomes a quote with its attribution
  seg = seg.replace('<div class="col-layout col-2">', '<div class="col-layout col-2 proj-prob">')
    .replace(/<p><em>([\s\S]*?)<\/em>\s*([^<]*)<\/p>/g, (m, q, a) =>
      `<blockquote class="pr-quote">${q}${a.trim() ? `<cite>${a.trim()}</cite>` : ''}</blockquote>`)
    .replace(/<ul>([\s\S]*?)<\/ul>/g, (m, inner) =>
      `<div class="dc-rows">${[...inner.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(x => `<p class="dc-row">${x[1].trim()}</p>`).join('')}</div>`);
  return html.slice(0, start) + seg + html.slice(end);
}

function projectPage(proj, prevProj, nextProj, subtitleMap = {}) {
  const prefix = '../';
  const meta  = PROJECT_META[proj.slug] || {};

  // Per-slug content post-processing
  let contentHtml = proj.contentHtml;
  if (proj.slug === 'ai-credits-wallet' && contentHtml) {
    // The interactive wallet sits next to the Solution section: the Solution heading, its list and the
    // "Where users see their credits" bullets go in the left column, the image groups follow full width.
    const solIdx = contentHtml.search(/<h2[^>]*>\s*(?:<strong>)?\s*Solution[^<]*(?:<\/strong>)?\s*<\/h2>/i);
    const figRel = solIdx === -1 ? -1 : contentHtml.slice(solIdx).search(/<figure class="proj-img"|<div class="col-layout/);
    const figIdx = figRel === -1 ? -1 : solIdx + figRel;
    if (solIdx !== -1 && figIdx > solIdx) {
      const h3Idx = contentHtml.lastIndexOf('<h3>', figIdx);
      const cut = h3Idx > solIdx ? h3Idx : figIdx;
      contentHtml =
        `<style>@media(max-width:768px){.cw-widget-col{display:none!important;}.cw-grid{grid-template-columns:1fr!important;}}.cw-grid>div>h2:first-child{margin-top:0;}</style>` +
        contentHtml.slice(0, solIdx) +
        `<div class="cw-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;margin:32px 0;">` +
        `<div>${contentHtml.slice(solIdx, cut)}</div>` +
        `<figure class="cw-widget-col" style="margin:0;">` +
        `<iframe src="credits-widget.html" title="Business Manager widget states" style="width:100%;height:580px;border:none;display:block;border-radius:8px;background:#ECECEE;" scrolling="no">` +
        `Interactive demo showing the AI Credits wallet component across Free, Premium, and Top-up states in Business Manager.` +
        `</iframe>` +
        `<figcaption class="proj-caption">Use the top selectors to see more wallet states</figcaption>` +
        `</figure></div>` +
        contentHtml.slice(cut);
    }
  }
  // TL;DR box: a Notion paragraph that starts with "TL;DR" becomes a two-column summary box.
  // One column per sentence (up to three): what was done, how it was reached, the outcome.
  if (contentHtml) {
    // Two Notion shapes work: "TL;DR: sentence. sentence. sentence." in one paragraph,
    // or a "TL;DR" paragraph on its own followed by one paragraph per sentence (up to three).
    const tldrRe = /<p>\s*TL;DR:?\s*([\s\S]*?)<\/p>/i;
    const tm = tldrRe.exec(contentHtml);
    if (tm) {
      let parts = [];
      let end = tm.index + tm[0].length;
      const inner = tm[1].replace(/<br\s*\/?>/g, ' ').trim();
      if (inner) {
        parts = inner.split(/(?<=[.!?])\s+/).filter(Boolean);
      } else {
        const pRe = /^\s*<p>([\s\S]*?)<\/p>/;
        let rest = contentHtml.slice(end), pm;
        while (parts.length < 3 && (pm = pRe.exec(rest)) && pm[1].replace(/<[^>]+>/g, '').trim()) {
          parts.push(pm[1].trim());
          end += pm[0].length;
          rest = contentHtml.slice(end);
        }
      }
      if (parts.length > 3) parts = [parts.slice(0, parts.length - 2).join(' '), parts[parts.length - 2], parts[parts.length - 1]];
      if (parts.length) {
        // Three sentences carry the deck's labels: the problem, the process, the result
        const TLDR_LABELS = ['The problem', 'Process', 'The result'];
        const cols = parts.map((t, i) => `<p>${parts.length === 3 ? `<span class="proj-tldr-col-label">${TLDR_LABELS[i]}</span>` : ''}${t}</p>`).join('');
        const box = `<div class="proj-tldr"><span class="proj-tldr-label">TL;DR</span><div class="proj-tldr-grid" data-cols="${parts.length}">${cols}</div></div>`;
        contentHtml = contentHtml.slice(0, tm.index) + box + contentHtml.slice(end);
      }
    }
  }
  // Design principles written flat (not in columns) also become cards; Results become a lead plus labelled rows
  if (contentHtml) {
    const rules = splitRules(contentHtml);
    if (rules) contentHtml = rules.before + rules.cards + rules.after;
    contentHtml = markShotLayouts(contentHtml);
    contentHtml = buildAreaCards(contentHtml);
    contentHtml = buildResults(contentHtml);
    contentHtml = buildDeliveryColumns(contentHtml);
    contentHtml = buildProblemColumns(contentHtml);
  }
  if (contentHtml) contentHtml = injectTooltips(contentHtml);

  // Hero image (the first image, before the first heading) is not clickable: no lightbox
  if (contentHtml) {
    const figIdx = contentHtml.indexOf('<figure class="proj-img">');
    const h2Idx  = contentHtml.search(/<h2/);
    if (figIdx !== -1 && (h2Idx === -1 || figIdx < h2Idx)) {
      contentHtml = contentHtml.slice(0, figIdx) + '<figure class="proj-img proj-hero">' + contentHtml.slice(figIdx + '<figure class="proj-img">'.length);
    }
  }


  // "Last updated" line under the Bottom line section (project pages only), from the page's Notion last-edited time
  if (contentHtml && proj.lastEdited) {
    const d = new Date(proj.lastEdited);
    if (!isNaN(d)) {
      const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
      const updatedHtml = `<p class="proj-updated">Last updated ${label}</p>`;
      const blIdx = contentHtml.search(/<h2[^>]*>\s*(?:<strong>)?\s*Bottom line/i);
      const nextH2 = blIdx === -1 ? -1 : contentHtml.slice(blIdx + 4).search(/<h2/);
      if (nextH2 === -1) contentHtml += '\n' + updatedHtml;
      else contentHtml = contentHtml.slice(0, blIdx + 4 + nextH2) + updatedHtml + '\n' + contentHtml.slice(blIdx + 4 + nextH2);
    }
  }

  // Inject "Screens" h2 before the first screen-section h3 (the first h3 immediately
  // followed by a figcaption or proj-img, which marks the transition from process text to screens).
  // Skip pages that already have a Screens heading, have a custom layout, or are numbered-feature pages.
  // Pages that keep a "Solution" heading as written in Notion (not renamed to Screens).
  const SKIP_SCREENS = new Set(['ai-credits-wallet', 'app-pricing-page-projects', 'app-installation-page-for-developers']);
  if (contentHtml && !SKIP_SCREENS.has(proj.slug) && !/>\s*Screens\s*</.test(contentHtml) && !/<h2>\s*Solution[^<]*<\/h2>/.test(contentHtml)) {
    if (contentHtml.includes('<h2><strong>Solution</strong></h2>')) {
      contentHtml = contentHtml.replace('<h2><strong>Solution</strong></h2>', '<h2>Screens</h2>');
    } else {
      contentHtml = contentHtml.replace(
        /(<h3>[^<]*<\/h3>\n)(?=<figcaption|<figure class="proj-img")/,
        '<h2>Screens</h2>\n$1'
      );
    }
  }

  // Side anchor navigation (left margin, wide screens only). Trial: only pages listed here.
  // All project pages get the menu. Pages with fewer than three sections get none (nothing to list).
  const ANCHOR_NAV = { has: () => true };
  let anchorNavHtml = '';
  if (contentHtml && ANCHOR_NAV.has(proj.slug)) {
    const items = [];
    if (contentHtml.includes('<div class="proj-tldr">')) {
      contentHtml = contentHtml.replace('<div class="proj-tldr">', '<div class="proj-tldr" id="sec-tldr">');
      items.push({ id: 'sec-tldr', text: 'TL;DR' });
    }
    // h2 sections become numbered items. h3 sub-sections are listed under the h2s named in SUB_SECTIONS.
    const SUB_SECTIONS = new Set([]); // sub-sections in the menu were tried (Approach: Research, Design principles) and removed at her request
    let currentH2 = '';
    // Pages built from numbered feature blocks (h3) with almost no h2 list their h3s as the menu items instead.
    const useH3 = (contentHtml.match(/<h2>/g) || []).length < 3;
    contentHtml = contentHtml.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (m, level, inner) => {
      // A heading written "Label | Title" is listed in the menu by its label only
      const text = inner.replace(/<[^>]+>/g, '').trim().split(/\s+\|\s+/)[0];
      if (!text || text === 'TL;DR') return m;
      const slug = text.toLowerCase().replace(/&amp;/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (level === '2') {
        currentH2 = text;
        items.push({ id: 'sec-' + slug, text });
        return `<h2 id="sec-${slug}">${inner}</h2>`;
      }
      if (useH3) {
        const label = text.replace(/^\d+\.\s*/, '').replace(/\s*\(.*$/, '').trim();
        items.push({ id: 'sec-' + slug, text: label });
        return `<h3 id="sec-${slug}">${inner}</h3>`;
      }
      if (SUB_SECTIONS.has(currentH2)) {
        items.push({ id: 'sub-' + slug, text, sub: true });
        return `<h3 id="sub-${slug}">${inner}</h3>`;
      }
      return m;
    });
    if (items.length > 2) {
      let n = 0;
      const lis = items.map(i => i.sub
        ? `<li class="pa-sub"><a href="#${i.id}"><span class="pa-label">${i.text}</span></a></li>`
        : `<li><a href="#${i.id}"><span class="pa-num">${String(++n).padStart(2, '0')}</span><span class="pa-label">${i.text}</span></a></li>`
      ).join('');
      anchorNavHtml = `<nav class="toc" aria-label="Contents" inert><span class="toc-title">${titleCase(proj.title || meta.title || 'Project')}</span><ol>${lis}</ol></nav>`;
    }
  }

  // Section headings written "Label | Title" in Notion: a small label above a large title (the deck's slide headers)
  if (contentHtml) {
    contentHtml = contentHtml.replace(/<h2( id="[^"]*")?>([^<|]*?)\s+\|\s+([^<]*)<\/h2>/g,
      (m, id, label, ttl) => `<h2${id || ''} class="proj-h2"><span class="proj-h2-label">${label.trim()}</span><span class="proj-h2-title">${ttl.trim()}</span></h2>`);
  }

  // Sub-headings written "Label | Title" get the same small label above a title
  if (contentHtml) {
    contentHtml = contentHtml.replace(/<h3( id="[^"]*")?>([^<|]*?)\s+\|\s+([^<]*)<\/h3>/g,
      (m, id, label, ttl) => `<h3${id || ''} class="proj-h3"><span class="proj-h2-label">${label.trim()}</span><span class="proj-h3-title">${ttl.trim()}</span></h3>`);
  }

  const title = titleCase(proj.title || meta.title || 'Project');
  const year  = meta.year  || proj.year;
  const CAT_LABELS = { developer: 'Developer tools', monetisation: 'Monetisation', cms: 'CMS', internal: 'Internal tools' };
  const catHtml = (meta.cats || '').split(' ').filter(Boolean)
    .map(c => `<span class="pm">${CAT_LABELS[c] || c}</span>`).join('<span class="psep">·</span>')
    || `<span class="pm">${meta.display || 'Product design'}</span>`;
  const prevTitle = prevProj ? titleCase(prevProj.title || PROJECT_META[prevProj.slug]?.title || 'Project') : null;
  const nextTitle = nextProj ? titleCase(nextProj.title || PROJECT_META[nextProj.slug]?.title || 'Project') : null;

  const allProjectsJs = Object.entries(PROJECT_META)
    .filter(([slug]) => !SKIP_SLUGS.has(slug))
    .map(([slug, m]) => {
      const sub = (subtitleMap[slug] || '').replace(/'/g, "\\'");
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
  var pick = others.slice(0, 4);
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
        '<span class="cat-tag">' + p.cat + '</span>' +
        '<span class="row-arr"><span class="link-label">View</span> ↗</span>' +
        '<div class="mob-row-foot"><span class="mob-view-btn mob-view-sm"><span class="link-label">View</span> ↗</span></div>' +
      '</a>';
    list.appendChild(wrap);
  });
})();
</script>`;

  return wrap(prefix, `${title} | Avigail Bahat`, `
  <div class="proj-page-grid">
    <div class="proj-gutter proj-gutter-left"></div>
    <main class="proj-main">
      <div class="proj-side-nav">
        ${prevProj ? `<a class="proj-nav-btn proj-nav-prev" href="${prevProj.slug}.html" aria-label="Previous project"><span class="proj-nav-name"><i class="ti ti-arrow-left"></i> <span class="link-label">${prevTitle}</span></span></a>` : '<span></span>'}
        ${nextProj ? `<a class="proj-nav-btn proj-nav-next" href="${nextProj.slug}.html" aria-label="Next project"><span class="proj-nav-name"><span class="link-label">${nextTitle}</span> <i class="ti ti-arrow-right"></i></span></a>` : '<span></span>'}
      </div>
      ${anchorNavHtml}
      <div class="title-block proj-title-sticky" id="proj-title-sticky">
        <div class="proj-tags-m">
          <span class="pm">${year}</span>
          <span class="psep">·</span>
          ${catHtml}
        </div>
        <div class="proj-title-row">
          ${prevProj ? `<button class="proj-nav-arr" id="proj-prev" aria-label="Previous project" onclick="location.href='${prevProj.slug}.html'">←</button>` : ''}
          <h1 class="proj-title-m">${title}</h1>
          ${nextProj ? `<button class="proj-nav-arr" id="proj-next" aria-label="Next project" onclick="location.href='${nextProj.slug}.html'">→</button>` : ''}
        </div>
        ${proj.subtitle ? `<p class="proj-subtitle-m">${proj.subtitle}</p>` : ''}
        ${PROJECT_DECKS[proj.slug] ? `<div class="proj-deck-wrap"><a class="proj-deck-btn" href="${PROJECT_DECKS[proj.slug]}" target="_blank" rel="noopener">Presentation mode ↗</a></div>` : ''}
        <div class="proj-meta-m">
          ${prevProj ? `<button class="proj-nav-text" aria-label="Previous project" onclick="location.href='${prevProj.slug}.html'">← Previous</button>` : ''}
          ${nextProj ? `<button class="proj-nav-text proj-nav-text-next" aria-label="Next project" onclick="location.href='${nextProj.slug}.html'">Next →</button>` : ''}
        </div>
      </div>
      <div class="proj-content">
        ${contentHtml}
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
  <div id="lightbox" class="lb-overlay" role="dialog" aria-modal="true" aria-label="Project image viewer" aria-hidden="true" inert>
    <button class="lb-close" aria-label="Close">✕</button>
    <div class="lb-stage">
      <button class="lb-handle lb-prev" aria-label="Previous">‹</button>
      <div class="lb-content">
        <img class="lb-img" alt="">
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
    var hdrElM = document.getElementById('site-header');
    function syncTopM(){ if (hdrElM) sticky.style.top = hdrElM.offsetHeight + 'px'; }
    syncTopM();
    if (hdrElM && window.ResizeObserver) new ResizeObserver(syncTopM).observe(hdrElM);
    window.addEventListener('scroll', function(){
      syncTopM();
      sticky.classList.toggle('condensed', window.scrollY > 56);
    }, { passive: true });
    window.addEventListener('resize', syncTopM, { passive: true });
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
  }
})();
</script>`, '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">\n  ', 'proj-page');
}

// About/CV content comes from the Notion About & Contact page at build time.
async function aboutPage(blocks) {
  const summaryBlocks = [];
  const contactBlocks = [];
  const sections = [];
  let currentSection = null;
  let pendingDivider = null;
  let foundHeading = false;

  const sourceBlocks = blocks || [];
  for (let i = 0; i < sourceBlocks.length; i++) {
    const block = sourceBlocks[i];
    if (block.type === 'heading_2') {
      foundHeading = true;
      const title = plainText(block.heading_2.rich_text).trim();
      currentSection = { title, blocks: pendingDivider ? [pendingDivider] : [] };
      pendingDivider = null;
      sections.push(currentSection);
      continue;
    }
    if (block.type === 'divider' && /^(key achievements|tools)$/i.test(plainText(sourceBlocks[i + 1]?.heading_2?.rich_text || []).trim())) {
      pendingDivider = block;
      continue;
    }
    if (!foundHeading && block.type === 'paragraph') {
      const text = plainText(block.paragraph.rich_text).trim();
      if (!text) continue;
      if (block.paragraph.rich_text.some((item) => item.href) || /^(cv|resume)$/i.test(text)) {
        contactBlocks.push(block);
      } else if (!summaryBlocks.length) {
        summaryBlocks.push(block);
      }
      continue;
    }
    if (currentSection) currentSection.blocks.push(block);
  }

  const blockText = (block) => block.type === 'paragraph'
    ? plainText(block.paragraph.rich_text).trim()
    : '';
  const paragraphHtml = (block, className = '') => {
    if (block.type !== 'paragraph') return '';
    const content = rt(block.paragraph.rich_text);
    return content ? `<p${className ? ` class="${className}"` : ''}>${content}</p>` : '';
  };
  const contactHtml = contactBlocks.map((block) => {
    const rich = block.paragraph.rich_text;
    const label = plainText(rich).trim();
    const isCv = /^(cv|resume)$/i.test(label);
    const href = isCv ? CV_EXPORT_URL : rich.find((item) => item.href)?.href;
    if (!href) return '';
    const external = /^https?:/i.test(href);
    const icon = isCv ? '↓' : '↗';
    const labelHtml = rt(rich.map((item) => ({ ...item, href: null })));
    return `<li><a href="${escapeAttr(href)}"${external ? ' target="_blank" rel="noopener"' : ''}><span>${labelHtml}</span><span class="cv-link-icon" aria-hidden="true">${icon}</span></a></li>`;
  }).join('');

  const sideSections = [];
  const experienceSections = [];
  let achievementsSection = null;
  for (const section of sections) {
    const isExperience = /^experience$/i.test(section.title);
    const rendered = [];

    if (/^key achievements$/i.test(section.title)) {
      const entries = section.blocks.filter((block) => block.type === 'paragraph' && blockText(block));
      const achievementItems = [];
      for (let i = 0; i < entries.length; i += 2) {
        const title = blockText(entries[i]);
        const description = entries[i + 1];
        achievementItems.push(`<li><h3 class="cv-job-title">${escapeAttr(title)}</h3>${description ? paragraphHtml(description) : ''}</li>`);
      }
      if (achievementItems.length) {
        const id = `about-section-${slugify(section.title)}`;
        achievementsSection = `<section class="cv-achievements" aria-labelledby="${id}"><h2 id="${id}">${escapeAttr(section.title)}</h2><ul class="cv-achievements-list">${achievementItems.join('')}</ul></section>`;
      }
      continue;
    }

    for (const block of section.blocks) {
      if (block.type === 'column_list') {
        const columns = await fetchBlocks(block.id);
        const columnBlocks = await Promise.all(columns.map((column) => fetchBlocks(column.id)));
        const firstColumnText = columnBlocks[0]?.map(blockText).find(Boolean) || '';

        if (/^education$/i.test(firstColumnText)) {
          const content = columnBlocks.slice(1).flat().filter((item) => blockText(item));
          sideSections.push({ title: 'Education', html: content.map((item) => paragraphHtml(item)).join('') });
          continue;
        }

        if (isExperience) {
          const year = firstColumnText;
          const content = columnBlocks.slice(1).flat().filter((item) => blockText(item));
          const roleLine = content.shift();
          const roleText = blockText(roleLine || {});
          const splitAt = roleText.lastIndexOf(' - ');
          const organization = splitAt >= 0 ? roleText.slice(0, splitAt) : '';
          const role = splitAt >= 0 ? roleText.slice(splitAt + 3) : roleText;
          const details = content
            .filter((item) => !item.paragraph.rich_text.length || !item.paragraph.rich_text.every((part) => part.annotations?.italic))
            .map((item) => paragraphHtml(item))
            .join('');
          rendered.push(`<article class="cv-job">
            <h3 class="cv-job-title">${escapeAttr(role)}</h3>
            <p class="cv-job-meta">${organization ? `${escapeAttr(organization)} · ` : ''}<time>${escapeAttr(year)}</time></p>
            ${details}
          </article>`);
          continue;
        }

        const columnsHtml = columnBlocks.map((items) => `<div>${items.map((item) => paragraphHtml(item)).join('')}</div>`).join('');
        rendered.push(`<div class="cv-notion-columns">${columnsHtml}</div>`);
      } else if (block.type === 'paragraph' && blockText(block)) {
        rendered.push(paragraphHtml(block));
      } else if (['bulleted_list_item', 'numbered_list_item', 'heading_3'].includes(block.type)) {
        rendered.push(await toHtml([block]));
      }
    }
    const html = rendered.join('\n');
    if (!html) continue;
    if (isExperience) experienceSections.push({ title: section.title, html });
    else sideSections.push({ title: section.title, html });
  }

  const summaryHtml = summaryBlocks.map((block) => paragraphHtml(block)).join('');
  const renderSection = (section, index) => {
    const id = `about-section-${slugify(section.title) || index}`;
    return `<section aria-labelledby="${id}"><h2 id="${id}">${escapeAttr(section.title)}</h2>${section.html}</section>`;
  };
  const sideHtml = sideSections.map(renderSection).join('');
  const experienceHtml = experienceSections.map(renderSection).join('');

  return wrap('', 'Avigail Bahat, Senior Product Designer', `
  <main class="inner-main">
    <div class="cv-page">
      <header class="cv-head">
        <h1>Avigail Bahat</h1>
        <ul class="cv-contact">${contactHtml}</ul>
      </header>
      ${summaryHtml ? `<section class="cv-summary" aria-labelledby="cv-summary"><h2 id="cv-summary">Summary</h2>${summaryHtml}</section>` : ''}
      ${achievementsSection || ''}
      <div class="cv-cols">
        <div class="cv-col-main">
          ${experienceHtml}
        </div>
        <div class="cv-col-side">
          ${sideHtml}
        </div>
      </div>
    </div>
  </main>`, '', '', 'about-page', 'about');
}

function designSystemPage(notionConnected) {
  const swatches = [
    { hex: '#0a0a0a', name: 'Black',     usage: 'Primary text, hover fill, footer bg' },
    { hex: '#555555', name: 'Gray',      usage: 'All secondary text: nav, labels, years, body copy' },
    { hex: '#ffffff', name: 'White',     usage: 'Page background, text on dark' },
    { hex: '#d0d0d0', name: 'Surface / Border', usage: 'Hairline borders, surface backgrounds (--border)' },
    { hex: '#22c55e', name: 'Available', usage: 'Availability dot only' },
  ];
  const typeRows = [
    { sample: 'AI Credits Wallet',           spec: '54px / 700 / −0.03em / Plus Jakarta Sans', where: 'Project page title (.proj-title-m)',                                  style: 'font-size:54px;font-weight:700;letter-spacing:-0.03em;color:#0a0a0a;line-height:1.1;font-family:Plus Jakarta Sans,sans-serif' },
    { sample: 'Featured project',            spec: 'clamp(24–40px) / 700 / −0.03em / Plus Jakarta Sans', where: 'Featured project title (.feat-title)',                        style: 'font-size:40px;font-weight:700;letter-spacing:-0.03em;color:#0a0a0a;line-height:1.1;font-family:Plus Jakarta Sans,sans-serif' },
    { sample: 'Design system',               spec: '32px / 700 / −0.02em / Roboto',             where: 'Inner page h1, footer statement, project section headings (.inner-content h1, .footer-statement, .proj-content h2)', style: 'font-size:32px;font-weight:700;letter-spacing:-0.02em;color:#0a0a0a' },
    { sample: 'Senior UX designer.',         spec: '28px / 500 / −0.01em / Plus Jakarta Sans', where: 'Homepage lede (.lede)',                                               style: 'font-size:28px;font-weight:500;letter-spacing:-0.01em;color:#0a0a0a;font-family:Plus Jakarta Sans,sans-serif' },
    { sample: 'I planned and rebuilt a stale internal review tool.', spec: '20px (18px in 3 columns) / 500 / −0.01em / Plus Jakarta Sans', where: 'TL;DR box text (.proj-tldr p)', style: 'font-size:20px;font-weight:500;letter-spacing:-0.01em;color:#0a0a0a;line-height:1.4;font-family:Plus Jakarta Sans,sans-serif' },
    { sample: 'Transparent AI usage billing across the platform.', spec: '20px / 500 / Roboto (sub-headings in Plus Jakarta Sans)', where: 'Project subtitle, CV role titles (.proj-subtitle, .cv-title). Project sub-headings (.proj-content h3) are Plus Jakarta Sans 20px / 700', style: 'font-size:20px;font-weight:500;color:#0a0a0a;line-height:1.4' },
    { sample: 'Body copy — project content, about, contact, work rows.', spec: '16px / 400 / Roboto / lh 1.7 / #555', where: 'All body and secondary text (.proj-intro, .proj-content p, .proj-body, .row-title, .cv-desc, .cv-years, .contact-intro)', style: 'font-size:16px;color:#555;line-height:1.7' },
    { sample: 'FEATURED WORK · EXPERIENCE',  spec: '14px / 400 / uppercase / 0.07–0.08em',   where: 'Section labels, about page section labels, TL;DR label (.section-label, .more-label, .about-notion h2, .proj-tldr-label)', style: 'font-size:14px;letter-spacing:0.07em;text-transform:uppercase;color:#555' },
    { sample: 'Nav links, years, tags, meta', spec: '14px / 400 / Roboto',                    where: 'Nav links, row meta, tag labels, footer text',                          style: 'font-size:14px;color:#555' },
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
    { date: '31 Oct 2026', change: 'Homepage About me snippet below the project list: title, facts and links from the Notion Homepage page, summary from the first About paragraph. Bordered box with three fact blocks; stacks below 960px with no dividers. About, View and previous/next project links stay blue and underline only their text on hover' },
    { date: '31 Oct 2026', change: 'Homepage: separate featured cards removed; featured projects are the first, bigger rows of the list (.row-feat, Jakarta clamp(24-32px)/700, subtitle always visible). Years and feature stars removed from all rows. Row titles Plus Jakarta Sans 500. Regular rows get random hover colour pairs. Intro Jakarta 500 clamp(28-44px). Footer links and tagline white' },
    { date: '12 Oct 2026', change: 'TL;DR box added to project pages: 0.5px #d0d0d0 border, 8px radius, 40px padding, label 14px uppercase #555, one column per sentence (up to three) in Plus Jakarta Sans 500, stacked on mobile' },
    { date: '12 Oct 2026', change: 'Last updated line added under the Bottom line on project pages (14px, #555), dated from the Notion page last edit' },
    { date: '12 Oct 2026', change: 'Browser tab titles use a vertical bar instead of an em dash' },
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
    { date: '1 Jun 2026', change: 'Type scale consolidated: footer-statement 36px → 32px / Roboto; row-title 20px/500 → 18px/400; CV text 15px → 16px; proj-subtitle weight 400 → 500, color #555 → #0a0a0a' },
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

  return wrap('', 'Design System | Avigail Bahat', `
  <div id="ds-gate" style="position:fixed;inset:0;z-index:999;background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;">
    <div style="max-width:300px;width:100%;padding:0 24px;">
      <p style="font-size:15px;color:#555;margin-bottom:20px;text-align:center;">Enter password</p>
      <input id="ds-pw" type="password" placeholder="Password" autocomplete="current-password"
        style="width:100%;font-size:15px;padding:10px 14px;border:0.5px solid #d0d0d0;border-radius:6px;outline:none;font-family:inherit;box-sizing:border-box;margin-bottom:10px;display:block;">
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
                <div class="row" data-cat="developer" style="border-top:0.5px solid #d0d0d0;">
                  <span class="num">01</span>
                  <div class="rmain">
                    <span class="row-title">AI Credits Wallet</span>
                    <span class="rsub">End-to-end billing transparency for AI usage across the platform</span>
                  </div>
                  <span class="cat-tag">developer</span>
                  <span class="row-arr"><span class="link-label">View</span> ↗</span>
                </div>
              </div>
            </div>
          </div>

          <div class="ds-comp-block">
            <span class="ds-comp-label">Featured row (homepage)</span>
            <div class="ds-comp-demo" style="padding:0 24px;">
              <div class="row-wrap open row-feat">
                <div class="row row-feat" data-cat="monetisation" style="border-top:0.5px solid #d0d0d0;">
                  <span class="num">01</span>
                  <div class="rmain">
                    <span class="row-title">AI Credits Wallet</span>
                    <span class="rsub">One shared credits wallet for free and premium users, across Wix and Wixel.</span>
                  </div>
                  <span class="cat-tags"><span class="cat-tag">Monetisation</span></span>
                  <span class="row-arr"><span class="link-label">View</span> ↗</span>
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
              <a href="#" class="proj-nav-btn" style="position:static;opacity:1;text-decoration:none;"><span class="proj-nav-name"><i class="ti ti-arrow-left"></i> <span class="link-label">AI Credits Wallet</span></span></a>
              <a href="#" class="proj-nav-btn" style="position:static;opacity:1;text-decoration:none;"><span class="proj-nav-name"><span class="link-label">App Reviews</span> <i class="ti ti-arrow-right"></i></span></a>
            </div>
          </div>

          <div class="ds-comp-block">
            <span class="ds-comp-label">More work CTA</span>
            <div class="ds-comp-demo">
              <a href="#" class="more-cta-link">See all work →</a>
            </div>
          </div>

          <div class="ds-comp-block">
            <span class="ds-comp-label">TL;DR box (project page, one column per sentence, up to three)</span>
            <div class="ds-comp-demo proj-content" style="padding:24px;">
              <div class="proj-tldr" style="margin:0;"><span class="proj-tldr-label">TL;DR</span><div class="proj-tldr-grid" data-cols="3"><p>What was done, in one sentence.</p><p>How it was reached, in one sentence.</p><p>The outcome, in one sentence.</p></div></div>
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
                  <button style="width:30px;height:30px;border-radius:8px;border:0.5px solid #d0d0d0;display:flex;align-items:center;justify-content:center;font-size:14px;color:#555;background:none;cursor:pointer;">✕</button>
                </div>
                <div>
                  <span style="display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;padding:10px 0;color:#0a0a0a;border-bottom:0.5px solid #d0d0d0;">Home ↗</span>
                  <span style="display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;padding:10px 0;color:#aaa;border-bottom:0.5px solid #d0d0d0;">Work</span>
                  <span style="display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;padding:10px 0;color:#aaa;border-bottom:0.5px solid #d0d0d0;">About</span>
                  <span style="display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;padding:10px 0;color:#aaa;border-bottom:0.5px solid #d0d0d0;">Contact</span>
                  <span style="display:block;font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;padding:10px 0;color:#aaa;">Design system</span>
                </div>
                <div style="margin-top:16px;padding-top:16px;border-top:0.5px solid #d0d0d0;">
                  <div style="display:flex;justify-content:space-between;font-size:14px;color:#555;padding:7px 0;">avigailba@gmail.com <span>↗</span></div>
                  <div style="display:flex;justify-content:space-between;font-size:14px;color:#555;padding:7px 0;">LinkedIn <span>↗</span></div>
                </div>
              </div>
            </div>
          </div>

          <div class="ds-comp-block">
            <span class="ds-comp-label">Work row (mobile)</span>
            <div class="ds-comp-demo" style="padding:0 16px;">
              <div style="display:flex;align-items:center;gap:10px;padding:14px 0;border-top:0.5px solid #d0d0d0;border-bottom:0.5px solid #d0d0d0;">
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
                <button style="display:inline-flex;align-items:center;gap:6px;font-size:14px;color:#0a0a0a;padding:7px 13px;border:0.5px solid #d0d0d0;border-radius:999px;background:none;cursor:pointer;font-family:inherit;">All projects <span style="font-size:10px;color:#555;">▾</span></button>
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
              <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:30px;font-weight:800;letter-spacing:-0.03em;line-height:1.08;color:#0a0a0a;margin-bottom:10px;">AI Credits Wallet</div>
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
  --border: #d0d0d0;

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
  if (STRICT_BUILD && !process.env.NOTION_API_KEY) {
    throw new Error('NOTION_API_KEY is required for production builds');
  }
  fs.mkdirSync(DIST, { recursive: true });
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  fs.mkdirSync(IMAGES, { recursive: true });
  fs.copyFileSync('style.css', path.join(DIST, 'style.css'));
  fs.copyFileSync('script.js', path.join(DIST, 'script.js'));
  ['favicon-32x32.png','favicon-16x16.png','apple-touch-icon.png'].forEach(f => {
    if (fs.existsSync(f)) fs.copyFileSync(f, path.join(DIST, f));
  });

  let projects = [];
  let subtitleMap = {};
  const writtenProjectFiles = new Set();
  let tagline = "Senior UX designer. I like the problems that need a whiteboard. I've spent my career building tools - for developers, for internal teams, and for end users.";
  let aboutBlocks = [];
  let homepageBlocks = [];

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
      const subtitle = firstSubtitle(p.blocks) || summary || '';
      projects.push({ ...p, title, icon, year, slug, summary, subtitle, lastEdited: meta.last_edited_time || '', contentHtml, excerpt: excerpt(p.blocks), callout: firstCallout(p.blocks) });
    }

    if (STRICT_BUILD && stats.errors.length) {
      throw new Error(`Failed to download ${stats.errors.length} project image(s)`);
    }

    for (const p of projects) subtitleMap[p.slug] = p.subtitle;

    for (let i = 0; i < projects.length; i++) {
      const prev = projects[(i - 1 + projects.length) % projects.length];
      const next = projects[(i + 1) % projects.length];
      const filename = `${projects[i].slug}.html`;
      fs.writeFileSync(path.join(PROJECTS_DIR, filename), projectPage(projects[i], prev, next, subtitleMap));
      writtenProjectFiles.add(filename);
      stats.pages++;
      console.log(`  ✓ projects/${projects[i].slug}.html`);
    }

    try {
      homepageBlocks = await fetchBlocks(HOMEPAGE_PAGE_ID);
      const firstPara = homepageBlocks.find(b => b.type === 'paragraph');
      if (firstPara) tagline = plainText(firstPara.paragraph.rich_text) || tagline;
    } catch (e) {
      if (STRICT_BUILD) throw e;
      console.log('Could not fetch homepage tagline, using default');
    }

    try {
      aboutBlocks = await fetchBlocks(ABOUT_PAGE_ID);
    } catch (e) {
      if (STRICT_BUILD) throw e;
      console.log('Could not fetch About page from Notion');
    }


  } catch (e) {
    console.error('Notion fetch failed:', e.code || e.status, e.message);
    if (STRICT_BUILD) throw new Error(`Production content fetch failed: ${e.message}`);
    projects = [];
    subtitleMap = {};
  }

  // Generate fallback pages for any META slugs not fetched from Notion
  const generatedSlugs = new Set(projects.map(p => p.slug));
  for (const [slug, meta] of Object.entries(PROJECT_META)) {
    if (generatedSlugs.has(slug) || SKIP_SLUGS.has(slug)) continue;
    const fallbackProj = {
      slug,
      title: meta.title,
      year: String(meta.year),
      summary: '',
      subtitle: '',
      contentHtml: '',
    };
    const filename = `${slug}.html`;
    fs.writeFileSync(path.join(PROJECTS_DIR, filename), projectPage(fallbackProj, null, null, subtitleMap));
    writtenProjectFiles.add(filename);
    stats.pages++;
    console.log(`  ✓ projects/${slug}.html (static fallback)`);
  }

  for (const [file, html] of [
    ['index.html',          indexPage(projects, tagline, homepageBlocks, aboutBlocks)],
    ['about.html',          await aboutPage(aboutBlocks)],
    ['contact.html',        '<meta http-equiv="refresh" content="0;url=about.html">'],
    ['design-system.html',  designSystemPage(projects.length > 0)],
  ]) {
    fs.writeFileSync(path.join(DIST, file), html);
    stats.pages++;
    console.log(`  ✓ ${file}`);
  }

  // Copy static widget files to dist/projects/
  const widgetSrc = path.join(__dirname, 'credits-widget.html');
  if (fs.existsSync(widgetSrc)) {
    fs.copyFileSync(widgetSrc, path.join(PROJECTS_DIR, 'credits-widget.html'));
    writtenProjectFiles.add('credits-widget.html');
    console.log('  ✓ projects/credits-widget.html');
  }

  // Include the current PDF linked from the About and CV page.
  const cvSrc = path.join(__dirname, 'Avigail Bahat CV.pdf');
  if (fs.existsSync(cvSrc)) {
    fs.copyFileSync(cvSrc, path.join(DIST, 'Avigail Bahat CV.pdf'));
    console.log('  ✓ Avigail Bahat CV.pdf');
  }
  const widgetAssetsSrc = path.join(__dirname, 'credits-widget-assets');
  if (fs.existsSync(widgetAssetsSrc)) {
    const widgetAssetsDst = path.join(PROJECTS_DIR, 'credits-widget-assets');
    if (!fs.existsSync(widgetAssetsDst)) fs.mkdirSync(widgetAssetsDst, { recursive: true });
    fs.readdirSync(widgetAssetsSrc).forEach(f => {
      fs.copyFileSync(path.join(widgetAssetsSrc, f), path.join(widgetAssetsDst, f));
    });
    console.log('  ✓ projects/credits-widget-assets/');
  }

  // Preserve manually created demo/static files that are not generator output
  const KEEP_PROJECT_FILES = new Set(['internal-review-demo.html', 'installations-demo.html']);

  for (const file of fs.readdirSync(PROJECTS_DIR)) {
    if (file.endsWith('.html') && !writtenProjectFiles.has(file) && !KEEP_PROJECT_FILES.has(file)) {
      fs.unlinkSync(path.join(PROJECTS_DIR, file));
      console.log(`  ✓ removed stale projects/${file}`);
    }
  }

  console.log(`\n✓ Done — ${stats.pages} pages, ${stats.images} images downloaded, ${stats.cached || 0} cached`);
  if (stats.errors.length) {
    console.log(`  ${stats.errors.length} error(s):`);
    stats.errors.forEach(e => console.log(`  - ${e}`));
  }
}

build().catch(err => { console.error('Build error:', err.message); process.exitCode = 1; });
