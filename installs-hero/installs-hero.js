/* Installations hero: builds the App Installations page and plays a looping cursor demo.
   Mount point: <div class="ih" data-installs-hero></div> */
(function () {
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');

  function ico(d, size, sw) {
    size = size || 16;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  }
  var I = {
    chevD: ico('<path d="m6 9 6 6 6-6"/>', 14),
    chevR: ico('<path d="m9 6 6 6-6 6"/>', 14),
    back: ico('<path d="M19 12H5m6-6-6 6 6 6"/>', 14),
    bell: ico('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"/>', 20, 1.6),
    home: ico('<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/>', 16),
    code: ico('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 10-2 2 2 2m4-4 2 2-2 2"/>', 16),
    doc: ico('<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>', 16),
    rocket: ico('<path d="M5 19c1-3 2-4 4-4m-1-3 4 4m-6-2 8-8c2-2 5-2 5-2s0 3-2 5l-8 8"/>', 16),
    case: ico('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18"/>', 16),
    store: ico('<path d="M4 9h16l-1-4H5zM5 9v10h14V9M9 14h6"/>', 16),
    upload: ico('<path d="M12 15V4m-4 4 4-4 4 4M5 14v5h14v-5"/>', 18),
    ext: ico('<path d="M14 4h6v6m0-6-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', 16),
    ext14: ico('<path d="M14 4h6v6m0-6-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', 13, 2),
    copy: ico('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>', 13, 2),
    filter: ico('<path d="M4 5h16l-6 7v6l-4 2v-8z"/>', 15),
    sliders: ico('<path d="M4 7h10m4 0h2M4 17h4m4 0h8M14 5v4M8 15v4M4 12h16"/>', 15),
    search: ico('<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>', 15),
    info: ico('<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>', 16),
    arrowD: ico('<path d="M12 5v14m-5-5 5 5 5-5"/>', 14, 2.2),
    x: ico('<path d="M6 6l12 12M18 6 6 18"/>', 16, 2),
    caretR: '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M3 1.5 7.5 5 3 8.5z" fill="currentColor"/></svg>',
    caretD: '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 3 5 7.5 8.5 3z" fill="currentColor"/></svg>',
    cal: ico('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4m6-4v4"/>', 16),
    check: ico('<path d="m5 12 5 5 9-10"/>', 12, 3),
    okCircle: '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#25a55a"/><path d="m6 10.2 2.7 2.7L14.2 7.4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    drag: '<svg width="8" height="18" viewBox="0 0 8 18" aria-hidden="true" fill="currentColor"><circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/><circle cx="2" cy="6.7" r="1.2"/><circle cx="6" cy="6.7" r="1.2"/><circle cx="2" cy="11.3" r="1.2"/><circle cx="6" cy="11.3" r="1.2"/><circle cx="2" cy="16" r="1.2"/><circle cx="6" cy="16" r="1.2"/></svg>',
    cursor: '<svg width="26" height="30" viewBox="0 0 26 30" aria-hidden="true"><path d="M3 2v21l5.5-5.2L12.3 27l4-1.8-3.8-9H20z" fill="#0a0a0a" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    // Caption icons
    capTable: ico('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>', 16, 2),
    capCopy: ico('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>', 16, 2),
    capFilter: ico('<path d="M4 5h16l-6 7v6l-4 2v-8z"/>', 16, 2),
    capCsv: ico('<path d="M12 4v11m-4-4 4 4 4-4M5 19h14"/>', 16, 2),
    fileCsv: '<svg width="28" height="32" viewBox="0 0 28 32" aria-hidden="true"><path d="M4 1h14l9 9v19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" fill="#e7f6ee" stroke="#25a55a" stroke-width="1.5"/><path d="M18 1v9h9" fill="none" stroke="#25a55a" stroke-width="1.5"/><text x="14" y="24" text-anchor="middle" font-size="7" font-weight="700" fill="#178a46" font-family="Arial">CSV</text></svg>',
    capSearch: ico('<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>', 16, 2),
    capCols: ico('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m6-16v16"/>', 16, 2)
  };

  function stars(n) {
    var s = '';
    for (var i = 0; i < 5; i++) s += '<img src="' + BASE + (i < n ? 'star-on.svg' : 'star-off.svg') + '" alt="">';
    return '<div class="ih-stars"><span>' + s + '</span>' + n + '</div>';
  }
  function badge(text, kind) { return '<span class="ih-badge ih-' + kind + '">' + text + '</span>'; }
  function t(text, cls) { return '<span class="ih-t' + (cls ? ' ' + cls : '') + '">' + text + '</span>'; }

  // Rows as in the Figma hover frame (979:123265)
  var ROWS = [
    ['Nintendo', 'www.codehow.com', '6f0629eb-9b6d-4683', 'jessica.hanson@example.com', ['Silver', 'Upgraded', 'ok'], ['2.1', 'Installed', 'ok'], 'Jan 15, 2020', 4],
    ['General Electric', 'www.donware.com', 'd623b11d-8a2c-4f1e', 'nathan.roberts@example.com', ['Free', 'Cancelled', 'dark'], ['2.0', 'Uninstalled', 'grey'], 'Jan 15, 2020', 0],
    ['The Walt Disney Company', 'www.zencorporation.com', '35b2c225-74d1-4e0b', 'michael.mitc@example.com', ['Silver', 'Auto renew off', 'grey'], ['2.1', 'Uninstalled', 'grey'], 'Jan 12, 2020', 0],
    ["McDonald's", 'www.dambase.com', 'a9a728b9-f3c1-4d7e', 'Avi@techorp.com', ['Basic', 'Upgraded', 'ok'], ['2.1', 'Installed', 'ok'], 'Jan 15, 2020', 3],
    ['Louis Vuitton', 'www.statholdings.com', '53dab320-7c4f-4b8a', 'sara.cruz@example.com', ['Silver', 'Upgraded', 'ok'], ['2.1', 'Installed', 'ok'], 'Jan 4, 2020', 2],
    [null, null, '0baecf77-6e2d-4c1b', null, ['Free'], ['2.1', 'Installed', 'ok'], 'Jan 1, 2020', 0],
    ['Northwind Studio', 'www.northwind.studio', 'c41e9a02-5b7f-4e3a', 'hello@example.com', ['Gold', 'Upgraded', 'ok'], ['2.1', 'Installed', 'ok'], 'Dec 28, 2019', 5],
    ['Bloom & Co', 'www.bloomandco.com', '7e2d10fa-93c4-4b51', 'orders@example.com', ['Silver', 'Upgraded', 'ok'], ['2.0', 'Installed', 'ok'], 'Dec 20, 2019', 4],
    ['Atlas Fitness', 'www.atlasfit.com', 'b90c3d77-1a8e-4f02', 'team@example.com', ['Free'], ['2.1', 'Installed', 'ok'], 'Dec 14, 2019', 0]
  ];
  // Extra columns the demo switches on from Customize columns: site plan, location
  var EXTRA = [['Premium', 'Japan'], ['Free', 'United States'], ['Business', 'United States'], ['Core', 'United States'], ['Premium', 'France'], ['Free', 'Germany'], ['Business', 'Canada'], ['Core', 'United Kingdom'], ['Free', 'Australia']];

  function rowHtml(r, i) {
    var none = '<span class="ih-t ih-none">None ' + I.info + '</span>';
    return '<div class="ih-row" data-row="' + i + '" data-plan="' + r[4][0] + '">' +
      '<div class="ih-c ih-c1">' + (r[0] ? t(r[0]) : none) + '</div>' +
      '<div class="ih-c ih-c2' + (r[1] ? ' ih-has-act' : '') + '">' + (r[1] ? t(r[1]) + '<span class="ih-act">' + I.ext14 + '</span>' : t('Not published', 'ih-mute')) + '</div>' +
      '<div class="ih-c ih-c3 ih-has-act">' + t(r[2]) + '<span class="ih-act" data-act="id">' + I.copy + '</span></div>' +
      '<div class="ih-c ih-cx" data-x="plan">' + t(EXTRA[i][0]) + '</div>' +
      '<div class="ih-c ih-cx" data-x="loc">' + t(EXTRA[i][1]) + '</div>' +
      '<div class="ih-c ih-c4' + (r[3] ? ' ih-has-act' : '') + '">' + (r[3] ? t(r[3]) + '<span class="ih-act" data-act="email">' + I.copy + '</span>' : none) + '</div>' +
      '<div class="ih-c ih-c5">' + t(r[4][0]) + (r[4][1] ? badge(r[4][1], r[4][2]) : '') + '</div>' +
      '<div class="ih-c ih-c6">' + t(r[5][0]) + badge(r[5][1], r[5][2]) + '</div>' +
      '<div class="ih-c ih-c7">' + t(r[6]) + '</div>' +
      '<div class="ih-c ih-c8' + (r[7] ? ' ih-has-act' : '') + '">' + (r[7] ? stars(r[7]) + '<span class="ih-act">' + I.ext14 + '</span>' : t('No reviews', 'ih-mute')) + '</div>' +
      '</div>';
  }

  var FILTERS = ['Site plan', 'Business category', 'Location', 'App plan', 'App plan status', 'Billing cycle', 'Version', 'App status'];
  var COLS = [['Business name', 'locked'], ['Site URL', 'locked'], ['Instance ID', 'on'], ['Site plan', ''], ['Business category', ''], ['Location', ''], ['Email', 'on'], ['App plan', 'on'], ['Billing cycle', ''], ['Version', 'on'], ['Install date', 'on'], ['Rating', 'on']];


  function build(root) {
    var head = '<div class="ih-row ih-thead">' +
      ['Business name', 'Site URL', 'Instance ID', 'Email', 'App plan', 'Version', 'Install date <span style="color:#116dff">' + I.arrowD + '</span>', 'Rating <span style="color:#116dff">' + I.info + '</span>']
        .map(function (h, i) {
          var c = '<div class="ih-c ih-c' + (i + 1) + '">' + h + '</div>';
          return i === 2 ? c + '<div class="ih-c ih-cx" data-x="plan">Site plan</div><div class="ih-c ih-cx" data-x="loc">Location</div>' : c;
        }).join('') + '</div>';
    var PLANS = ['Free', 'Basic', 'Silver', 'Gold'];

    root.innerHTML =
      '<div class="ih-win"><div class="ih-app">' +
        '<div class="ih-top"><div class="ih-logo"><b>WIX</b>STUDIO</div><div class="ih-st"><span>ST</span>' + I.chevD + '</div>' +
          '<div class="ih-nav"><span>App Resources ' + I.chevD + '</span><span>Dev Community ' + I.chevD + '</span><span>Help ' + I.chevD + '</span></div>' +
          '<div class="ih-top-r">' + I.bell + '<img class="ih-avatar" src="' + BASE + 'avatar.png" alt="">' + I.chevD + '</div></div>' +
        '<div class="ih-side"><div class="ih-side-head"><div class="ih-back">' + I.back + 'Back to Custom Apps</div><div class="ih-appname">QR code app</div><span class="ih-pub">PUBLISHED</span><p>Released version: <b>1.0</b></p><p>Role: <b>Owner</b></p></div>' +
          '<div class="ih-menu">' +
            '<div class="ih-mi">' + I.home + 'Home</div>' +
            '<div class="ih-mi">' + I.code + 'Develop<span class="ih-chev">' + I.chevR + '</span></div>' +
            '<div class="ih-mi">' + I.doc + 'App Profile<span class="ih-chev">' + I.chevR + '</span></div>' +
            '<div class="ih-mi">' + I.rocket + 'Distribute<span class="ih-chev">' + I.chevR + '</span></div>' +
            '<div class="ih-mi">' + I.case + 'Manage<span class="ih-chev">' + I.chevD + '</span></div>' +
            '<div class="ih-sub"><div>Statistics</div><div>App Market</div><div class="is-on">App Installations</div><div>Collaborators</div></div>' +
          '</div><div class="ih-side-foot">' + I.store + 'Publish to App Market<span style="margin-left:auto">' + I.chevD + '</span></div></div>' +
        '<div class="ih-page">' +
          '<div class="ih-h1">App Installations</div>' +
          '<div class="ih-lede">Track where your app is installed and view site data per install. <u>Learn More</u><span style="color:#116dff">' + I.ext + '</span></div>' +
          '<div class="ih-csv">' + I.upload + 'Download CSV</div>' +
          '<div class="ih-card"><div class="ih-card-h"><b>App installations</b><div class="ih-tools">' +
            '<div class="ih-btn" data-k="filter">' + I.filter + 'Filter<span class="ih-fbadge">1</span></div><div class="ih-ibtn" data-k="cols">' + I.sliders + '</div>' +
            '<div class="ih-search">' + I.search + '<span class="ih-q"><span class="ih-qph">Search...</span><span class="ih-qt"></span><i class="ih-blink"></i></span><span class="ih-qx">' + I.x + '</span></div></div></div>' +
            '<div class="ih-fbar"><div class="ih-fbar-in">Filtered by:<span class="ih-tag">App plan: Silver<span class="ih-tag-x">' + I.x + '</span></span><span class="ih-clear">Clear All</span></div></div>' +
            head + ROWS.map(rowHtml).join('') +
          '</div>' +
        '</div>' +
        '<div class="ih-scrim"></div>' +
        '<div class="ih-panel" data-p="filter"><div class="ih-ph" style="height:59px;border-bottom:1px solid #dfe5eb"><b style="font-size:20px">Filters</b><span class="ih-x">' + I.x + '</span></div>' +
          FILTERS.map(function (f) {
            if (f !== 'App plan') return '<div class="ih-frow">' + f + I.caretR + '</div>';
            return '<div class="ih-facc"><div class="ih-frow" data-k="plan">' + f + '<span class="ih-caret">' + I.caretR + '</span></div>' +
              '<div class="ih-facc-body">' + PLANS.map(function (p) { return '<div class="ih-opt" data-opt="' + p + '"><span class="ih-cb">' + I.check + '</span>' + p + '</div>'; }).join('') + '</div></div>';
          }).join('') +
          '<div class="ih-fopen" data-k="date"><div class="ih-frow-t">Install date' + I.caretD + '</div><div class="ih-range"><div>From<div class="ih-input"><span style="color:#116dff">' + I.cal + '</span>Date</div></div><div>To<div class="ih-input"><span style="color:#116dff">' + I.cal + '</span>Date</div></div></div></div>' +
          '<div class="ih-ffoot">No filters applied</div></div>' +        '<div class="ih-panel" data-p="cols"><div class="ih-ph"><b>Customize columns</b><p>Choose which columns to show, and drag and drop to change their order.</p><span class="ih-x">' + I.x + '</span></div>' +
          '<div class="ih-csearch">' + I.search + 'Search columns...</div>' +
          COLS.map(function (c, i) { return '<div class="ih-crow' + (c[1] ? ' is-' + c[1] : '') + '" data-col="' + i + '"><span class="ih-drag">' + I.drag + '</span><span class="ih-cb">' + I.check + '</span>' + c[0] + '</div>'; }).join('') +
        '</div>' +
        '<div class="ih-modal-bg"><div class="ih-modal"><div class="ih-mh"><b>Which items do you want to export?</b><span class="ih-x">' + I.x + '</span></div>' +
          '<div class="ih-mc"><div class="ih-radio is-on" data-r="all"><i></i>All</div><div class="ih-radio" data-r="filtered"><i></i>Filtered (4)</div>' +
          '<p>Your items and all their data will be downloaded as a CSV file.</p></div>' +
          '<div class="ih-mf"><span class="ih-b2">Cancel</span><span class="ih-b1">Save</span></div></div></div>' +
        '<div class="ih-tip"></div>' +
        '<div class="ih-toast">' + I.okCircle + '<span class="ih-toast-t">Email copied.</span><span class="ih-x">' + I.x + '</span></div>' +
        '<div class="ih-cursor"><span class="ih-ripple"></span>' + I.cursor + '</div>' +
      '</div></div>';
  }

  function init(root) {
    build(root);
    var win = root.querySelector('.ih-win'), app = root.querySelector('.ih-app');
    var $ = function (s) { return app.querySelector(s); };
    var cursor = $('.ih-cursor'), ripple = $('.ih-ripple'), tip = $('.ih-tip'), toast = $('.ih-toast');

    function scale() { app.style.setProperty('--ih-s', win.clientWidth / 1405); }
    scale();
    if (window.ResizeObserver) new ResizeObserver(scale).observe(win); else window.addEventListener('resize', scale);

    requestAnimationFrame(function () { root.classList.add('is-in'); });
    setTimeout(function () { root.classList.add('is-in'); }, 300);


    // Pause while off screen or in a background tab
    var visible = !window.IntersectionObserver, waiters = [];
    function setVisible(v) { visible = v; if (v) { waiters.splice(0).forEach(function (f) { f(); }); } }
    if (window.IntersectionObserver) new IntersectionObserver(function (e) { setVisible(e[0].isIntersecting && !document.hidden); }, { threshold: 0.15 }).observe(root);
    document.addEventListener('visibilitychange', function () { setVisible(!document.hidden); });

    function sleep(ms) {
      return new Promise(function (res) {
        var left = ms, last = Date.now();
        (function tick() {
          if (!visible) { waiters.push(function () { last = Date.now(); tick(); }); return; }
          var now = Date.now(); left -= now - last; last = now;
          if (left <= 0) res(); else setTimeout(tick, Math.min(left, 100));
        })();
      });
    }

    // Cursor moves on a soft curve with ease in and out, like a hand on a trackpad
    var cur = { x: 1260, y: 900 };
    function setCur(x, y) { cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)'; cur = { x: x, y: y }; }
    function move(x, y, d, straight) {
      d = (d || 0.9) * 1000;
      var x0 = cur.x, y0 = cur.y, dx = x - x0, dy = y - y0;
      var bend = straight ? 0 : (0.06 + Math.random() * 0.12) * (Math.random() < 0.5 ? -1 : 1);
      var cx = x0 + dx / 2 - dy * bend, cy = y0 + dy / 2 + dx * bend;
      return new Promise(function (res) {
        var t0 = Date.now(), done = false, timer = 0;
        // Frames drive the motion; a timer backs them up when frames are not being drawn
        function f() {
          if (done) return;
          clearTimeout(timer);
          var p = Math.min(1, (Date.now() - t0) / d);
          var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2, u = 1 - e;
          setCur(u * u * x0 + 2 * u * e * cx + e * e * x, u * u * y0 + 2 * u * e * cy + e * e * y);
          if (p < 1) { requestAnimationFrame(f); timer = setTimeout(f, 50); } else { done = true; res(); }
        }
        f();
      }).then(function () { return sleep(60); });
    }
    function click() {
      cursor.classList.add('is-down');
      ripple.classList.remove('is-go'); void ripple.offsetWidth; ripple.classList.add('is-go');
      return sleep(140).then(function () { cursor.classList.remove('is-down'); return sleep(120); });
    }
    function showTip(text, x, y) { tip.textContent = text; tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.style.transform = ''; tip.classList.add('is-on'); tip.style.marginLeft = -(tip.offsetWidth / 2) + 'px'; }
    function hideTip() { tip.classList.remove('is-on'); }
    function hover(i) { app.querySelectorAll('.ih-row[data-row]').forEach(function (r) { r.classList.toggle('is-hover', +r.dataset.row === i); }); }
    function hot(el, on) { if (el) el.classList.toggle('is-hot', on); }
    function panel(name) {
      app.querySelectorAll('.ih-panel').forEach(function (p) { p.classList.toggle('is-on', p.dataset.p === name); });
      app.classList.toggle('has-panel', !!name);
    }
    // Centre of an element in app coordinates (works at any scale)
    function at(el, dx, dy) {
      var a = app.getBoundingClientRect(), r = el.getBoundingClientRect(), k = a.width / 1405;
      return { x: (r.left + r.width / 2 - a.left) / k + (dx || 0), y: (r.top + r.height / 2 - a.top) / k + (dy || 0) };
    }
    function moveTo(el, d, dx, dy) { var p = at(el, dx, dy); return move(p.x - 3, p.y - 2, d); }
    function tick(row, on) {
      row.classList.toggle('is-on', on);
      var cb = row.querySelector('.ih-cb'); cb.classList.add('is-pop');
      setTimeout(function () { cb.classList.remove('is-pop'); }, 200);
    }
    var state = { plan: null, q: '' };
    // Table changes swap in place with no animation, like the real Wix Patterns table
    function reload(fn) { fn(); }
    function applyRows() {
      var rows = Array.prototype.slice.call(app.querySelectorAll('.ih-row[data-row]'));
      var want = rows.map(function (r) {
        var name = (ROWS[+r.dataset.row][0] || '').toLowerCase();
        return !!((state.plan && r.dataset.plan !== state.plan) || (state.q && name.indexOf(state.q.toLowerCase()) === -1));
      });
      if (rows.every(function (r, k) { return r.classList.contains('is-out') === want[k]; })) return;
      reload(function () { rows.forEach(function (r, k) { r.classList.toggle('is-out', want[k]); }); });
    }
    function flipCols(fn) { reload(fn, true); }
    function removeCol(sel, fn) { reload(fn, true); }
    function setQuery(q) {
      state.q = q;
      $('.ih-qt').textContent = q;
      $('.ih-search').classList.toggle('has-q', !!q);
      applyRows();
    }
    function filterPlan(plan) {
      state.plan = plan; applyRows();
      app.classList.toggle('has-filter', !!plan);
      $('.ih-ffoot').textContent = plan ? '1 filter applied' : 'No filters applied';
    }
    function reset() {
      panel(null); hover(-1); hideTip(); toast.classList.remove('is-on');
      app.querySelectorAll('.is-hot').forEach(function (e) { e.classList.remove('is-hot'); });
      app.querySelectorAll('.ih-crow[data-col="3"], .ih-crow[data-col="5"], .ih-opt').forEach(function (e) { e.classList.remove('is-on'); });
      $('.ih-facc').classList.remove('is-open');
      filterPlan(null); app.classList.remove('show-loc', 'is-reordered');
      setQuery(''); $('.ih-search').classList.remove('is-focus');
      app.classList.remove('has-modal');
      app.querySelectorAll('.ih-radio').forEach(function (r) { r.classList.toggle('is-on', r.dataset.r === 'all'); });
      var list = $('[data-p="cols"]');
      Array.prototype.slice.call(list.querySelectorAll('.ih-crow')).sort(function (a, b) { return a.dataset.col - b.dataset.col; }).forEach(function (r) { list.appendChild(r); });
    }

    // The demo row: high in the table so the cursor stays clear of the toast
    var row4 = function () { return $('.ih-row[data-row="1"]'); };

    async function loop() {
      setCur(1300, 920);
      cursor.style.opacity = 1;
      await sleep(900);
      for (;;) {
        reset();
        // 1. Hover a row: actions appear
        var hr = at(row4());
        await move(1060, hr.y - 20, 1.2);
        hover(1);
        await move(1000, hr.y, 0.5);
        await sleep(1200);

        // 2. Copy the email: tooltip, click, toast
        var emailAct = row4().querySelector('[data-act="email"]');
        var ep = at(emailAct);
        await move(ep.x - 3, ep.y - 2, 0.8);
        hot(emailAct, true);
        showTip('Copy', ep.x, ep.y - 52);
        await sleep(700);
        await click();
        hideTip();
        toast.querySelector('.ih-toast-t').textContent = 'Email copied.';
        toast.classList.add('is-on');
        await sleep(1700);
        hot(emailAct, false);
        toast.classList.remove('is-on');

        // 3. Search: type a name, the table narrows as you type, clear it
        hover(-1);
        var search = $('.ih-search');
        await moveTo(search, 1.0, -40);
        await click();
        search.classList.add('is-focus');
        await sleep(450);
        var word = 'Lou';
        for (var ci = 1; ci <= word.length; ci++) { $('.ih-qt').textContent = word.slice(0, ci); search.classList.add('has-q'); await sleep(260); }
        await sleep(250);
        setQuery(word);
        await sleep(1500);
        var qx = $('.ih-qx');
        await moveTo(qx, 0.6);
        await click();
        setQuery('');
        search.classList.remove('is-focus');
        await sleep(700);

        // 4. Customize columns: add Location, drag it next to Site URL, the table follows
        var cBtn = $('[data-k="cols"]');
        await moveTo(cBtn, 0.9);
        hot(cBtn, true);
        var cp = at(cBtn);
        showTip('Customize columns', cp.x, cp.y - 54);
        await sleep(800);
        await click();
        hideTip();
        hot(cBtn, false);
        panel('cols');
        await sleep(700);
        var loc = $('.ih-crow[data-col="5"]');
        await moveTo(loc.querySelector('.ih-cb'), 0.8);
        await click();
        tick(loc, true);
        flipCols(function () { app.classList.add('show-loc'); });
        await sleep(1300);
        var idRow = $('.ih-crow[data-col="2"]');
        var between = ['2', '3', '4'].map(function (c) { return $('.ih-crow[data-col="' + c + '"]'); });
        await moveTo(loc.querySelector('.ih-drag'), 0.7);
        cursor.classList.add('is-down');
        loc.classList.add('is-drag');
        await sleep(300);
        var gp = at(loc.querySelector('.ih-drag'));
        loc.style.transform = 'translateY(-165px)';
        between.forEach(function (r, k) { r.style.transitionDelay = (0.7 - k * 0.25) + 's'; r.style.transform = 'translateY(55px)'; });
        await move(gp.x - 3, gp.y - 167, 1.1, true);
        await sleep(250);
        cursor.classList.remove('is-down');
        loc.classList.remove('is-drag');
        app.classList.add('ih-notr');
        between.concat(loc).forEach(function (r) { r.style.transform = ''; r.style.transitionDelay = ''; });
        idRow.parentNode.insertBefore(loc, idRow);
        void app.offsetWidth;
        app.classList.remove('ih-notr');
        flipCols(function () { app.classList.add('is-reordered'); });
        await sleep(1400);
        await move(1376, 81, 0.8);
        await click();
        panel(null);
        await sleep(1400);

        // 5. Filter: open the panel, pick App plan > Silver, the table narrows
        var fBtn = $('[data-k="filter"]');
        await moveTo(fBtn, 0.9);
        hot(fBtn, true);
        await sleep(300);
        await click();
        panel('filter');
        hot(fBtn, false);
        await sleep(650);
        var planRow = $('[data-k="plan"]');
        await moveTo(planRow, 0.8, 60);
        hot(planRow, true);
        await sleep(250);
        await click();
        $('.ih-facc').classList.add('is-open');
        hot(planRow, false);
        await sleep(600);
        var silver = $('.ih-opt[data-opt="Silver"]');
        await moveTo(silver.querySelector('.ih-cb'), 0.7);
        await click();
        tick(silver, true);
        filterPlan('Silver');
        await sleep(1300);
        await move(1376, 81, 0.8);
        await click();
        panel(null);
        await sleep(1300);

        // 6. Download CSV: the export modal, pick Filtered, save, toast
        var csv = $('.ih-csv');
        await moveTo(csv, 0.9, 30);
        hot(csv, true);
        await sleep(300);
        await click();
        hot(csv, false);
        app.classList.add('has-modal');
        await sleep(800);
        var rf = $('.ih-radio[data-r="filtered"]');
        await moveTo(rf.querySelector('i'), 0.8);
        await click();
        app.querySelectorAll('.ih-radio').forEach(function (r) { r.classList.toggle('is-on', r === rf); });
        await sleep(600);
        var save = $('.ih-b1');
        await moveTo(save, 0.7);
        hot(save, true);
        await sleep(250);
        await click();
        hot(save, false);
        app.classList.remove('has-modal');
        toast.querySelector('.ih-toast-t').textContent = 'CSV file downloaded.';
        toast.classList.add('is-on');
        await sleep(1800);
        toast.classList.remove('is-on');
        await sleep(400);

        // 7. Clear All: the filter goes, every row comes back
        var clearAll = $('.ih-clear');
        await moveTo(clearAll, 0.9);
        hot(clearAll, true);
        await sleep(300);
        await click();
        hot(clearAll, false);
        filterPlan(null);
        silver.classList.remove('is-on');
        $('.ih-facc').classList.remove('is-open');
        app.querySelectorAll('.ih-radio').forEach(function (r) { r.classList.toggle('is-on', r.dataset.r === 'all'); });
        await sleep(1200);

        // 8. Remove the column that was added: back to the default view, ready to loop
        await moveTo(cBtn, 0.9);
        hot(cBtn, true);
        await sleep(250);
        await click();
        hot(cBtn, false);
        panel('cols');
        await sleep(700);
        await moveTo(loc.querySelector('.ih-cb'), 0.7);
        await click();
        tick(loc, false);
        removeCol('.ih-cx[data-x="loc"]', function () { app.classList.remove('show-loc', 'is-reordered'); });
        await sleep(900);
        await move(1376, 81, 0.8);
        await click();
        panel(null);
        await move(1300, 920, 1.3);
        await sleep(900);
      }
    }
    loop();
  }

  // Desktop only, with motion allowed. Otherwise (phones, reduced motion, or a script error) the still hero image shows
  function start() {
    var mq = window.matchMedia('(min-width: 769px)');
    function go() {
      if (!mq.matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      document.querySelectorAll('[data-installs-hero]:not(.is-built)').forEach(function (el) {
        if (el.dataset.ihStarted) return;
        el.dataset.ihStarted = '1';
        try { init(el); el.classList.add('is-built'); } catch (e) { el.innerHTML = ''; }
      });
    }
    go();
    if (mq.addEventListener) mq.addEventListener('change', go);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
