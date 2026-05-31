# Inner pages layout — About, Contact

Apply the sitewide header and footer from `sitewide-components-prompt.md` to all inner pages. The content area for all inner pages uses a single centered column.

---

## Shared inner page structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PAGE TITLE — Avigail Bahat</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  [HEADER]
  <main class="inner-main">
    <div class="inner-content">
      [PAGE CONTENT]
    </div>
  </main>
  [FOOTER]
  <script src="/script.js"></script>
</body>
</html>
```

### Shared inner page CSS
```css
.inner-main {
  padding: 0 32px;
}
.inner-content {
  max-width: 640px;
  margin: 0 auto;
  padding: 56px 0 80px;
}
.inner-content h1 {
  font-size: 32px;
  font-weight: 700;
  color: #0a0a0a;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin-bottom: 8px;
}
.inner-content .page-sub {
  font-size: 14px;
  color: #888;
  margin-bottom: 48px;
}
.section-label {
  font-size: 11px;
  color: #888;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  margin-bottom: 16px;
  margin-top: 48px;
}
.section-label:first-of-type { margin-top: 0; }
```

---

## About page (about.html) — merged About + CV

```html
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
```

### About + CV CSS
```css
.about-bio {
  font-size: 18px;
  font-weight: 500;
  color: #0a0a0a;
  line-height: 1.5;
  letter-spacing: -0.01em;
  margin-bottom: 40px;
  max-width: 560px;
}
.about-body {
  font-size: 15px;
  color: #444;
  line-height: 1.7;
  margin-bottom: 0;
}
.about-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}
.about-link {
  font-size: 14px;
  color: #0a0a0a;
  text-decoration: none;
  font-weight: 500;
}
.about-link:hover { text-decoration: underline; }

.cv-role { margin-bottom: 32px; }
.cv-role-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}
.cv-title { font-size: 14px; font-weight: 600; color: #0a0a0a; }
.cv-years { font-size: 12px; color: #888; }
.cv-company { font-size: 13px; color: #888; margin-bottom: 8px; }
.cv-desc { font-size: 13px; color: #555; line-height: 1.65; }

.cv-projects { margin-bottom: 4px; }
.cv-proj-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 7px 0;
  border-bottom: 0.5px solid #ebebeb;
  font-size: 13px;
}
.cv-proj-row:first-child { border-top: 0.5px solid #ebebeb; }
.cv-proj-name { color: #0a0a0a; }
.cv-proj-year { color: #888; }

.cv-skills {
  font-size: 13px;
  color: #555;
  line-height: 1.8;
}
```

---

## Contact page (contact.html)

```html
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
```

### Contact-specific CSS
```css
.contact-intro {
  font-size: 16px;
  color: #444;
  line-height: 1.65;
  max-width: 480px;
  margin-bottom: 48px;
}
.contact-links { display: flex; flex-direction: column; margin-bottom: 40px; }
.contact-link {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 14px 0;
  border-bottom: 0.5px solid #ebebeb;
  text-decoration: none;
  transition: background 0.13s, padding 0.13s;
}
.contact-link:first-child { border-top: 0.5px solid #ebebeb; }
.contact-link:hover { background: #0a0a0a; padding-left: 10px; padding-right: 10px; border-color: #0a0a0a; }
.contact-link:hover .contact-link-label,
.contact-link:hover .contact-link-val { color: #fff; }
.contact-link-label { font-size: 12px; color: #888; min-width: 80px; transition: color 0.13s; }
.contact-link-val { font-size: 14px; font-weight: 500; color: #0a0a0a; transition: color 0.13s; }
.contact-arr { opacity: 0.5; }
.contact-location { font-size: 12px; color: #888; }
```
