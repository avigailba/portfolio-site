try { require('dotenv').config(); } catch (e) {}
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

// Pages to exclude from the project grid
const SKIP_IDS   = new Set([ABOUT_PAGE_ID, CONTACT_PAGE_ID]);
const SKIP_SLUGS = new Set(['about', 'contact', 'cv', 'resume']);
const DIST = 'dist';
const IMAGES = path.join(DIST, 'images');

let imgIdx = 0;
const stats = { pages: 0, images: 0, errors: [] };

const FEATURED = ['ai credits', 'app coupons', 'submit'];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function stripEmoji(s) {
  return s.replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/gu, '').trim();
}

function isFeatured(title) {
  const t = title.toLowerCase();
  return FEATURED.some(f => t.includes(f));
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
  return richText.map(t => {
    let s = t.plain_text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    if (t.annotations.bold) s = `<strong>${s}</strong>`;
    if (t.annotations.italic) s = `<em>${s}</em>`;
    if (t.annotations.code) s = `<code>${s}</code>`;
    if (t.href) s = `<a href="${t.href}" target="_blank" rel="noopener">${s}</a>`;
    return s;
  }).join('');
}

function toHtml(blocks) {
  let html = '', uList = false, oList = false;
  for (const b of blocks) {
    if (b.type !== 'bulleted_list_item' && uList) { html += '</ul>\n'; uList = false; }
    if (b.type !== 'numbered_list_item' && oList) { html += '</ol>\n'; oList = false; }
    switch (b.type) {
      case 'paragraph': {
        const t = rt(b.paragraph.rich_text);
        if (t) html += `<p>${t}</p>\n`;
        break;
      }
      case 'heading_2': html += `<h2>${rt(b.heading_2.rich_text)}</h2>\n`; break;
      case 'heading_3': html += `<h3>${rt(b.heading_3.rich_text)}</h3>\n`; break;
      case 'bulleted_list_item':
        if (!uList) { html += '<ul>\n'; uList = true; }
        html += `  <li>${rt(b.bulleted_list_item.rich_text)}</li>\n`;
        break;
      case 'numbered_list_item':
        if (!oList) { html += '<ol>\n'; oList = true; }
        html += `  <li>${rt(b.numbered_list_item.rich_text)}</li>\n`;
        break;
      case 'callout': {
        const icon = b.callout.icon?.emoji ? `${b.callout.icon.emoji} ` : '';
        const t = rt(b.callout.rich_text);
        if (t) html += `<div class="callout"><p>${icon}${t}</p></div>\n`;
        break;
      }
      case 'divider': html += '<hr>\n'; break;
      // skip images and unsupported blocks
    }
  }
  if (uList) html += '</ul>\n';
  if (oList) html += '</ol>\n';
  return html;
}

function excerpt(blocks) {
  const p = blocks.find(b => b.type === 'paragraph' && b.paragraph.rich_text.length);
  return p ? p.paragraph.rich_text.map(t => t.plain_text).join('').slice(0, 180) : '';
}

function plainText(richText) {
  return richText.map(t => t.plain_text).join('');
}

// A paragraph whose first chunk is bold = experience row (bold=years, rest=role+company)
function isExpRow(block) {
  if (block.type !== 'paragraph') return false;
  const chunks = block.paragraph.rich_text;
  return chunks.length >= 2 && chunks[0].annotations.bold;
}

