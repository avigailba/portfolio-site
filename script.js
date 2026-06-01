// ── Header: scroll condense + active nav ────────────────────
(function() {
  var hdr = document.getElementById('site-header');
  if (!hdr) return;
  var inner = hdr.querySelector('.header-inner');
  var role  = hdr.querySelector('.logo-role');
  var dot   = hdr.querySelector('.avail-dot-wrap');
  var R = 110, OFFSET = 60;
  var ticking = false;
  function lerp(a, b, p) { return a + (b - a) * p; }
  function ease(p) { return 1 - Math.pow(1 - p, 3); }
  function update() {
    ticking = false;
    var raw = Math.min(Math.max((window.scrollY - OFFSET) / R, 0), 1);
    var p   = ease(raw);
    var fade = Math.min(raw * 2.2, 1);
    if (inner) { inner.style.paddingTop = lerp(32, 14, p) + 'px'; inner.style.paddingBottom = lerp(32, 14, p) + 'px'; }
    if (role)  { role.style.maxHeight = lerp(18, 0, p) + 'px'; role.style.opacity = 1 - fade; }
    if (dot)   { dot.style.maxHeight = lerp(28, 0, p) + 'px'; dot.style.opacity = 1 - fade; dot.style.paddingTop = lerp(4, 0, p) + 'px'; dot.style.paddingBottom = lerp(4, 0, p) + 'px'; dot.style.marginLeft = lerp(4, 0, p) + 'px'; }
    hdr.classList.toggle('scrolled', raw > 0.4);
  }
  window.addEventListener('scroll', function() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
  var path = window.location.pathname;
  document.querySelectorAll('nav a').forEach(function(a) {
    var href = a.getAttribute('href') || '';
    var page = href.replace(/^\.\.\//, '').replace(/^\//, '');
    if (page && path.endsWith(page)) a.classList.add('active');
    else if (!page || page === 'index.html') {
      if (path.endsWith('/') || path.endsWith('index.html')) a.classList.add('active');
    }
  });
})();

// ── Row accordion (homepage) ─────────────────────────────────
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

// ── Filter buttons (homepage) ────────────────────────────────
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

// ── Footer tag pulse animation ───────────────────────────────
(function() {
  document.querySelectorAll('.ftag').forEach(function(tag) {
    var duration = 2.5 + Math.random() * 2;
    tag.style.animationDuration = duration + 's';
    tag.style.animationDelay = -(Math.random() * duration) + 's';
  });
})();

// ── Lightbox (project pages) ─────────────────────────────────
(function() {
  var lb = document.getElementById('lightbox');
  if (!lb) return;
  var lbImg     = lb.querySelector('.lb-img');
  var lbCaption = lb.querySelector('.lb-caption');
  var lbClose   = lb.querySelector('.lb-close');
  var lbPrev    = lb.querySelector('.lb-prev');
  var lbNext    = lb.querySelector('.lb-next');
  var images = [], current = 0;
  var imgs = Array.from(document.querySelectorAll('.proj-content img'));
  imgs.forEach(function(img, i) {
    img.addEventListener('click', function() { open(i); });
  });
  images = imgs;
  function open(i) {
    current = i;
    lbImg.src = images[i].src;
    lbImg.alt = images[i].alt;
    lbCaption.textContent = images[i].alt || '';
    lbPrev.hidden = (i === 0);
    lbNext.hidden = (i === images.length - 1);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }
  lbClose.addEventListener('click', close);
  // Desktop: click bare overlay to close. Mobile: tap left/right half to navigate.
  lb.addEventListener('click', function(e) {
    if (lbClose.contains(e.target) || lbPrev.contains(e.target) || lbNext.contains(e.target)) return;
    if (window.innerWidth < 600) {
      if (e.clientX < window.innerWidth / 2) { if (current > 0) open(current - 1); }
      else { if (current < images.length - 1) open(current + 1); }
    } else {
      if (e.target === lb) close();
    }
  });
  lbPrev.addEventListener('click', function(e) { e.stopPropagation(); if (current > 0) open(current - 1); });
  lbNext.addEventListener('click', function(e) { e.stopPropagation(); if (current < images.length - 1) open(current + 1); });
  document.addEventListener('keydown', function(e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft'  && current > 0) open(current - 1);
    if (e.key === 'ArrowRight' && current < images.length - 1) open(current + 1);
  });
  // Touch swipe
  var touchStartX = 0;
  lb.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lb.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 40) return;
    if (dx < 0 && current < images.length - 1) open(current + 1);
    if (dx > 0 && current > 0) open(current - 1);
  }, { passive: true });
})();
