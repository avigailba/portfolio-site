const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, 'dist');
const failures = [];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, files);
    else files.push(file);
  }
  return files;
}

function fail(file, message) {
  failures.push(`${path.relative(ROOT, file)}: ${message}`);
}

if (!fs.existsSync(ROOT)) {
  console.error('dist/ does not exist. Run npm run build first.');
  process.exit(1);
}

const htmlFiles = walk(ROOT).filter(file => file.endsWith('.html'));

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');

  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    let url = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|javascript:|#|\/_vercel\/)/.test(url)) continue;
    url = url.split(/[?#]/)[0];
    if (!url) continue;
    const target = url.startsWith('/')
      ? path.join(ROOT, url)
      : path.resolve(path.dirname(file), url);
    if (!fs.existsSync(target)) fail(file, `missing local reference ${match[1]}`);
  }

  if (/<img\b[^>]*\balt="[^"]*</.test(html)) {
    fail(file, 'image alt text contains HTML markup');
  }
  if (/<img\b[^>]*\bsrc=(["'])\s*\1/.test(html)) {
    fail(file, 'image has an empty src attribute');
  }

  const outsideFigures = html.replace(/<figure\b[\s\S]*?<\/figure>/g, '');
  if (/<figcaption\b/.test(outsideFigures)) {
    fail(file, 'figcaption is outside a figure');
  }

  for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      new Function(match[1]);
    } catch (error) {
      fail(file, `inline script syntax error: ${error.message}`);
    }
  }

  if (/<span class="ctx-tip"\b|class="ctx-tip"[^>]*\bdata-tip=/.test(html)) {
    fail(file, 'term tooltip is missing button semantics');
  }
  if (html.includes('class="ctx-tip"') &&
      (!/<button\b[^>]*class="ctx-tip"[^>]*aria-describedby=/.test(html) ||
       !/<span class="ctx-tip-pop"[^>]*role="tooltip">/.test(html))) {
    fail(file, 'term tooltip is missing its accessible relationship');
  }

  if (html.includes('id="lightbox"') &&
      (!/id="lightbox"[^>]*aria-label="Project image viewer"[^>]*aria-hidden="true"[^>]*inert/.test(html) ||
       /class="lb-img"[^>]*\bsrc=/.test(html))) {
    fail(file, 'lightbox is missing its closed accessible state');
  }

  if (process.env.VERCEL !== '1' && html.includes('/_vercel/insights/script.js')) {
    fail(file, 'Vercel analytics is included outside a Vercel build');
  }
}

const homepage = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const featuredAnchors = (homepage.match(/<a class="feat-card"/g) || []).length;
if (featuredAnchors !== 4 || /<div class="feat-card"/.test(homepage)) {
  fail(path.join(ROOT, 'index.html'), 'featured cards must be full anchor elements');
}
if (!/aria-controls="mob-panel" aria-expanded="false"/.test(homepage) ||
    !/id="mob-panel" aria-hidden="true" inert/.test(homepage)) {
  fail(path.join(ROOT, 'index.html'), 'mobile drawer is missing its closed accessibility state');
}

for (const stale of [
  'about-contact.html',
  'ai-credits.html',
  'app-collections-manager.html',
  'app-installations-page.html',
  'app-review-system.html',
]) {
  const file = path.join(ROOT, 'projects', stale);
  if (fs.existsSync(file)) fail(file, 'stale generated project page remains');
}

for (const asset of ['style.css', 'script.js']) {
  const source = fs.readFileSync(path.join(__dirname, asset));
  const generated = fs.readFileSync(path.join(ROOT, asset));
  if (!source.equals(generated)) fail(path.join(ROOT, asset), 'generated copy differs from source');
}

if (failures.length) {
  console.error(`Site validation failed with ${failures.length} issue(s):`);
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Site validation passed: ${htmlFiles.length} HTML files checked.`);
