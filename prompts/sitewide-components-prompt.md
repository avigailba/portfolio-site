# Sitewide components — apply to ALL pages

Replace the header and footer on every page (index.html, all project pages, about.html, contact.html) with the following. Remove the hue slider HTML, CSS, and JS entirely from every page.

---

## Header

### HTML
```html
<header id="site-header">
  <div class="header-inner">
    <div class="logo-wrap">
      <div class="logo-text">
        <a href="/index.html" class="logo-name">Avigail Bahat</a>
        <span class="logo-role">Senior UX Designer</span>
      </div>
      <div class="avail-dot-wrap">
        <span class="avail-dot"></span>
        <span class="avail-label">Available for work</span>
      </div>
    </div>
    <nav>
      <a href="/index.html">Home</a>
      <a href="/about.html">About</a>
      <a href="/contact.html">Contact</a>
    </nav>
  </div>
</header>
```

### CSS — remove all previous header/nav CSS and replace with:
```css
#site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  border-bottom: 0.5px solid transparent;
  transition: border-color 0.2s;
  padding: 0 32px;
}
#site-header.scrolled { border-color: #ebebeb; }

.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 32px;
  padding-bottom: 32px;
  transition: padding 0.3s ease;
}
#site-header.scrolled .header-inner {
  padding-top: 14px;
  padding-bottom: 14px;
}

.logo-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}
.logo-name {
  font-size: 13px;
  font-weight: 500;
  color: #0a0a0a;
  text-decoration: none;
  letter-spacing: 0.01em;
}
.logo-role {
  font-size: 11px;
  color: #999;
  max-height: 18px;
  opacity: 1;
  transition: max-height 0.3s ease, opacity 0.2s ease;
}
#site-header.scrolled .logo-role {
  max-height: 0;
  opacity: 0;
}

.avail-dot-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border: 0.5px solid #e8e8e8;
  border-radius: 20px;
  margin-left: 4px;
  max-height: 28px;
  opacity: 1;
  transition: max-height 0.3s ease, opacity 0.2s ease, margin 0.3s ease, padding 0.3s ease;
}
#site-header.scrolled .avail-dot-wrap {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-left: 0;
  overflow: hidden;
}
.avail-dot {
  width: 6px;
  height: 6px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  flex-shrink: 0;
}
.avail-label {
  font-size: 11px;
  color: #555;
  white-space: nowrap;
}

nav {
  display: flex;
  gap: 4px;
  align-items: center;
}
nav a {
  font-size: 12px;
  color: #767676;
  text-decoration: none;
  padding: 5px 10px;
  border-radius: 5px;
  transition: background 0.13s, color 0.13s;
}
nav a:hover { background: #0a0a0a; color: #fff; }
nav a.active { color: #0a0a0a; font-weight: 500; }
```

### JS — add to every page (after DOM ready):
```js
(function() {
  const hdr = document.getElementById('site-header');
  if (!hdr) return;
  window.addEventListener('scroll', function() {
    hdr.classList.toggle('scrolled', window.scrollY > 40);
  });
  // Mark active nav link
  const path = window.location.pathname;
  document.querySelectorAll('nav a').forEach(function(a) {
    if (a.getAttribute('href') && path.endsWith(a.getAttribute('href').replace('/', ''))) {
      a.classList.add('active');
    }
  });
})();
```

---

## Footer

### HTML
```html
<footer class="site-footer">
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
</footer>
```

### CSS — remove all previous footer CSS and replace with:
```css
.site-footer {
  background: #0a0a0a;
  padding: 64px 32px 48px;
  margin-top: 0;
}
.footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 48px;
}
.footer-left { flex: 1; }
.footer-statement {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
  max-width: 340px;
}
.footer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 20px;
  margin-bottom: 24px;
}
@keyframes ftag-pulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.85; }
}
.ftag {
  font-size: 12px;
  color: rgba(255,255,255,0.75);
  cursor: default;
  user-select: none;
  animation: ftag-pulse 3s ease-in-out infinite;
}
.footer-tagline {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
}
.footer-right {
  display: flex;
  flex-direction: column;
  padding-top: 6px;
  flex-shrink: 0;
  min-width: 220px;
}
.footer-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  font-size: 14px;
  color: rgba(255,255,255,0.65);
  text-decoration: none;
  padding: 12px 0;
  border-bottom: 0.5px solid rgba(255,255,255,0.1);
  transition: color 0.15s;
}
.footer-link:first-child { border-top: 0.5px solid rgba(255,255,255,0.1); }
.footer-link:hover { color: #fff; }
.footer-arr { opacity: 0.5; font-size: 14px; }
.footer-bottom {
  margin: 48px 0 0;
  font-size: 12px;
  color: rgba(255,255,255,0.3);
}
```

### JS — add once per page (after DOM ready):
```js
(function() {
  document.querySelectorAll('.ftag').forEach(function(tag) {
    var duration = 2.5 + Math.random() * 2;
    tag.style.animationDuration = duration + 's';
    tag.style.animationDelay = -(Math.random() * duration) + 's';
  });
})();
```

---

## Global CSS tokens — ensure these are present on every page:
```css
:root {
  --ac: #0a0a0a;
  --border: #ebebeb;
}

* { box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  background: #fff;
  color: #0a0a0a;
  margin: 0;
  -webkit-font-smoothing: antialiased;
}
```
