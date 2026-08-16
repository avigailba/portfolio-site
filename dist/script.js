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
function markFirstVisible() {
  var wraps = document.querySelectorAll('#all-list .row-wrap');
  var marked = false;
  wraps.forEach(function(wrap) {
    wrap.classList.remove('first-visible');
    if (!marked && !wrap.classList.contains('hidden')) {
      wrap.classList.add('first-visible');
      marked = true;
    }
  });
}
markFirstVisible();

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
    markFirstVisible();
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
    scrim.setAttribute('aria-hidden', 'false');
    panel.classList.add('open');
    panel.removeAttribute('inert');
    panel.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function() { closeBtn.focus(); });
  }
  function closeMenu(restoreFocus) {
    var wasOpen = panel.classList.contains('open');
    scrim.classList.remove('open');
    scrim.setAttribute('aria-hidden', 'true');
    panel.classList.remove('open');
    panel.setAttribute('inert', '');
    panel.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (restoreFocus !== false && wasOpen) btn.focus();
  }
  btn.addEventListener('click', openMenu);
  scrim.addEventListener('click', closeMenu);
  closeBtn.addEventListener('click', closeMenu);
  panel.querySelectorAll('.mob-panel-link').forEach(function(link) {
    link.addEventListener('click', function() { closeMenu(false); });
  });
  // Work link: on homepage scroll to section; on other pages navigate normally
  var workLink = panel.querySelector('.mob-work-link');
  if (workLink) {
    workLink.addEventListener('click', function(e) {
      var allwork = document.getElementById('home-allwork');
      if (allwork) {
        e.preventDefault();
        closeMenu(false);
        setTimeout(function() { allwork.scrollIntoView({ behavior: 'smooth' }); }, 50);
      }
    });
  }
  document.addEventListener('keydown', function(e) {
    if (!panel.classList.contains('open')) return;
    if (e.key === 'Escape') {
      closeMenu();
      return;
    }
    if (e.key === 'Tab') {
      var focusable = Array.from(panel.querySelectorAll('a[href], button:not([disabled])'));
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
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
  var EMOJIS = ['✨','💡','🎯','🔥','⚡','🌀','🎲','🌊'];
  var TRAIL_LEN    = 90;
  var TRAIL_TTL    = 650;
  var POP_DURATION = 360;

  var playFrame      = document.getElementById('playFrame');
  var heroWrap       = document.getElementById('heroWrap');
  var canvas         = document.getElementById('canvas');
  var ctx            = canvas.getContext('2d');
  var hud            = document.getElementById('hud');
  var frameHint      = document.getElementById('frameHint');
  var nextLabel      = document.getElementById('nextLabel');
  var resetBtn       = document.getElementById('resetBtn');
  var modeShapesBtn  = document.getElementById('modeShapes');
  var modeEmojisBtn  = document.getElementById('modeEmojis');

  var shapes        = [];
  var edges         = [];
  var trail         = [];
  var mouse         = { x: -999, y: -999 };
  var shapeIdx      = 0;
  var emojiIdx      = 0;
  var mode          = 'shapes';
  var interacted    = false;
  var selectedShape = -1;
  var hoveredShape  = -1;

  function resize() {
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  resize();
  new ResizeObserver(resize).observe(playFrame);

  heroWrap.addEventListener('mousemove', function(e) {
    var r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    trail.push({ x: mouse.x, y: mouse.y, t: performance.now() });
    if (trail.length > TRAIL_LEN) trail.shift();
    if (!interacted) {
      interacted = true;
      frameHint.classList.add('hidden');
      hud.classList.add('visible');
    }
  });

  heroWrap.addEventListener('mouseleave', function() {
    mouse.x = -999;
    mouse.y = -999;
    trail   = [];
  });

  heroWrap.addEventListener('click', function(e) {
    if (e.target === resetBtn) return;
    var r = canvas.getBoundingClientRect();
    var cx = e.clientX - r.left;
    var cy = e.clientY - r.top;
    var hit = shapeAt(cx, cy);
    if (hit >= 0) {
      // Clicking an existing shape: if one is already selected, draw an edge to this one
      if (selectedShape >= 0 && hit !== selectedShape) {
        edges.push({ from: selectedShape, to: hit });
        trail = [{ x: shapes[hit].x, y: shapes[hit].y, t: performance.now() }];
      }
      selectedShape = hit;
    } else {
      placeShape(cx, cy);
    }
    if (!playFrame.classList.contains('active')) playFrame.classList.add('active');
  });

  resetBtn.addEventListener('click', function() {
    shapes        = [];
    edges         = [];
    trail         = [];
    shapeIdx      = 0;
    emojiIdx      = 0;
    interacted    = false;
    selectedShape = -1;
    hoveredShape  = -1;
    playFrame.classList.remove('active');
    frameHint.classList.remove('hidden');
    hud.classList.remove('visible');
    updateHUD();
  });

  if (modeShapesBtn) modeShapesBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    mode = 'shapes';
    modeShapesBtn.classList.add('active');
    if (modeEmojisBtn) modeEmojisBtn.classList.remove('active');
    updateHUD();
  });

  if (modeEmojisBtn) modeEmojisBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    mode = 'emojis';
    modeEmojisBtn.classList.add('active');
    if (modeShapesBtn) modeShapesBtn.classList.remove('active');
    updateHUD();
  });

  function shapeAt(cx, cy) {
    var HIT = 52;
    for (var i = shapes.length - 1; i >= 0; i--) {
      if (Math.abs(cx - shapes[i].x) < HIT && Math.abs(cy - shapes[i].y) < HIT) return i;
    }
    return -1;
  }

  function placeShape(x, y) {
    var newIdx = shapes.length;
    var now    = performance.now();
    if (mode === 'emojis') {
      shapes.push({ x: x, y: y, type: 'emoji', emoji: EMOJIS[emojiIdx % EMOJIS.length], color: '#888', born: now });
      emojiIdx++;
    } else {
      var def = SHAPES[shapeIdx % SHAPES.length];
      shapes.push({ x: x, y: y, type: def.type, color: def.color, born: now });
      shapeIdx++;
    }
    if (selectedShape >= 0) edges.push({ from: selectedShape, to: newIdx });
    selectedShape = newIdx;
    trail = [{ x: x, y: y, t: now }];
    updateHUD();
  }

  function updateHUD() {
    nextLabel.textContent = mode === 'emojis'
      ? EMOJIS[emojiIdx % EMOJIS.length]
      : SHAPES[shapeIdx % SHAPES.length].label;
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

  function edgePoint(s, tx, ty) {
    var dx = tx - s.x, dy = ty - s.y;
    if (dx === 0 && dy === 0) return { x: s.x, y: s.y };
    var t;
    switch (s.type) {
      case 'emoji':
        t = 16 / Math.sqrt(dx * dx + dy * dy);
        break;
      case 'circle':
        t = 28 / Math.sqrt(dx * dx + dy * dy);
        break;
      case 'diamond':
        t = 1 / (Math.abs(dx) / 46 + Math.abs(dy) / 30);
        break;
      case 'parallelogram':
        t = Math.abs(dx) * 22 > Math.abs(dy) * 46
          ? 46 / Math.abs(dx) : 22 / Math.abs(dy);
        break;
      default: // rect, rounded
        t = Math.abs(dx) * 22 > Math.abs(dy) * 40
          ? 40 / Math.abs(dx) : 22 / Math.abs(dy);
    }
    return { x: s.x + dx * t, y: s.y + dy * t };
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

  function drawShape(s, scale, alpha, opts) {
    var x = s.x, y = s.y, type = s.type, color = s.color;
    opts = opts || {};
    if (type === 'emoji') {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.emoji, 0, 0);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth   = opts.lineWidth  || 0.75;
    ctx.fillStyle   = hexToRgba(color, opts.fillAlpha || 0.07);
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

  function drawHighlight(s, hlMode) {
    if (hlMode === 'hover') {
      if (s.type === 'emoji') {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.globalAlpha = 0.9;
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.emoji, 0, 0);
        ctx.restore();
      } else {
        drawShape(s, 1, 0.85, { lineWidth: 1.5, fillAlpha: 0.22 });
      }
    } else {
      ctx.save();
      ctx.strokeStyle = s.color;
      ctx.lineWidth   = 2;
      ctx.globalAlpha = 0.75;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawCursor(now) {
    if (mouse.x < 0) return;
    var pulse = 0.5 + 0.5 * Math.sin(now / 300);
    if (hoveredShape < 0) {
      if (mode === 'emojis') {
        ctx.save();
        ctx.globalAlpha = 0.25 + 0.1 * pulse;
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(EMOJIS[emojiIdx % EMOJIS.length], mouse.x, mouse.y);
        ctx.restore();
      } else {
        var def = SHAPES[shapeIdx % SHAPES.length];
        drawShape({ x: mouse.x, y: mouse.y, type: def.type, color: def.color }, 0.55, 0.13);
      }
      ctx.save();
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth   = 1;
      ctx.globalAlpha = 0.15 + 0.08 * pulse;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 18 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (shapes.length === 0) {
      ctx.save();
      ctx.font = '500 11px Inter, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.globalAlpha = 0.7 + 0.3 * pulse;
      ctx.fillText('Click to start', mouse.x + 24, mouse.y + 5);
      ctx.restore();
    }
  }

  function frame(now) {
    hoveredShape = (mouse.x < 0) ? -1 : shapeAt(mouse.x, mouse.y);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    // Draw all edges (border to border)
    edges.forEach(function(edge) {
      var a = shapes[edge.from], b = shapes[edge.to];
      if (a && b) {
        var ep1 = edgePoint(a, b.x, b.y);
        var ep2 = edgePoint(b, a.x, a.y);
        drawConnector(ep1.x, ep1.y, ep2.x, ep2.y, a.color, false);
      }
    });
    // Dashed preview from selected shape border to cursor
    if (selectedShape >= 0 && mouse.x > 0 && hoveredShape < 0) {
      var sel = shapes[selectedShape];
      var ep  = edgePoint(sel, mouse.x, mouse.y);
      drawConnector(ep.x, ep.y, mouse.x, mouse.y, sel.color, true);
    }
    drawTrail(now);
    shapes.forEach(function(s, i) {
      var age   = (now - s.born) / POP_DURATION;
      var scale = age < 1 ? easeOutBack(Math.min(age, 1)) : 1;
      var baseAlpha = (i === selectedShape) ? Math.min(0.45, age * 1.2) : Math.min(1, age * 2.5);
      drawShape(s, scale, baseAlpha);
      if (i === hoveredShape && i !== selectedShape) drawHighlight(s, 'hover');
    });
    drawCursor(now);
    requestAnimationFrame(frame);
  }

  updateHUD();
  requestAnimationFrame(frame);
})();
}

// ── Inline term tooltips ─────────────────────────────────────
(function() {
  var tips = Array.from(document.querySelectorAll('.ctx-tip'));
  if (!tips.length) return;

  function closeAll(except) {
    tips.forEach(function(tip) {
      if (tip === except) return;
      tip.classList.remove('open');
      tip.setAttribute('aria-expanded', 'false');
    });
  }

  function align(tip) {
    var pop = tip.querySelector('.ctx-tip-pop');
    if (!pop) return;
    pop.style.setProperty('--tip-shift', '0px');
    requestAnimationFrame(function() {
      var rect = pop.getBoundingClientRect();
      var shift = 0;
      if (rect.left < 12) shift = 12 - rect.left;
      else if (rect.right > window.innerWidth - 12) shift = window.innerWidth - 12 - rect.right;
      pop.style.setProperty('--tip-shift', shift + 'px');
    });
  }

  tips.forEach(function(tip) {
    tip.addEventListener('focus', function() {
      closeAll(tip);
      align(tip);
    });
    tip.addEventListener('blur', function() {
      tip.classList.remove('open');
      tip.setAttribute('aria-expanded', 'false');
    });
    tip.addEventListener('click', function(e) {
      e.stopPropagation();
      var willOpen = !tip.classList.contains('open');
      closeAll(tip);
      tip.classList.toggle('open', willOpen);
      tip.setAttribute('aria-expanded', String(willOpen));
      if (willOpen) align(tip);
    });
    tip.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        tip.classList.remove('open');
        tip.setAttribute('aria-expanded', 'false');
        tip.blur();
      }
    });
  });

  document.addEventListener('click', function() { closeAll(); });
  window.addEventListener('resize', function() { closeAll(); }, { passive: true });
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
  var lastTrigger = null;
  var previousBodyOverflow = '';
  var imgs = Array.from(document.querySelectorAll('.proj-content img'));
  imgs.forEach(function(img, i) {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-haspopup', 'dialog');
    img.setAttribute('aria-label', 'Open image' + (img.alt ? ': ' + img.alt : ''));
    img.addEventListener('click', function() { open(i, img); });
    img.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      open(i, img);
    });
  });
  images = imgs;
  function open(i, trigger) {
    var isOpening = !lb.classList.contains('open');
    if (trigger) lastTrigger = trigger;
    current = i;
    lbImg.src = images[i].src;
    lbImg.alt = images[i].alt;
    lbCaption.textContent = images[i].alt || '';
    lbPrev.hidden = (i === 0);
    lbNext.hidden = (i === images.length - 1);
    lb.removeAttribute('inert');
    lb.setAttribute('aria-hidden', 'false');
    lb.classList.add('open');
    if (isOpening) previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (isOpening) lbClose.focus();
  }
  function close() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    lb.setAttribute('inert', '');
    lbImg.removeAttribute('src');
    lbImg.alt = '';
    lbCaption.textContent = '';
    document.body.style.overflow = previousBodyOverflow;
    if (lastTrigger) lastTrigger.focus();
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
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowLeft'  && current > 0) open(current - 1);
    if (e.key === 'ArrowRight' && current < images.length - 1) open(current + 1);
    if (e.key === 'Tab') {
      var focusable = [lbClose, lbPrev, lbNext].filter(function(el) { return !el.hidden; });
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
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
