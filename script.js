// ── Header: scroll condense + active nav ────────────────────
(function() {
  var hdr = document.getElementById('site-header');
  if (!hdr) return;
  var ticking = false;
  function update() {
    ticking = false;
    hdr.classList.toggle('scrolled', window.scrollY > 24);
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
  var list = document.getElementById('all-list');
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
    var f = btn.dataset.filter;
    document.querySelectorAll('#all-list .row-wrap').forEach(function(wrap) {
      var cats = (wrap.dataset.cat || '').split(' ');
      if (f === 'all' || cats.indexOf(f) !== -1) {
        wrap.classList.remove('hidden');
      } else {
        wrap.classList.add('hidden');
      }
    });
    var i = 1;
    document.querySelectorAll('#all-list .row-wrap:not(.hidden) .num').forEach(function(n) {
      n.textContent = String(i++).padStart(2, '0');
    });
    var CAT_LABELS = { developer: 'Developer tools', monetisation: 'Monetisation', internal: 'Internal tools', cms: 'CMS' };
    document.querySelectorAll('#all-list .row-wrap:not(.hidden) .cat-tag[data-cats]').forEach(function(tag) {
      if (f === 'all') {
        tag.textContent = tag.dataset.display || tag.textContent;
      } else {
        tag.textContent = CAT_LABELS[f] || f;
      }
    });
  });
});

// ── Mobile hamburger menu ────────────────────────────────────
(function() {
  var btn = document.getElementById('open-menu');
  var scrim = document.getElementById('mob-scrim');
  var panel = document.getElementById('mob-panel');
  var closeBtn = document.getElementById('mob-panel-close');
  if (!btn || !panel) return;
  function openMenu() {
    scrim.classList.add('open');
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    scrim.classList.remove('open');
    panel.classList.remove('open');
    document.body.style.overflow = '';
  }
  btn.addEventListener('click', openMenu);
  scrim.addEventListener('click', closeMenu);
  closeBtn.addEventListener('click', closeMenu);
  panel.querySelectorAll('.mob-panel-link').forEach(function(link) {
    link.addEventListener('click', closeMenu);
  });
  // Work link: on homepage scroll to section; on other pages navigate normally
  var workLink = panel.querySelector('.mob-work-link');
  if (workLink) {
    workLink.addEventListener('click', function(e) {
      var allwork = document.getElementById('home-allwork');
      if (allwork) {
        e.preventDefault();
        closeMenu();
        setTimeout(function() { allwork.scrollIntoView({ behavior: 'smooth' }); }, 50);
      }
    });
  }
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeMenu();
  });
})();

// ── Mobile filter dropdown ───────────────────────────────────
(function() {
  var filterBtn = document.getElementById('mob-filter-btn');
  var filterDrop = document.getElementById('mob-filter-drop');
  if (!filterBtn || !filterDrop) return;
  filterBtn.addEventListener('click', function() {
    var open = filterDrop.classList.toggle('open');
    filterBtn.classList.toggle('open', open);
  });
  filterDrop.querySelectorAll('.mob-filter-opt').forEach(function(opt) {
    opt.addEventListener('click', function() {
      var f = opt.dataset.filter;
      // Sync with desktop filter to reuse its filtering logic
      var desktopBtn = document.querySelector('.filter-btn[data-filter="' + f + '"]');
      if (desktopBtn) desktopBtn.click();
      // Update mobile button label and active state
      filterDrop.querySelectorAll('.mob-filter-opt').forEach(function(o) { o.classList.remove('active'); });
      opt.classList.add('active');
      var labelNode = filterBtn.childNodes[0];
      if (labelNode) labelNode.textContent = opt.textContent.replace('✓', '').trim() + ' ';
      filterBtn.classList.remove('open');
      filterDrop.classList.remove('open');
    });
  });
  document.addEventListener('click', function(e) {
    if (!filterBtn.contains(e.target) && !filterDrop.contains(e.target)) {
      filterBtn.classList.remove('open');
      filterDrop.classList.remove('open');
    }
  });
})();

