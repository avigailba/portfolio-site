/* Homepage live covers (desktop): a tilted grid of cards cut from the project's Figma screens,
   like the AI Credits wallet grid. The grid is still at rest and drifts while its row is hovered.
   Mount point: <div class="hg" data-hp-grid="installs|review"></div> inside the row's .hp-cover. */
(function () {
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');

  // Columns of card images. Every card has the same width, so the columns line up.
  // A column that starts with WIDE holds wide cards that span three columns (the Installations table)
  var CARD_W = 300, GAP = 28; // grid units
  var WIDE = 'wide';
  var GRIDS = {
    installs: [
      ['ih-filters.jpg', 'ih-toast.jpg', 'ih-export.jpg'],
      ['ih-columns.jpg', 'ih-export.jpg'],
      [WIDE, 'ih-table.jpg'],
      ['ih-export.jpg', 'ih-toast.jpg', 'ih-filters.jpg'],
      ['ih-toast.jpg', 'ih-columns.jpg']
    ],
    review: [
      ['rh-addcomment.jpg', 'rh-publish1.jpg', 'rh-addtoreport.jpg'],
      ['rh-finish.jpg', 'rh-publish3.jpg'],
      [WIDE, 'rh-report.jpg', 'rh-previous.jpg'],
      ['rh-publish1.jpg', 'rh-addtoreport.jpg', 'rh-addcomment.jpg'],
      ['rh-publish3.jpg', 'rh-finish.jpg']
    ]
  };
  var SPEEDS = [26, 20, 30, 23]; // grid units per second, one per column

  function init(root) {
    var cols = GRIDS[root.dataset.hpGrid];
    if (!cols) return;
    root.innerHTML = '<div class="hg-grid">' + cols.map(function (col, i) {
      var w = col[0] === WIDE ? CARD_W * 3 + GAP * 2 : CARD_W;
      var cards = col.filter(function (c) { return c !== WIDE; }).map(function (c) { return '<div class="hg-cell"><img class="hg-card" src="' + BASE + c + '" alt="" style="width:' + w + 'px"></div>'; }).join('');
      // Three copies: the column always covers the frame, and the drift loops without a seam
      return '<div class="hg-col ' + (i % 2 ? 'is-down' : 'is-up') + '"><div class="hg-reel">' + cards + cards + cards + '</div></div>';
    }).join('') + '</div>';
    var grid = root.querySelector('.hg-grid');

    function scale() {
      var h = root.clientHeight; // card size follows the row height; a wider area shows more cards
      if (h) grid.style.setProperty('--s', (h / 355).toFixed(4));
    }
    function pace() {
      root.querySelectorAll('.hg-reel').forEach(function (reel, i) {
        var setH = reel.offsetHeight / 3;
        if (setH) reel.parentNode.style.setProperty('--d', (setH / SPEEDS[i % SPEEDS.length]).toFixed(2) + 's');
      });
    }
    scale();
    if (window.ResizeObserver) new ResizeObserver(scale).observe(root);
    // Images set the heights, so pace once they have loaded
    var imgs = root.querySelectorAll('img'), left = imgs.length;
    imgs.forEach(function (im) {
      if (im.complete) { if (--left === 0) pace(); }
      else im.addEventListener('load', function () { if (--left === 0) pace(); });
    });

    // Still at rest; drifts while the row is hovered
    root.classList.add('is-paused');
    var row = root.closest('.row') || root;
    row.addEventListener('mouseenter', function () { root.classList.remove('is-paused'); });
    row.addEventListener('mouseleave', function () { root.classList.add('is-paused'); });
  }

  // Desktop only, with motion allowed. Otherwise the still cover image shows
  function start() {
    var mq = window.matchMedia('(min-width: 769px)');
    function go() {
      if (!mq.matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      document.querySelectorAll('[data-hp-grid]:not(.is-built)').forEach(function (el) {
        if (el.dataset.hgStarted) return;
        el.dataset.hgStarted = '1';
        el.classList.add('is-built');
        try { init(el); } catch (e) { el.classList.remove('is-built'); el.innerHTML = ''; }
      });
    }
    go();
    if (mq.addEventListener) mq.addEventListener('change', go);
    // Re-place whenever a row changes size (window resize, fonts loading)
    place();
    window.addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(place);
      document.querySelectorAll('.row-cover').forEach(function (r) { ro.observe(r); });
    }
    // And right when a row is hovered, so the grid always appears in the right place
    document.querySelectorAll('.row-cover').forEach(function (r) { r.addEventListener('mouseenter', place); });
  }

  // The live layer runs the row's full height and fills the width between the text and "View →"
  // Every featured row gets the same box, starting after the widest text, so the grids line up row to row
  // (set as --l and --w on .hp-cover, used by hp-covers.css)
  function place() {
    var covers = document.querySelectorAll('.hp-cover'), textRight = 0;
    covers.forEach(function (m) {
      var row = m.closest('.row');
      if (!row) return;
      var rr = row.getBoundingClientRect();
      row.querySelectorAll('.rmain > *').forEach(function (el) { textRight = Math.max(textRight, el.getBoundingClientRect().right - rr.left); });
    });
    covers.forEach(function (m) {
      var row = m.closest('.row');
      if (!row) return;
      var rr = row.getBoundingClientRect();
      var arr = row.querySelector('.row-arr');
      var right = arr ? arr.getBoundingClientRect().left - rr.left - 24 : rr.width;
      // Never cover "View →"; if the space is narrow, the grid moves closer to the text instead
      var left = Math.max(0, Math.min(textRight + 56, right - 340));
      m.style.setProperty('--l', left + 'px');
      m.style.setProperty('--w', (right - left) + 'px');
      m.classList.add('is-placed');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