function renderExpRow(block) {
  const chunks = block.paragraph.rich_text;
  const years  = chunks.filter(t => t.annotations.bold).map(t => t.plain_text).join('');
  const rest   = chunks.filter(t => !t.annotations.bold).map(t => t.plain_text).join('').trim();
  const ci = rest.lastIndexOf(',');
  const role    = ci > 0 ? rest.slice(0, ci).trim() : rest;
  const company = ci > 0 ? rest.slice(ci + 1).trim() : '';
  return `<div class="exp-row">
    <span class="exp-role">${role}</span>${company ? `<span class="exp-company">${company}</span>` : ''}<span class="exp-years">${years}</span>
  </div>`;
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

// Hydrate table blocks by fetching their row children
async function hydrateTables(blocks) {
  for (const b of blocks) {
    if (b.type === 'table') b._rows = await fetchBlocks(b.id);
  }
}

// ── Layout ──────────────────────────────────────────────────

function hdr(cur) {
  const nav = [
    { id:'work',    href:'index.html',   label:'Work' },
    { id:'about',   href:'about.html',   label:'About' },
    { id:'contact', href:'contact.html', label:'Contact', pill:true },
  ];
  return `<header class="site-header" id="site-header">
  <div class="hdr-inner">
    <a href="index.html" class="hdr-logo">Avigail Bahat</a>
    <nav class="hdr-nav">
      ${nav.map(l => `<a href="${l.href}" class="nav-link${l.pill?' nav-pill':''}${l.id===cur?' nav-active':''}">${l.label}</a>`).join('\n      ')}
    </nav>
    <button class="hamburger" id="hamburger" aria-label="Menu"><span></span><span></span></button>
  </div>
  <div class="mob-menu" id="mob-menu">
    <a href="index.html">Work</a>
    <a href="about.html">About</a>
    <a href="mailto:avigailbahat@gmail.com">Email</a>
    <a href="https://linkedin.com/in/avigailbahat" target="_blank" rel="noopener">LinkedIn</a>
  </div>
</header>`;
}

function ftr(projects) {
  const top = projects.filter(p => isFeatured(p.title)).slice(0, 3);
  return `<footer class="site-footer">
  <div class="ftr-inner">
    <div class="ftr-col">
      <p class="ftr-tagline">Product designer focused on<br>developer tools and platform experiences.</p>
    </div>
    <div class="ftr-col">
      <span class="section-label">Projects</span>
      ${top.map(p=>`<a href="${p.slug}.html">${p.title}</a>`).join('\n      ')}
      <a href="index.html">All projects →</a>
    </div>
    <div class="ftr-col">
      <span class="section-label">Connect</span>
      <a href="mailto:avigailbahat@gmail.com">Email</a>
      <a href="https://linkedin.com/in/avigailbahat" target="_blank" rel="noopener">LinkedIn</a>
      <span class="ftr-loc">Tel Aviv</span>
    </div>
  </div>
  <div class="ftr-bottom">
    <span>© 2025 Avigail Bahat</span>
    <div style="display:flex;gap:20px;align-items:center;">
      <a href="design-system.html">Design system</a>
      <a href="#top">Back to top ↑</a>
    </div>
  </div>
</footer>`;
}

const JS = `<script>
const h=document.getElementById('site-header');
window.addEventListener('scroll',()=>h.classList.toggle('scrolled',scrollY>10));
const btn=document.getElementById('hamburger'),menu=document.getElementById('mob-menu');
btn.addEventListener('click',()=>{const o=menu.classList.toggle('open');btn.classList.toggle('open',o);});
</script>`;

function wrap(cur, title, body, projects) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body id="top">
  ${hdr(cur)}
  ${body}
  ${ftr(projects)}
  ${JS}
</body>
</html>`;
}

// ── Pages ────────────────────────────────────────────────────

function indexPage(projects) {
  const feat = projects.filter(p => isFeatured(p.title));
  const more = projects.filter(p => !isFeatured(p.title));

  const strips = feat.map((p, i) => `<a href="${p.slug}.html" class="feat-strip">
      <div class="strip-l">
        <div class="strip-hdr">
          <span class="strip-num">${String(i+1).padStart(2,'0')}</span>
          <h2 class="strip-title">${p.title}</h2>
          <span class="type-pill">Product Design</span>
        </div>
        ${p.excerpt?`<p class="strip-exc">${p.excerpt}</p>`:''}
        <div class="strip-foot">
          <span class="strip-yr">${p.year}</span>
          <span class="strip-cta">View case study →</span>
        </div>
      </div>
    </a>`).join('\n    ');

  const rows = more.map((p, i) => `<a href="${p.slug}.html" class="work-row">
      <span class="row-num">${String(feat.length+i+1).padStart(2,'0')}</span>
      <span class="row-title">${p.title}</span>
      <span class="row-yr">${p.year}</span>
      <span class="type-pill">Product Design</span>
    </a>`).join('\n    ');

  return wrap('work', 'Avigail Bahat — Product Designer', `
  <main class="home-main">
    <section class="hero">
      <h1>Making complex developer<br>workflows feel simple</h1>
      <div class="hero-meta">
        <span>Product Designer · ex-Wix</span>
        <span>${projects.length} projects</span>
      </div>
    </section>
    <section class="work-sec">
      <span class="section-label">Featured work</span>
      <div class="strips-wrap">${strips}</div>
    </section>
    ${more.length ? `<section class="work-sec">
      <span class="section-label">More work</span>
      <div class="rows-wrap">${rows}</div>
    </section>` : ''}
  </main>`, projects);
}

function projectPage(proj, projects) {
  return wrap('work', `${proj.title} — Avigail Bahat`, `
  <main class="proj-main">
    <div class="proj-shell">
      <div class="breadcrumb"><a href="index.html">← Work</a> / ${proj.title}</div>
      <h1 class="proj-h1">${proj.title}</h1>
      ${proj.excerpt?`<div class="callout"><p><strong>The problem:</strong> ${proj.excerpt}</p></div>`:''}
      <div class="stat-strip">
        <div class="stat-col"><span class="stat-val">${proj.year}</span><span class="stat-lbl">Year</span></div>
        <div class="stat-col"><span class="stat-val">Product Design</span><span class="stat-lbl">Type</span></div>
        <div class="stat-col"><span class="stat-val">Lead Designer</span><span class="stat-lbl">Role</span></div>
      </div>
      <div class="proj-body">
        <div class="proj-content">${proj.contentHtml}</div>
        <aside class="proj-aside">
          <div class="meta-row"><span class="meta-lbl">Year</span><span>${proj.year}</span></div>
          <div class="meta-row"><span class="meta-lbl">Type</span><span>Product Design</span></div>
          <div class="meta-row"><span class="meta-lbl">Role</span><span>Lead Designer</span></div>
        </aside>
      </div>
    </div>
  </main>`, projects);
}

async function aboutPage(blocks, projects) {
  await hydrateTables(blocks);

  let heroH1 = 'Product designer focused on developer experience';
  let heroSub = '';
  const sections = [];
  let cur = null;

  for (const b of blocks) {
    if (b.type === 'heading_1') {
      heroH1 = plainText(b.heading_1.rich_text);
      cur = null;
    } else if (b.type === 'heading_2') {
      const label = plainText(b.heading_2.rich_text);
      if (label.toLowerCase() === heroH1.toLowerCase()) {
        // h2 mirrors the h1 — absorb its following paragraphs as heroSub, not a section
        cur = null;
      } else {
        cur = { label, items: [] };
        sections.push(cur);
      }
    } else if (b.type === 'paragraph' && b.paragraph.rich_text.length) {
      if (!heroSub && !cur) {
        heroSub = rt(b.paragraph.rich_text);
      } else if (cur) {
        cur.items.push(b);
      }
    } else if (cur) {
      cur.items.push(b);
    }
  }

  if (!heroSub) heroSub = 'Curious about systems, obsessed with clarity, 12 years designing at Wix.';

  const sectionsHtml = sections.map(sec => {
    const hasList  = sec.items.some(b => b.type === 'bulleted_list_item');
    const hasTable = sec.items.some(b => b.type === 'table');
    const hasExp   = sec.items.some(b => isExpRow(b));
    let inner = '';
    if (hasList) {
      inner = `<div class="pill-group">${sec.items
        .filter(b => b.type === 'bulleted_list_item')
        .map(b => `<span class="pill">${plainText(b.bulleted_list_item.rich_text)}</span>`)
        .join('')}</div>`;
    } else if (hasTable) {
      inner = sec.items.map(b => {
        if (b.type === 'table' && b._rows) {
          const skip = b.has_column_header ? 1 : 0;
          return renderExpTable(b._rows.slice(skip));
        }
        if (b.type === 'paragraph' && b.paragraph.rich_text.length) {
          return `<div class="exp-sub">${rt(b.paragraph.rich_text)}</div>`;
        }
        return '';
      }).filter(Boolean).join('\n');
    } else if (hasExp) {
      inner = sec.items
        .filter(b => b.type === 'paragraph' && b.paragraph.rich_text.length)
        .map(b => isExpRow(b) ? renderExpRow(b) : `<div class="exp-sub">${rt(b.paragraph.rich_text)}</div>`)
        .join('\n');
    } else {
      inner = sec.items
        .filter(b => b.type === 'paragraph' && b.paragraph.rich_text.length)
        .map(b => `<p class="edu-line">${rt(b.paragraph.rich_text)}</p>`)
        .join('\n');
    }
    return inner ? `<section class="about-sec">
      <span class="section-label">${sec.label}</span>
      ${inner}
    </section>` : '';
  }).join('\n');

  return wrap('about', 'About — Avigail Bahat', `
  <main class="about-main">
    <div class="about-shell">
      <section class="about-hero">
        <div class="about-text">
          <h1>${heroH1}</h1>
          <p class="body-large">${heroSub}</p>
        </div>
      </section>
      ${sectionsHtml}
    </div>
  </main>`, projects);
}

async function contactPage(blocks, projects) {
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
  <main class="contact-main">
    <div class="contact-shell">
      <h1>${heading}</h1>
      ${tagline ? `<p class="body-large">${tagline}</p>` : ''}
      <div class="avail-badge"><span class="avail-dot"></span>Available for new roles</div>
      ${contactRowsHtml ? `<div class="contact-rows">${contactRowsHtml}</div>` : ''}
      ${recruiterNote ? `<div class="contact-note"><p>${recruiterNote}</p></div>` : ''}
    </div>
  </main>`, projects);
}

