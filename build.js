require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const ROOT_PAGE_ID = '9e31791fdedf4048bb784d0cbae06e51';
const DIST_DIR = 'dist';

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchAllBlocks(pageId) {
  const blocks = [];
  let cursor;
  do {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...res.results);
    cursor = res.next_cursor;
  } while (cursor);
  return blocks;
}

// Recursively collect leaf project pages (pages without child_page children)
async function collectProjectPages(pageId) {
  const blocks = await fetchAllBlocks(pageId);
  const childPages = blocks.filter(b => b.type === 'child_page');

  const projects = [];
  for (const cp of childPages) {
    const subBlocks = await fetchAllBlocks(cp.id);
    const hasSubPages = subBlocks.some(b => b.type === 'child_page');

    if (hasSubPages) {
      // It's a subgroup (e.g. "More", "Even more") — recurse
      const sub = await collectProjectPages(cp.id);
      projects.push(...sub);
    } else {
      projects.push({ id: cp.id, title: cp.child_page.title, blocks: subBlocks });
    }
  }
  return projects;
}

function richTextToHtml(richText) {
  return richText
    .map(t => {
      let text = t.plain_text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      if (t.annotations.bold) text = `<strong>${text}</strong>`;
      if (t.annotations.italic) text = `<em>${text}</em>`;
      if (t.annotations.code) text = `<code>${text}</code>`;
      if (t.href) text = `<a href="${t.href}" target="_blank" rel="noopener">${text}</a>`;
      return text;
    })
    .join('');
}

function blocksToHtml(blocks) {
  let html = '';
  let inList = false;

  for (const block of blocks) {
    if (block.type !== 'bulleted_list_item' && inList) {
      html += '</ul>\n';
      inList = false;
    }

    switch (block.type) {
      case 'paragraph': {
        const text = richTextToHtml(block.paragraph.rich_text);
        if (text) html += `<p>${text}</p>\n`;
        break;
      }
      case 'heading_2': {
        const text = richTextToHtml(block.heading_2.rich_text);
        html += `<h2>${text}</h2>\n`;
        break;
      }
      case 'heading_3': {
        const text = richTextToHtml(block.heading_3.rich_text);
        html += `<h3>${text}</h3>\n`;
        break;
      }
      case 'bulleted_list_item': {
        if (!inList) { html += '<ul>\n'; inList = true; }
        const text = richTextToHtml(block.bulleted_list_item.rich_text);
        html += `  <li>${text}</li>\n`;
        break;
      }
      case 'image': {
        const url =
          block.image.type === 'external'
            ? block.image.external.url
            : block.image.file.url;
        const caption = block.image.caption?.length
          ? richTextToHtml(block.image.caption)
          : '';
        html += `<figure>\n  <img src="${url}" alt="${caption}" loading="lazy">\n`;
        if (caption) html += `  <figcaption>${caption}</figcaption>\n`;
        html += `</figure>\n`;
        break;
      }
      case 'divider': {
        html += '<hr>\n';
        break;
      }
    }
  }

  if (inList) html += '</ul>\n';
  return html;
}

function getExcerpt(blocks) {
  const para = blocks.find(
    b => b.type === 'paragraph' && b.paragraph.rich_text.length > 0
  );
  if (!para) return '';
  return para.paragraph.rich_text
    .map(t => t.plain_text)
    .join('')
    .slice(0, 200);
}

function projectPageHtml(title, icon, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <nav><a href="index.html">← Back</a></nav>
  <main class="project-page">
    <header class="project-header">
      ${icon ? `<span class="icon">${icon}</span>` : ''}
      <h1>${title}</h1>
    </header>
    <div class="project-content">
      ${content}
    </div>
  </main>
</body>
</html>`;
}

function indexPageHtml(cards) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="home">
    <header class="home-header">
      <h1>Portfolio</h1>
    </header>
    <div class="grid">
      ${cards.join('\n      ')}
    </div>
  </main>
</body>
</html>`;
}

async function build() {
  fs.mkdirSync(DIST_DIR, { recursive: true });
  fs.copyFileSync('styles.css', path.join(DIST_DIR, 'styles.css'));

  console.log('Fetching project pages...');
  const projects = await collectProjectPages(ROOT_PAGE_ID);
  console.log(`Found ${projects.length} projects`);

  const cards = [];

  for (const project of projects) {
    const page = await notion.pages.retrieve({ page_id: project.id });
    const icon = page.icon?.type === 'emoji' ? page.icon.emoji : '';
    const slug = slugify(project.title);
    const excerpt = getExcerpt(project.blocks);
    const content = blocksToHtml(project.blocks);

    fs.writeFileSync(
      path.join(DIST_DIR, `${slug}.html`),
      projectPageHtml(project.title, icon, content)
    );
    console.log(`  ✓ ${slug}.html`);

    cards.push(`<a href="${slug}.html" class="card">
        ${icon ? `<span class="card-icon">${icon}</span>` : ''}
        <h2 class="card-title">${project.title}</h2>
        ${excerpt ? `<p class="card-excerpt">${excerpt}</p>` : ''}
      </a>`);
  }

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexPageHtml(cards));
  console.log('  ✓ index.html');
  console.log(`\nDone! ${projects.length} pages in dist/`);
}

build().catch(err => {
  console.error(err.message);
  process.exit(1);
});