// ── Footer tag pulse animation ───────────────────────────────
(function() {
  document.querySelectorAll('.ftag').forEach(function(tag) {
    var duration = 2.5 + Math.random() * 2;
    tag.style.animationDuration = duration + 's';
    tag.style.animationDelay = -(Math.random() * duration) + 's';
  });
})();

// ── Hero flowchart canvas (homepage only) ────────────────────
if (document.getElementById('playFrame')) {
(function() {
  var SHAPES = [
    { type: 'rect',          label: 'Process',   color: '#a0aec0' },
    { type: 'diamond',       label: 'Decision',  color: '#b0a89a' },
    { type: 'circle',        label: 'Start/End', color: '#9ab5a8' },
    { type: 'parallelogram', label: 'I / O',     color: '#a99ab5' },
    { type: 'rounded',       label: 'Action',    color: '#b5a09a' },
  ];
  var TRAIL_LEN    = 90;
  var TRAIL_TTL    = 650;
  var POP_DURATION = 360;

  var playFrame = document.getElementById('playFrame');
  var canvas    = document.getElementById('canvas');
  var ctx       = canvas.getContext('2d');
  var heroText  = document.getElementById('heroText');
  var hud       = document.getElementById('hud');
  var frameHint = document.getElementById('frameHint');
  var nextLabel = document.getElementById('nextLabel');
  var resetBtn  = document.getElementById('resetBtn');

  var shapes     = [];
  var trail      = [];
  var mouse      = { x: -999, y: -999 };
  var shapeIdx   = 0;
  var interacted = false;

  function resize() {
    canvas.width  = playFrame.clientWidth;
    canvas.height = playFrame.clientHeight;
  }
  resize();
  new ResizeObserver(resize).observe(playFrame);

  playFrame.addEventListener('mousemove', function(e) {
    var r = playFrame.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    trail.push({ x: mouse.x, y: mouse.y, t: performance.now() });
    if (trail.length > TRAIL_LEN) trail.shift();
    if (!interacted) {
      interacted = true;
      heroText.style.opacity = '0.1';
      frameHint.classList.add('hidden');
      hud.classList.add('visible');
    }
  });

  playFrame.addEventListener('mouseleave', function() {
    mouse.x = -999;
    mouse.y = -999;
    trail   = [];
  });

  playFrame.addEventListener('click', function(e) {
    if (e.target === resetBtn) return;
    var r = playFrame.getBoundingClientRect();
    placeShape(e.clientX - r.left, e.clientY - r.top);
  });

  resetBtn.addEventListener('click', function() {
    shapes     = [];
    trail      = [];
    shapeIdx   = 0;
    interacted = false;
    heroText.style.opacity = '1';
    frameHint.classList.remove('hidden');
    hud.classList.remove('visible');
    updateHUD();
  });

  function placeShape(x, y) {
    var def = SHAPES[shapeIdx % SHAPES.length];
    shapes.push({ x: x, y: y, type: def.type, color: def.color, born: performance.now() });
    shapeIdx++;
    trail = [{ x: x, y: y, t: performance.now() }];
    updateHUD();
  }

  function updateHUD() {
    nextLabel.textContent = SHAPES[shapeIdx % SHAPES.length].label;
  }

  function easeOutBack(t) {
    var c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function drawGrid() {
    var gap = 26;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (var x = gap; x < canvas.width; x += gap) {
      for (var y = gap; y < canvas.height; y += gap) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawArrowhead(x, y, angle, color, alpha) {
    var sz = 8;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-sz, -sz * 0.45);
    ctx.lineTo(-sz * 0.6, 0);
    ctx.lineTo(-sz, sz * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawConnector(x1, y1, x2, y2, color, dashed) {
    var alpha = dashed ? 0.18 : 0.42;
    var cx1 = x1 + (x2 - x1) * 0.5;
    var cy1 = y1;
    var cx2 = x1 + (x2 - x1) * 0.5;
    var cy2 = y2;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = dashed ? 1 : 1.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.globalAlpha = alpha;
    if (dashed) {
      ctx.setLineDash([6, 5]);
      ctx.lineDashOffset = -(performance.now() / 40);
    }
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
    ctx.stroke();
    if (!dashed) {
      ctx.setLineDash([]);
      var angle = Math.atan2(y2 - cy2, x2 - cx2);
      drawArrowhead(x2, y2, angle, color, 0.42);
    }
    ctx.restore();
  }

  function hexToRgba(hex, a) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function drawShape(s, scale, alpha) {
    var x = s.x, y = s.y, type = s.type, color = s.color;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth   = 0.75;
    ctx.fillStyle   = hexToRgba(color, 0.07);
    ctx.beginPath();
    switch (type) {
      case 'rect':
        ctx.rect(-40, -22, 80, 44);
        break;
      case 'diamond':
        ctx.moveTo(0, -30);
        ctx.lineTo(46, 0);
        ctx.lineTo(0, 30);
        ctx.lineTo(-46, 0);
        ctx.closePath();
        break;
      case 'circle':
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        break;
      case 'parallelogram':
        ctx.moveTo(-28, -22);
        ctx.lineTo(46, -22);
        ctx.lineTo(28, 22);
        ctx.lineTo(-46, 22);
        ctx.closePath();
        break;
      case 'rounded':
        roundRect(ctx, -40, -22, 80, 44, 22);
        break;
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawTrail(now) {
    var live = trail.filter(function(p) { return now - p.t < TRAIL_TTL; });
    if (live.length < 3) return;
    ctx.save();
    ctx.strokeStyle = '#555';
    ctx.lineWidth   = 1;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -(now / 40);
    for (var i = 1; i < live.length - 1; i++) {
      var p0 = live[Math.max(0, i - 1)];
      var p1 = live[i];
      var p2 = live[i + 1];
      var p3 = live[Math.min(live.length - 1, i + 2)];
      var cp1x = p1.x + (p2.x - p0.x) / 6;
      var cp1y = p1.y + (p2.y - p0.y) / 6;
      var cp2x = p2.x - (p3.x - p1.x) / 6;
      var cp2y = p2.y - (p3.y - p1.y) / 6;
      var progress = i / live.length;
      var ageFade  = 1 - (now - p1.t) / TRAIL_TTL;
      ctx.globalAlpha = progress * ageFade * 0.28;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      ctx.stroke();
    }
    var a = live[live.length - 2];
    var b = live[live.length - 1];
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.18;
    drawArrowhead(b.x, b.y, Math.atan2(b.y - a.y, b.x - a.x), '#555', 0.18);
    ctx.restore();
  }

  function drawCursor(now) {
    if (mouse.x < 0) return;
    var def   = SHAPES[shapeIdx % SHAPES.length];
    var pulse = 0.5 + 0.5 * Math.sin(now / 300);
    drawShape({ x: mouse.x, y: mouse.y, type: def.type, color: def.color }, 0.55, 0.13);
    ctx.save();
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth   = 1;
    ctx.globalAlpha = 0.15 + 0.08 * pulse;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 18 + pulse * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function frame(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    for (var i = 1; i < shapes.length; i++) {
      var a = shapes[i - 1], b = shapes[i];
      drawConnector(a.x, a.y, b.x, b.y, a.color, false);
    }
    if (shapes.length > 0 && mouse.x > 0) {
      var last = shapes[shapes.length - 1];
      drawConnector(last.x, last.y, mouse.x, mouse.y, last.color, true);
    }
    drawTrail(now);
    shapes.forEach(function(s) {
      var age   = (now - s.born) / POP_DURATION;
      var scale = age < 1 ? easeOutBack(Math.min(age, 1)) : 1;
      drawShape(s, scale, Math.min(1, age * 2.5));
    });
    drawCursor(now);
    requestAnimationFrame(frame);
  }

  updateHUD();
  requestAnimationFrame(frame);
})();
}

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