function designSystemPage(projects) {
  const swatches = [
    ['#0a0a0a','text-primary','Headings, body'],
    ['#767676','text-secondary','Body text, meta, labels'],
    ['#ffffff','bg-primary','Page background'],
    ['#f5f5f3','bg-secondary','Cards, callouts, hover'],
    ['#e8e8e8','border-tertiary','Dividers, image borders'],
    ['#d0d0d0','border-secondary','Card borders'],
    ['#b0b0b0','border-primary','Callout accent, pill border'],
    ['#1D9E75','available-green','Availability dot only'],
  ];

  const typeScale = [
    ['Hero h1','font-size:42px;font-weight:500;letter-spacing:-0.02em;line-height:1.1','42px / 500 / -0.02em'],
    ['Strip title','font-size:22px;font-weight:500;letter-spacing:-0.02em','22px / 500 / -0.02em'],
    ['Row title','font-size:17px;font-weight:400;color:var(--text-secondary)','17px / 400 / secondary'],
    ['Body','font-size:14px;font-weight:400;color:var(--text-secondary);line-height:1.65','14px / 400 / lh 1.65'],
    ['Small','font-size:13px;font-weight:400;color:var(--text-secondary);line-height:1.65','13px / 400 / lh 1.65'],
    ['Caption / meta','font-size:12px;font-weight:400;color:var(--text-secondary)','12px / 400 / secondary'],
    ['Section label','font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-secondary)','12px / 500 / uppercase / 0.08em'],
  ];

  const spacings = [
    ['16px','--pad-mob / Mobile padding'],
    ['40px','--pad-desk / Desktop padding'],
    ['80px','--hero-top / Hero top padding'],
    ['24px','Nav gap / component spacing'],
    ['48px','Section vertical gap'],
    ['80px','Footer margin-top'],
  ];

  const radii = [
    ['6px','--radius / All elements'],
  ];

  const swatchHtml = swatches.map(([hex, name, usage]) => {
    const textCol = ['#ffffff','#f5f5f3'].includes(hex) ? '#0a0a0a' : '#ffffff';
    return `<div class="swatch-item">
        <div class="swatch-color" style="background:${hex};"></div>
        <div class="swatch-info">
          <span class="swatch-hex">${hex}</span>
          <span class="swatch-name">${name}<br><span style="color:#bbb">${usage}</span></span>
        </div>
      </div>`;
  }).join('\n      ');

  const typeHtml = typeScale.map(([name, style, meta]) =>
    `<div class="type-row">
      <span style="${style}">${name}</span>
      <span class="type-meta">${meta}</span>
    </div>`
  ).join('\n    ');

  const spacingHtml = spacings.map(([val, label]) =>
    `<div class="spacing-row">
      <div class="spacing-bar" style="width:${val}"></div>
      <span class="spacing-lbl">${val} — ${label}</span>
    </div>`
  ).join('\n    ');

  const radiusHtml = radii.map(([val, label]) =>
    `<div class="radius-item">
      <div class="radius-box" style="border-radius:${val}"></div>
      <span class="radius-lbl">${val}<br><span style="color:#bbb;font-size:10px">${label}</span></span>
    </div>`
  ).join('\n    ');

  const featProj = projects.find(p => isFeatured(p.title)) || projects[0] || { title: 'Project Title', slug: '#', icon: '', year: '2024', excerpt: 'A short description of the project and what it involved.' };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Design System — Avigail Bahat</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body id="top">
  ${hdr('')}
  <main class="ds-main">
    <div class="ds-shell">
      <h1>Design System</h1>
      <p class="body-large">Living style guide — tokens, typography, and component reference.</p>

      <div class="ds-section">
        <h2>Typography Scale</h2>
        ${typeHtml}
      </div>

      <div class="ds-section">
        <h2>Colors</h2>
        <div class="swatch-grid">${swatchHtml}</div>
      </div>

      <div class="ds-section">
        <h2>Spacing</h2>
        <div class="spacing-rows">${spacingHtml}</div>
      </div>

      <div class="ds-section">
        <h2>Border Radius</h2>
        <div class="radius-grid">${radiusHtml}</div>
      </div>

      <div class="ds-section">
        <h2>Components</h2>

        <div class="component-wrap">
          <span class="component-label">Navigation — default</span>
          <div class="ds-hdr-preview">
            <span style="font-size:13px;font-weight:500">Avigail Bahat</span>
            <div style="display:flex;gap:24px;align-items:center">
              <span style="font-size:12px;color:var(--text-secondary)">Work</span>
              <span style="font-size:12px;color:var(--text-secondary)">About</span>
              <span style="font-size:12px;color:var(--text-secondary);border:0.5px solid var(--border-primary);border-radius:var(--radius);padding:5px 14px">Contact</span>
            </div>
          </div>
        </div>

        <div class="component-wrap">
          <span class="component-label">Navigation — active state (Work)</span>
          <div class="ds-hdr-preview">
            <span style="font-size:13px;font-weight:500">Avigail Bahat</span>
            <div style="display:flex;gap:24px;align-items:center">
              <span style="font-size:12px;color:var(--text-primary);position:relative">Work<span style="position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);width:3px;height:3px;border-radius:50%;background:var(--text-primary);display:block"></span></span>
              <span style="font-size:12px;color:var(--text-secondary)">About</span>
              <span style="font-size:12px;color:var(--text-secondary);border:0.5px solid var(--border-primary);border-radius:var(--radius);padding:5px 14px">Contact</span>
            </div>
          </div>
        </div>

        <div class="component-wrap">
          <span class="component-label">Type pills &amp; badges</span>
          <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
            <span class="type-pill">Product Design</span>
            <span class="type-pill">Research</span>
            <div class="avail-badge" style="margin:0"><span class="avail-dot"></span>Available for new roles</div>
            <span class="pill">Figma</span>
            <span class="pill">Cursor</span>
          </div>
        </div>

        <div class="component-wrap">
          <span class="component-label">Callout block</span>
          <div class="callout"><p><strong>The problem:</strong> Developers couldn't understand why their app was rejected without navigating to a separate admin page.</p></div>
        </div>

        <div class="component-wrap">
          <span class="component-label">Work row — default &amp; hover</span>
          <div class="rows-wrap" style="background:white;border-radius:8px;overflow:hidden">
            <div class="work-row" style="cursor:default">
              <span class="row-num">04</span>
              <span class="row-title">Developer Sale</span>
              <span class="row-yr">2023</span>
              <span class="type-pill">Product Design</span>
            </div>
            <div class="work-row" style="background:var(--bg-secondary);cursor:default">
              <span class="row-num">05</span>
              <span class="row-title" style="color:var(--text-primary)">Payouts Page</span>
              <span class="row-yr">2022</span>
              <span class="type-pill">Product Design</span>
            </div>
          </div>
        </div>

        <div class="component-wrap">
          <span class="component-label">Featured strip</span>
          <div class="ds-strip-preview">
            <div style="display:flex;flex-direction:column;gap:10px">
              <div style="display:flex;align-items:center;gap:12px">
                <span class="strip-num">01</span>
                <span class="strip-title">${featProj.title}</span>
                <span class="type-pill">Product Design</span>
              </div>
              <p class="strip-exc">${featProj.excerpt || 'A short description of the project.'}</p>
              <div class="strip-foot">
                <span class="strip-yr">${featProj.year}</span>
                <span class="strip-cta">View case study →</span>
              </div>
            </div>
            <div class="thumb-bg"></div>
          </div>
        </div>

        <div class="component-wrap">
          <span class="component-label">Stat strip</span>
          <div class="stat-strip" style="background:white">
            <div class="stat-col"><span class="stat-val">2024</span><span class="stat-lbl">Year</span></div>
            <div class="stat-col"><span class="stat-val">Product Design</span><span class="stat-lbl">Type</span></div>
            <div class="stat-col"><span class="stat-val">Lead Designer</span><span class="stat-lbl">Role</span></div>
          </div>
        </div>

        <div class="component-wrap">
          <span class="component-label">Metadata rows (sidebar)</span>
          <div style="max-width:148px;background:white;padding:0 12px;border-radius:8px">
            <div class="meta-row"><span class="meta-lbl">Year</span><span>2024</span></div>
            <div class="meta-row"><span class="meta-lbl">Type</span><span>Product Design</span></div>
            <div class="meta-row"><span class="meta-lbl">Role</span><span>Lead Designer</span></div>
          </div>
        </div>

      </div>
    </div>
  </main>
  ${ftr(projects)}
  ${JS}
</body>
</html>`;
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
    const contentHtml = toHtml(p.blocks);
    const title = stripEmoji(p.title);
    projects.push({ ...p, title, icon, year, slug: slugify(title), contentHtml, excerpt: excerpt(p.blocks) });
  }

  for (const proj of projects) {
    fs.writeFileSync(path.join(DIST, `${proj.slug}.html`), projectPage(proj, projects));
    stats.pages++;
    console.log(`  ✓ ${proj.slug}.html`);
  }

  console.log('Fetching about + contact pages from Notion...');
  const aboutBlocks   = await fetchBlocks(ABOUT_PAGE_ID);
  const contactBlocks = await fetchBlocks(CONTACT_PAGE_ID);

  for (const [file, html] of [
    ['index.html',         indexPage(projects)],
    ['about.html',         await aboutPage(aboutBlocks, projects)],
    ['contact.html',       await contactPage(contactBlocks, projects)],
    ['design-system.html', designSystemPage(projects)],
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
