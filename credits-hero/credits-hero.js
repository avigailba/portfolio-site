/* AI Credits hero: a tilted showcase grid of the AI credits wallet, in Business Manager, Wixel desktop
   and Wixel mobile, across its states (Figma "AI Credits Flows", page "Wallet component").
   The columns drift slowly in alternating directions so new states keep sliding into view.
   Mount point: <div class="ch" data-credits-hero></div> */
(function () {
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');

  var S = {
    free30: { plan: 'free', total: 30 },
    free20: { plan: 'free', total: 20 },
    paid: { plan: 'paid', total: 2000, monthly: 2000 },
    topup: { plan: 'paid', total: 2500, monthly: 2000, topup: 500 },
    low: { plan: 'paid', total: 5, monthly: 5, topup: 0, warn: 'You\'re almost out of credits. Upgrade to get more.' },
    // Edge cases (Figma "AI Credits Components": Wallet states Error, No permission, Warnings Out)
    outfree: { plan: 'free', total: 0, warn: 'You\u2019re out of daily credits. Upgrade to get more.' },
    outpaid: { plan: 'paid', total: 0, monthly: 0, warn: 'You\u2019re out of credits. Upgrade to get more.' },
    error: { kind: 'error' },
    noperm: { kind: 'noperm' }
  };
  // Columns of [product, state]; bm = Business Manager, wd = Wixel desktop, wm = Wixel mobile
  // Grouped by product, two columns each: Wixel desktop, then Business Manager in the middle, then Wixel mobile.
  // Error and no permission exist in Figma for Business Manager and Wixel desktop only.
  var COLS = [
    [['wd', 'paid'], ['wd', 'error'], ['wd', 'low'], ['wd', 'outfree']],
    [['wd', 'free30'], ['wd', 'noperm'], ['wd', 'topup'], ['wd', 'outpaid']],
    [['bm', 'free30'], ['bm', 'topup'], ['bm', 'error'], ['bm', 'low']],
    [['bm', 'paid'], ['bm', 'noperm'], ['bm', 'outpaid'], ['bm', 'free20']],
    [['wm', 'free20'], ['wm', 'outfree'], ['wm', 'paid'], ['wm', 'low']],
    [['wm', 'topup'], ['wm', 'outpaid'], ['wm', 'free30'], ['wm', 'low']]
  ];

  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function img(file, cls) { return '<img class="' + (cls || '') + '" src="' + BASE + file + '" alt="">'; }

  function render(s, product) {
    var info = product === 'bm' ? 'ico-info.svg' : 'ico-info-wx.svg';
    if (s.kind === 'error') {
      return '<div class="ch-inner"><div class="ch-error"><div class="ch-t14">Couldn\'t load credit balance due to a technical issue on our end.</div>' +
        '<span class="ch-refresh">' + img(product === 'bm' ? 'ico-refresh.svg' : 'ico-refresh-wx.svg') + 'Refresh</span></div></div>';
    }
    if (s.kind === 'noperm') {
      return '<div class="ch-inner"><div class="ch-row"><div><div class="ch-t16">Total AI credits left</div><div class="ch-t14">You don\u2019t have AI credit permission on<br>this site.</div></div></div></div>';
    }
    var h = '<div class="ch-row"><div><div class="ch-t16">Total AI credits left</div>' +
      (s.plan === 'free' ? '<div class="ch-t14">Out of 30 daily credits</div>' : '') +
      '</div><div class="ch-amt16">' + fmt(s.total) + '</div></div>';
    if (s.monthly != null) h += '<div class="ch-row"><div><div class="ch-t14b">Monthly credits</div><div class="ch-t14">Out of 2,000 monthly credits.</div><div class="ch-t14">Renews on Jan 12, 2026</div></div><div class="ch-amt14">' + fmt(s.monthly) + '</div></div>';
    if (s.topup != null) h += '<div class="ch-row"><div><div class="ch-t14b">Top up credits</div></div><div class="ch-amt14">' + fmt(s.topup) + '</div></div>';
    if (s.warn) h += '<div class="ch-warn">' + s.warn + '</div>';
    h += s.plan === 'free'
      ? '<div class="ch-foot"><div><span class="ch-free">Free' + img(info) + '</span>' + (s.warn ? '' : '<div class="ch-t14">Get more credits to keep using AI features.</div>') + '</div><span class="ch-btn">Upgrade</span></div>'
      : '<div class="ch-foot is-paid"><span class="ch-link">Learn More</span><span class="ch-btn">' + (s.warn ? 'Upgrade' : 'Add Credits') + '</span></div>';
    return '<div class="ch-inner">' + h + '</div>';
  }

  function walletHtml(product, state) {
    var s = S[state];
    if (product === 'bm') {
      return '<div class="ch-wallet is-bm">' +
        '<div class="ch-ptr">' + img('pointer.svg') + '</div>' +
        '<div class="ch-body">' +
          '<div class="ch-profile">' + img('av-carol.png', 'ch-av') + '<div><div class="ch-name">Carol Sturka</div><div class="ch-mail">carols@gmail.com</div></div></div>' +
          '<div class="ch-div"></div><div class="ch-content">' + render(s, product) + '</div><div class="ch-div"></div>' +
          '<div class="ch-settings">' + img('ico-settings.svg') + '<span>Account settings</span><span class="ch-logout">Log Out</span></div>' +
        '</div></div>';
    }
    return '<div class="ch-wallet is-' + product + '"><div class="ch-body">' +
      (product === 'wm' ? '<div class="ch-handle"></div>' : '') +
      '<div class="ch-content">' + render(s, product) + '</div></div></div>';
  }

  function build(root) {
    var cols = COLS.map(function (col, i) {
      var cards = col.map(function (c) { return '<div class="ch-cell">' + walletHtml(c[0], c[1]) + '</div>'; }).join('');
      // Each column holds its cards three times: it always covers the frame, and the drift loops without a seam
      return '<div class="ch-col ' + (i % 2 ? 'is-down' : 'is-up') + '" style="--d:' + (46 + (i % 3) * 8) + 's"><div class="ch-reel">' + cards + cards + cards + '</div></div>';
    }).join('');
    root.innerHTML = '<div class="ch-grid">' + cols + '</div>';
  }

  function init(root) {
    build(root);
    var grid = root.querySelector('.ch-grid');
    function scale() {
      var w = root.clientWidth;
      if (!w) return;
      grid.style.setProperty('--s', (w / 1500).toFixed(4));
    }
    scale();
    if (window.ResizeObserver) new ResizeObserver(scale).observe(root); else window.addEventListener('resize', scale);
    // Each column has its own slow pace (wallet pixels per second); a loop moves one set of cards
    var SPEEDS = [18, 14, 21, 16, 22, 15];
    function pace() {
      root.querySelectorAll('.ch-reel').forEach(function (reel, i) {
        var setH = reel.offsetHeight / 3;
        if (setH) reel.parentNode.style.setProperty('--d', (setH / SPEEDS[i % SPEEDS.length]).toFixed(2) + 's');
      });
    }
    pace();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(pace);
    // Pause the drift while off screen
    if (window.IntersectionObserver) new IntersectionObserver(function (e) { root.classList.toggle('is-paused', !e[0].isIntersecting); }, { threshold: 0 }).observe(root);
  }

  // Desktop only, with motion allowed. Otherwise (phones, reduced motion, or a script error) the still hero image shows
  function start() {
    var mq = window.matchMedia('(min-width: 769px)');
    function go() {
      if (!mq.matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      document.querySelectorAll('[data-credits-hero]:not(.is-built)').forEach(function (el) {
        if (el.dataset.chStarted) return;
        el.dataset.chStarted = '1';
        el.classList.add('is-built');
        try { init(el); } catch (e) { el.classList.remove('is-built'); el.innerHTML = ''; }
      });
    }
    go();
    if (mq.addEventListener) mq.addEventListener('change', go);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
