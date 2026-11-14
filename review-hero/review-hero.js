/* App Review Platform hero: builds Cactus (the internal app review tool) and plays the happy flow on a loop.
   Mount point: <div class="rh" data-review-hero></div>
   Flow: Apps > Privy > Activity > Go to Review > Previous activity > Report > add a comment >
   Finish > Publish app (three steps) > published > Back to Apps. */
(function () {
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');

  function ico(d, size, sw) {
    size = size || 16;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  }
  var I = {
    chevD: ico('<path d="m6 9 6 6 6-6"/>', 18),
    chevR: ico('<path d="m9 6 6 6-6 6"/>', 14),
    back: ico('<path d="M19 12H5m6-6-6 6 6 6"/>', 16),
    ext: ico('<path d="M14 4h6v6m0-6-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', 18),
    chat: ico('<path d="M5 5h14v10H9l-4 4z"/>', 16),
    article: ico('<rect x="6" y="4" width="12" height="16" rx="1.5"/><path d="M9 9h6M9 12h6M9 15h4"/>', 16),
    eye: ico('<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/>', 18),
    plus: ico('<path d="M12 5v14M5 12h14"/>', 18),
    x: ico('<path d="M6 6l12 12M18 6 6 18"/>', 18, 2),
    xs: ico('<path d="M6 6l12 12M18 6 6 18"/>', 10, 3),
    rocket: ico('<path d="M5 19c1-3 2-4 4-4m-1-3 4 4m-6-2 8-8c2-2 5-2 5-2s0 3-2 5l-8 8"/>', 18),
    filter: ico('<path d="M4 5h16l-6 7v6l-4 2v-8z"/>', 16),
    search: ico('<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>', 16),
    arrowD: ico('<path d="M12 5v14m-5-5 5 5 5-5"/>', 13, 2.2),
    copy: ico('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>', 18),
    pencil: ico('<path d="M4 20h4L19 9l-4-4L4 16z"/>', 16),
    link: ico('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', 18),
    list: ico('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>', 18),
    olist: ico('<path d="M10 6h10M10 12h10M10 18h10M4 5h1v3M4 11.5h2L4 14h2M4 17h2v3H4"/>', 18),
    check: ico('<path d="m5 12 5 5 9-10"/>', 12, 3),
    okc: ico('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>', 18, 1.8),
    updown: ico('<path d="m8 9 4-4 4 4M8 15l4 4 4-4"/>', 14, 2),
    dots: '<svg width="16" height="4" viewBox="0 0 16 4" aria-hidden="true" fill="currentColor"><circle cx="2" cy="2" r="1.6"/><circle cx="8" cy="2" r="1.6"/><circle cx="14" cy="2" r="1.6"/></svg>',
    cursor: '<svg width="26" height="30" viewBox="0 0 26 30" aria-hidden="true"><path d="M3 2v21l5.5-5.2L12.3 27l4-1.8-3.8-9H20z" fill="#0a0a0a" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>'
  };
  function img(file, cls) { return '<img class="' + cls + '" src="' + BASE + file + '" alt="">'; }
  function b(text, kind) { return '<span class="rh-b rh-b-' + kind + '">' + text + '</span>'; }
  var STATUS = { submitted: 'warn', 'in review': 'warn', declined: 'red', draft: 'grey', published: 'pub', approved: 'ok' };
  function st(s) { return b(s, STATUS[s]); }
  function market(m) { return m === 'listed' ? b('listed', 'listed') : m === 'removed' ? b('removed', 'removed') : b('never listed', 'text'); }

  var PEOPLE = { chandler: ['av-chandler.png', 'Chandler Bing'], monica: ['av-monica.png', 'Monica Geller'], rachel: ['av-rachel.png', 'Rachel Green'], joey: ['av-joey.png', 'Joey Tribbiani'], ross: ['av-ross.png', 'Ross Geller'], none: ['av-none.png', 'Unassigned'] };
  function person(k) { return '<span class="rh-person">' + img(PEOPLE[k][0], 'rh-av24') + PEOPLE[k][1] + '</span>'; }

  // Apps list, as in the Figma "Apps page"
  var APPS = [
    ['app-modalyst.png', 'Modalyst', 'submitted', '13.12.20', 'never', '465f0hgfg64-j56686-49...', 'joey'],
    ['app-instagram.png', 'Instagram', 'in review', '12.12.20', 'never', '8AlwCQIj2dSQeaFo;Lgh...', 'chandler'],
    ['app-privy.png', 'Privy', 'submitted', '11.12.20', 'never', 'kpI04Kq6zzOh0rNZg8JK...', 'rachel'],
    ['app-appsell.png', 'AppSell - Upsell & Cross in...', 'declined', '10.12.20', 'listed', 'DH4Lj73HREktmSOiIdkY...', 'monica'],
    ['app-twism.png', 'Twism', 'submitted', '9.12.20', 'listed', 'RHzQpomrVSsKUPa4SM...', 'ross'],
    ['app-affiliate.png', 'Simple Affiliate', 'published', '8.12.20', 'listed', 'ptFkv3BtVq8Og7sfb4vV...', 'chandler'],
    ['app-overtok.png', 'Overtok Call Conversation', 'submitted', '7.12.20', 'removed', 'r7CjkmN26OqO9HJB8JWc...', 'rachel']
  ];
  function appRow(a, i) {
    return '<div class="rh-tr" data-app="' + i + '">' +
      '<div class="rh-appcell">' + img(a[0], 'rh-ico36') + '<span class="rh-ellip">' + a[1] + '</span></div>' +
      '<div style="width:90px" class="rh-astat">' + st(a[2]) + '</div>' +
      '<div style="width:104px" class="rh-adate">' + a[3] + '</div>' +
      '<div style="width:96px" class="rh-amkt">' + market(a[4]) + '</div>' +
      '<div style="width:172px" class="rh-ellip">' + a[5] + '</div>' +
      '<div style="width:170px" class="rh-arev">' + person(a[6]) + '</div>' +
      '<span class="rh-dots">' + I.dots + '</span></div>';
  }

  // Activity log rows: [status, date, reviewer, internal note, actions]
  var LOG = [
    ['submitted', '14.12.2020', 'rachel', '', 'review'],
    ['declined', '13.12.2020', 'monica', 'Next submission we need to see if the user upd...', 'article'],
    ['in review', '12.12.2020', 'monica', '', ''],
    ['submitted', '11.12.2020', 'chandler', '', 'chat'],
    ['draft', '11.12.2020', 'none', '', '']
  ];
  var LOG_PUBLISHED = [
    ['published', '16.12.2020', 'rachel', 'Reviewed and ready for the App Market.', 'unpublish'],
    ['approved', '16.12.2020', 'rachel', '', ''],
    ['in review', '15.12.2020', 'rachel', '', ''],
    ['submitted', '14.12.2020', 'rachel', '', 'chat'],
    ['declined', '13.12.2020', 'monica', 'Next submission we need to see if the user upd...', 'article'],
    ['in review', '12.12.2020', 'monica', '', ''],
    ['submitted', '11.12.2020', 'chandler', '', 'chat'],
    ['draft', '11.12.2020', 'none', '', '']
  ];
  function logRows(rows) {
    return rows.map(function (r) {
      var act = r[4] === 'review' ? '<span class="rh-btn" data-k="goreview">Go to Review</span><span class="rh-ibtn">' + I.chat + '</span>'
        : r[4] === 'unpublish' ? '<span class="rh-btn rh-btn-2">Unpublish</span><span class="rh-ibtn">' + I.article + '</span>'
        : r[4] === 'article' ? '<span class="rh-ibtn">' + I.article + '</span>'
        : r[4] === 'chat' ? '<span class="rh-ibtn">' + I.chat + '</span>' : '';
      return '<div class="rh-tr"><div style="width:106px">' + st(r[0]) + '</div><div style="width:88px;color:#333853">' + r[1] + '</div>' +
        '<div style="width:158px">' + person(r[2]) + '</div><div style="width:316px;color:#868aa5" class="rh-ellip">' + r[3] + '</div>' +
        '<div class="rh-ract">' + act + '</div></div>';
    }).join('');
  }

  // Review comments: [id, path, text, blocker]
  var REPORT = [
    ['c1', 'Components > Dashboard > Page URL', '“Page url is localhost”', false],
    ['c2', 'Market Listing > Screenshots', '“Screenshots show a different app name.”', false],
    ['c3', 'Permissions > Scopes', '“Remove permissions the app doesn’t use.”', false]
  ];
  // Previous activity, as in the Figma frame 119:267371: [path, type, details or [new, old], blocker]
  var PAST = [
    ['Data > Components > CompData > ... > url', 'update', ['https://localhost:6006/dashboard.priv...', 'https://localhost:6006/dashboard.priv...']],
    ['General > Installation process', 'comment', '“The app has a generic interface”'],
    ['Data > Components > CompData > ... > published', 'update', ['True', 'False']],
    ['Market Listing > ... > Pricing Plan', 'comment', '“Missing recurring payment.”', true],
    ['Webhooks > Wix Stores', 'comment', '“You don’t need this webhook.”'],
    ['Components > ... > Page URL', 'comment', '“Once I tried to install the app on another Wix ...”']
  ];
  var MOVE_I = 1; // the past comment the reviewer moves into the new report
  function commentRow(c) {
    return '<div class="rh-tr" data-c="' + c[0] + '"><div class="rh-rcell1 rh-ellip">' + c[1] + '</div><div class="rh-rcell2">' + b('comment', 'blue') + '</div>' +
      '<div class="rh-rcell3 rh-ellip">' + c[2] + '</div><div class="rh-ract"><span class="rh-ibtn rh-edit">' + I.pencil + '</span>' +
      (c[3] ? '<span class="rh-blk">B</span>' : '<span style="width:18px"></span>') + '</div></div>';
  }
  function pastRow(p) {
    var details = p[1] === 'update'
      ? '<div class="rh-diff"><span>new</span><span class="rh-ellip">' + p[2][0] + '</span></div><div class="rh-diff"><span>old</span><span class="rh-ellip">' + p[2][1] + '</span></div>'
      : '<span class="rh-ellip">' + p[2] + '</span>';
    var move = p[1] === 'comment' ? '<span class="rh-pact"><span class="rh-btn rh-btn-sm rh-move">Add to Report</span><span class="rh-btn rh-btn-sm rh-btn-w">Dismiss</span></span><span class="rh-added">Added to report</span>' : '';
    return '<div class="rh-tr' + (p[1] === 'update' ? ' rh-tall' : '') + '" data-pi="' + PAST.indexOf(p) + '"><div class="rh-rcell1 rh-ellip">' + p[0] + '</div><div class="rh-rcell2">' + b(p[1], p[1] === 'update' ? 'upd' : 'blue') + '</div>' +
      '<div class="rh-rcell3">' + details + '</div><div class="rh-ract">' + move + (p[3] ? '<span class="rh-blk">B</span>' : '') + '</div></div>';
  }
  function sidebar() {
    return '<div class="rh-side"><div class="rh-back" data-k="back">' + I.back + 'Back to Apps</div>' +
      '<div class="rh-shead">' + img('app-privy-lg.png', 'rh-applogo') + '<b class="rh-appname">Privy</b></div>' +
      '<div class="rh-si is-on">Activity</div><div class="rh-si">Development Team</div><div class="rh-si">Dev Center' + I.ext + '</div>' +
      '<div class="rh-sdiv"><i></i></div>' +
      '<div class="rh-sstat"><span class="rh-smkt">' + market('never') + '</span><span class="rh-sst">' + st('submitted') + '</span></div>' +
      '<div class="rh-srow"><span>Changed:</span><span>11.12.20</span></div><div class="rh-srow"><span>Ver. submitted:</span><span>11.12.20</span></div>' +
      '<div class="rh-sdiv"><i></i></div>' +
      '<div class="rh-srow"><span>App ID: 492349328u4902...</span></div><div class="rh-srow"><span>Assigned to: Rachel Green</span></div>' +
      '<div class="rh-srow"><span>Revenue Share</span><span class="rh-srev">-</span></div></div>';
  }

  function build(root) {
    root.innerHTML = '<div class="rh-win"><div class="rh-app">' +
      '<div class="rh-top"><div class="rh-logo"><span style="font-size:18px">🌵</span>Cactus</div><div class="rh-tnav"><span class="is-on">Apps</span><span>Cactus Team</span></div>' +
        '<div class="rh-user">' + img('av-rachel.png', 'rh-av30') + '<span style="display:flex;align-items:center;gap:4px">Rachel Green' + I.chevD + '</span></div></div>' +

      // Apps page
      '<div class="rh-view" data-v="apps"><div class="rh-apps"><div class="rh-h1">Apps</div>' +
        '<div class="rh-lede">Manage the apps you\'re reviewing, check the status of any app in the Dev Center and more.</div>' +
        '<div class="rh-card" style="margin-top:18px"><div class="rh-card-h">1,342 apps<span style="margin-left:auto;display:flex;gap:12px">' +
          '<span class="rh-btn rh-btn-2" style="font-size:16px">' + I.filter + 'Add Filter</span><span class="rh-search">' + I.search + 'Search</span></span></div>' +
          '<div class="rh-fbar">Filtered by:<span class="rh-chip">Third party apps' + I.xs + '</span><span style="color:#116dff;font-size:12px;font-weight:700">Clear All</span></div>' +
          '<div class="rh-thead"><div style="width:247px">Name</div><div style="width:90px">App status</div><div style="width:104px;display:flex;gap:4px;align-items:center">Last changed<span style="color:#116dff">' + I.arrowD + '</span></div>' +
          '<div style="width:96px">Market status</div><div style="width:172px">App ID</div><div style="width:170px">Reviewer</div></div>' +
          APPS.map(appRow).join('') + '</div></div></div>' +

      // App pages (sidebar + activity or review)
      '<div class="rh-view" data-v="app">' + sidebar() +
        '<div class="rh-sub" data-s="activity"><div class="rh-main"><div class="rh-h1" style="padding-top:26px">Activity</div>' +
          '<div class="rh-lede">Keep track of this app\'s status, assign a new reviewer, check the latest submission and more.</div>' +
          '<div class="rh-card" style="margin-top:18px"><div class="rh-card-h rh-logcount">5 status changes</div>' +
            '<div class="rh-thead"><div style="width:106px">App status</div><div style="width:88px">Changed</div><div style="width:158px">Reviewer</div><div style="width:316px">Internal note</div></div>' +
            '<div class="rh-log">' + logRows(LOG) + '</div></div></div>' +
          '<div class="rh-gong">GONG! App published!<span class="rh-x">' + I.xs + '</span></div></div>' +

        '<div class="rh-sub" data-s="review"><div class="rh-main">' +
          '<div class="rh-crumbs">Activity' + I.chevR + '<b>Review</b></div>' +
          '<div class="rh-rhead"><div><div class="rh-h1">Review</div><div class="rh-lede">Create a report and send it to app developers. Any changes you make will be autosaved.</div></div>' +
            '<div style="display:flex;gap:12px;align-items:center;margin-top:2px"><span class="rh-eye">' + I.eye + '</span><span class="rh-btn rh-btn-lg" data-k="finish">Finish' + I.chevD + '</span></div></div>' +
          '<div class="rh-card" style="margin-top:24px"><div class="rh-card-h" style="padding:12px 24px">Developer notes<span class="rh-link" style="margin-left:auto">View' + I.chevD + '</span></div></div>' +
          '<div class="rh-tabs"><span class="rh-tab is-on" data-k="tab-report">Report (<span class="rh-rcount">3</span>)</span><span class="rh-tab" data-k="tab-past">Previous Activity (<span class="rh-pcount">6</span>)</span>' +
            '<span class="rh-link" data-k="add">' + I.plus + 'Add a comment</span></div>' +
          '<div class="rh-card" style="margin-top:18px"><div class="rh-card-h rh-ctitle2">Comments</div>' +
            '<div class="rh-thead"><div class="rh-rcell1">Path</div><div class="rh-rcell2">Type</div><div class="rh-rcell3">Details</div></div>' +
            '<div class="rh-list" data-l="report">' + REPORT.map(commentRow).join('') + '</div>' +
            '<div class="rh-list" data-l="past" style="display:none">' + PAST.map(pastRow).join('') + '</div></div>' +
          '</div>' +
          '<div class="rh-gong rh-gong-ok rh-moved-ban">' + I.okc + 'Comment moved to Report tab.<span class="rh-x">' + I.xs + '</span></div>' +
          '<div class="rh-menu">' + img('menu-pointer.svg', 'rh-mptr') + '<div class="rh-mi" data-k="publish">' + img('ico-rocket.svg', 'rh-mico') + 'Publish app</div><div class="rh-mi is-red">' + img('ico-dismiss.svg', 'rh-mico') + 'Decline app</div><div class="rh-mdiv"></div><div class="rh-mi" data-k="saveclose">Save and close</div></div>' +
        '</div></div>' +

      // Modals
      '<div class="rh-scrim"></div>' +
      '<div class="rh-modal" data-m="comment"><span class="rh-x">' + I.x + '</span><div class="rh-mt rh-ctitle">Add a comment to the report</div><div class="rh-ms">Tell the developer what needs changing.</div>' +
        '<div class="rh-label">Choose a path</div><div class="rh-row"><div class="rh-dd rh-dd1"><span class="rh-v">General</span>' + I.chevD + '</div>' + I.chevR +
          '<div class="rh-dd rh-dd2 is-ph"><span class="rh-v">Choose a topic</span>' + I.chevD + '<div class="rh-dd-list"><div>Installation process</div><div data-o="support">Support</div><div>Pricing</div><div>Permissions</div></div></div></div>' +
        '<div class="rh-label">Description <i>*</i></div><div class="rh-editor"><div class="rh-tool"><span>B</span><i>I</i><u>U</u>' + I.link + I.list + I.olist + '</div>' +
          '<div class="rh-text"><span class="rh-ph">Give as much detail here as you can.</span><span class="rh-typed"></span><span class="rh-caret" style="display:none"></span></div></div>' +
        '<div class="rh-check" data-k="blocker"><span class="rh-cb">' + I.check + '</span>This is a blocker</div>' +
        '<div class="rh-mfoot"><span class="rh-btn rh-btn-2">Cancel</span><span class="rh-btn" data-k="save">Save</span></div></div>' +

      '<div class="rh-modal" data-m="publish"><span class="rh-x">' + I.x + '</span><div class="rh-mt">Publish app</div><div class="rh-ms">This app will go live in the App Market and be available to Wix users.</div>' +
        '<div class="rh-steps"><span class="rh-step" data-st="1"><i>1</i>Set revenue share</span><span class="rh-step-sep">' + I.chevR + '</span>' +
          '<span class="rh-step" data-st="2"><i>2</i>Send report</span><span class="rh-step-sep">' + I.chevR + '</span><span class="rh-step" data-st="3"><i>3</i>Add internal note</span></div>' +
        '<div class="rh-pane" data-p="1"><div class="rh-label">Revenue Share <i>*</i></div><div class="rh-num">80<span style="color:#868aa5;display:flex;gap:10px;align-items:center">%<span style="color:#116dff">' + I.updown + '</span></span></div>' +
          '<div class="rh-note">Note: future edits to revenue share will need a request to the team.</div>' +
          '<div class="rh-mfoot"><span class="rh-btn rh-btn-2">Cancel</span><span class="rh-btn" data-k="next1">Next, Send Report</span></div></div>' +
        '<div class="rh-pane" data-p="2"><div class="rh-note" style="display:flex;align-items:center">Next, copy this report and send it to the developer.<span class="rh-link" style="margin-left:auto" data-k="copytext">' + I.copy + 'Copy text</span></div>' +
          '<div class="rh-report">Hi!<br>We went over your submission and below are some notes.<br><b>Page URL</b><br>Page url is localhost.<br><b>Support</b><br>Please add a support email to the app listing.<br><br>Good job!</div>' +
          '<div class="rh-mfoot"><span class="rh-link">' + I.back + 'Back</span><span class="rh-btn rh-btn-2">Cancel</span><span class="rh-btn" data-k="next2">Next, Add Internal Note</span></div></div>' +
        '<div class="rh-pane" data-p="3"><div class="rh-note">Now, add a short note explaining why this app was published.</div><div class="rh-label">Note <i>*</i></div>' +
          '<div class="rh-textarea"><span class="rh-ph">Add a short note explaining why this app was published. It\'ll show on the Activity page.</span><span class="rh-typed"></span><span class="rh-caret" style="display:none"></span></div>' +
          '<div class="rh-mfoot"><span class="rh-link">' + I.back + 'Back</span><span class="rh-btn rh-btn-2">Cancel</span><span class="rh-btn" data-k="dopublish">Publish App</span></div></div></div>' +

      '<div class="rh-tip"></div>' +
      '<div class="rh-cursor"><span class="rh-ripple"></span>' + I.cursor + '</div>' +
      '</div></div>';
  }

  function init(root) {
    build(root);
    var win = root.querySelector('.rh-win'), app = root.querySelector('.rh-app');
    var $ = function (s) { return app.querySelector(s); };
    var $$ = function (s) { return Array.prototype.slice.call(app.querySelectorAll(s)); };
    var cursor = $('.rh-cursor'), ripple = $('.rh-ripple');

    function scale() { app.style.setProperty('--rh-s', win.clientWidth / 1280); }
    scale();
    if (window.ResizeObserver) new ResizeObserver(scale).observe(win); else window.addEventListener('resize', scale);
    requestAnimationFrame(function () { root.classList.add('is-in'); });
    setTimeout(function () { root.classList.add('is-in'); }, 300);

    // Pause while off screen or in a background tab
    var visible = !window.IntersectionObserver, waiters = [];
    function setVisible(v) { visible = v; if (v) waiters.splice(0).forEach(function (f) { f(); }); }
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

    // Cursor: soft curve with ease in and out; frames drive it, a timer backs them up
    var cur = { x: 1180, y: 860 };
    function setCur(x, y) { cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)'; cur = { x: x, y: y }; updateHover(); }
    // Hover follows the cursor: whatever sits under its tip gets its hover state, nothing else does
    var ROWS_SEL = '.rh-tr', CTRL_SEL = '.rh-btn, .rh-ibtn, .rh-mi, .rh-dd-list div, .rh-link, .rh-tab, .rh-back, .rh-dd';
    function updateHover() {
      var a = app.getBoundingClientRect(), k = a.width / 1280;
      if (!k) return;
      var px = a.left + (cur.x + 3) * k, py = a.top + (cur.y + 2) * k;
      var scope = app.querySelector('.rh-modal.is-on') || app;
      var menu = app.querySelector('.rh-menu.is-on');
      function under(el) {
        if (!el.offsetParent) return false;
        if (scope !== app && !scope.contains(el)) return false;
        var r = el.getBoundingClientRect();
        return px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
      }
      app.querySelectorAll(ROWS_SEL).forEach(function (el) { el.classList.toggle('is-hover', !menu && under(el)); });
      app.querySelectorAll(CTRL_SEL).forEach(function (el) { el.classList.toggle('is-hot', under(el) && (!menu || menu.contains(el))); });
    }
    function move(x, y, d, straight) {
      d = (d || 0.9) * 1000;
      var x0 = cur.x, y0 = cur.y, dx = x - x0, dy = y - y0;
      var bend = straight ? 0 : (0.06 + Math.random() * 0.12) * (Math.random() < 0.5 ? -1 : 1);
      var cx = x0 + dx / 2 - dy * bend, cy = y0 + dy / 2 + dx * bend;
      return new Promise(function (res) {
        var t0 = Date.now(), done = false, timer = 0;
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
    function at(el, dx, dy) {
      var a = app.getBoundingClientRect(), r = el.getBoundingClientRect(), k = a.width / 1280;
      return { x: (r.left + r.width / 2 - a.left) / k + (dx || 0), y: (r.top + r.height / 2 - a.top) / k + (dy || 0) };
    }
    function moveTo(el, d, dx, dy) { var p = at(el, dx, dy); return move(p.x - 3, p.y - 2, d); }
    function click() {
      cursor.classList.add('is-down');
      ripple.classList.remove('is-go'); void ripple.offsetWidth; ripple.classList.add('is-go');
      return sleep(140).then(function () { cursor.classList.remove('is-down'); return sleep(120); });
    }
    function hot() { updateHover(); }
    async function press(el, d, dx) { await moveTo(el, d || 0.8, dx); hot(el, true); await sleep(220); await click(); hot(el, false); }
    async function type(box, text, ms) {
      box.querySelector('.rh-ph').style.display = 'none';
      var caret = box.querySelector('.rh-caret'), out = box.querySelector('.rh-typed');
      caret.style.display = 'inline-block';
      for (var i = 1; i <= text.length; i++) { out.textContent = text.slice(0, i); await sleep(ms || 38); }
    }
    function clearBox(box) { box.querySelector('.rh-ph').style.display = ''; box.querySelector('.rh-typed').textContent = ''; box.querySelector('.rh-caret').style.display = 'none'; }

    function view(v) { $$('.rh-view').forEach(function (e) { e.classList.toggle('is-on', e.dataset.v === v); }); updateHover(); }
    function sub(s) { $$('.rh-sub').forEach(function (e) { e.style.display = e.dataset.s === s ? 'block' : 'none'; }); updateHover(); }
    function modal(m) {
      $$('.rh-modal').forEach(function (e) { e.classList.toggle('is-on', e.dataset.m === m); });
      app.classList.toggle('has-modal', !!m);
      updateHover();
    }
    function sideStatus(mkt, s, rev) { $('.rh-smkt').innerHTML = market(mkt); $('.rh-sst').innerHTML = st(s); $('.rh-srev').textContent = rev; }
    function hoverRow() { updateHover(); }
    function tab(which) {
      $('[data-k="tab-report"]').classList.toggle('is-on', which === 'report');
      $('[data-k="tab-past"]').classList.toggle('is-on', which === 'past');
      $('[data-l="report"]').style.display = which === 'report' ? '' : 'none';
      $('[data-l="past"]').style.display = which === 'past' ? '' : 'none';
      $('.rh-ctitle2').textContent = which === 'past' ? 'All updates and comments from this app\'s last review.' : 'Comments';
    }
    function step(n) {
      $$('.rh-step').forEach(function (e) { e.classList.toggle('is-on', +e.dataset.st === n); });
      $$('.rh-pane').forEach(function (e) { e.classList.toggle('is-on', +e.dataset.p === n); });
    }
    function setBlocker(on) { $('[data-k="blocker"]').classList.toggle('is-on', on); }
    function popBlocker() { var cb = $('[data-k="blocker"] .rh-cb'); cb.classList.add('is-pop'); setTimeout(function () { cb.classList.remove('is-pop'); }, 200); }

    // The loop moves through the submitted apps; each round publishes the next one
    var PRIVY = 2;
    var BIG_LOGO = { 2: 'app-privy-lg.png' };
    function restoreRow(i) {
      var a = APPS[i], r = $('[data-app="' + i + '"]');
      r.querySelector('.rh-astat').innerHTML = st(a[2]); r.querySelector('.rh-amkt').innerHTML = market(a[4]); r.querySelector('.rh-arev').innerHTML = person(a[6]);
    }
    // Resets the app pages for the next app; only called while they are hidden
    function resetAppViews(i) {
      sub('activity'); modal(null); hoverRow(null);
      $('.rh-menu').classList.remove('is-on'); $$('.rh-gong').forEach(function (g) { g.classList.remove('is-on'); });
      $('.rh-log').innerHTML = logRows(LOG); $('.rh-logcount').textContent = '5 status changes';
      $('[data-l="report"]').innerHTML = REPORT.map(commentRow).join(''); $('.rh-rcount').textContent = REPORT.length;
      $('[data-l="past"]').innerHTML = PAST.map(pastRow).join(''); $('.rh-pcount').textContent = PAST.length;
      tab('report'); sideStatus(APPS[i][4], 'submitted', '-');
      $('.rh-applogo').src = BASE + (BIG_LOGO[i] || APPS[i][0]);
      $('.rh-appname').textContent = APPS[i][1];
    }

    async function loop() {
      view('apps');
      setCur(1310, 432); // just off the right edge, level with Privy
      await sleep(1600);
      for (var k = 0; ; k++) {
        var ax = PRIVY;
        resetAppViews(ax);

        // 1. Apps: open Privy (from the second round on, the cursor is already resting on it)
        var row = $('[data-app="' + ax + '"]');
        var rp = at(row.querySelector('.rh-appcell'), 10);
        await move(cur.x, rp.y - 2, 0.3, true);
        await move(rp.x - 3, rp.y - 2, 1.2, true); await sleep(350);
        await click();
        hoverRow(null); view('app');
        await sleep(2600);

        // 2. Activity log: Go to Review
        var logs = $$('.rh-log .rh-tr');
        hoverRow(logs[0]);
        await press($('[data-k="goreview"]'), 1.0);
        hoverRow(null); sub('review'); sideStatus(APPS[ax][4], 'in review', '-');
        await sleep(2600);

        // 3. Add a comment
        await press($('[data-k="add"]'), 0.9);
        $('.rh-ctitle').textContent = 'Add a comment to the report';
        $('.rh-dd1 .rh-v').textContent = 'General';
        var dd2 = $('.rh-dd2'); dd2.classList.add('is-ph'); dd2.querySelector('.rh-v').textContent = 'Choose a topic';
        clearBox($('.rh-text')); setBlocker(false);
        modal('comment');
        await sleep(700);
        await moveTo(dd2, 0.8); await click();
        dd2.classList.add('is-focus'); dd2.querySelector('.rh-dd-list').classList.add('is-on');
        await sleep(450);
        var opt = dd2.querySelector('[data-o="support"]');
        await moveTo(opt, 0.5); hot(opt, true); await sleep(200); await click();
        dd2.querySelector('.rh-dd-list').classList.remove('is-on'); dd2.classList.remove('is-focus', 'is-ph'); hot(opt, false);
        dd2.querySelector('.rh-v').textContent = 'Support';
        await sleep(300);
        var txt = $('.rh-text');
        await moveTo(txt, 0.6, -120); await click();
        $('.rh-editor').classList.add('is-focus');
        await type(txt, 'Please add a support email to the app listing.');
        await sleep(400);
        $('.rh-editor').classList.remove('is-focus'); txt.querySelector('.rh-caret').style.display = 'none';
        await press($('[data-k="save"]'), 0.8);
        modal(null);
        var list = $('[data-l="report"]');
        list.insertAdjacentHTML('afterbegin', commentRow(['c5', 'General > Support', '“Please add a support email to the app listing.”', false]));
        list.firstElementChild.classList.add('is-new');
        $('.rh-rcount').textContent = list.children.length;
        await sleep(1400);

        // 4. Previous Activity: add a past comment to the report (prefilled modal, Save, green banner)
        await press($('[data-k="tab-past"]'), 0.9);
        tab('past');
        await sleep(1600);
        var pastRowEl = $('[data-l="past"] [data-pi="' + MOVE_I + '"]');
        var pr = at(pastRowEl, 120);
        await move(pr.x - 3, pr.y - 2, 0.9);
        await sleep(500);
        await press(pastRowEl.querySelector('.rh-move'), 0.6);
        var moved = PAST[MOVE_I];
        $('.rh-ctitle').textContent = 'Add a comment to the report';
        $('.rh-dd1 .rh-v').textContent = moved[0].split(' > ')[0];
        dd2.classList.remove('is-ph'); dd2.querySelector('.rh-v').textContent = moved[0].split(' > ').pop();
        clearBox(txt); txt.querySelector('.rh-ph').style.display = 'none'; txt.querySelector('.rh-typed').textContent = moved[2].replace(/[“”]/g, '');
        setBlocker(false);
        modal('comment');
        await sleep(1500);
        await press($('[data-k="save"]'), 0.8);
        modal(null);
        pastRowEl.classList.add('is-moved');
        list.insertAdjacentHTML('afterbegin', commentRow(['m1', moved[0], moved[2], false]));
        list.firstElementChild.classList.add('is-new');
        $('.rh-rcount').textContent = list.children.length;
        $('.rh-moved-ban').classList.add('is-on');
        await sleep(2200);
        $('.rh-moved-ban').classList.remove('is-on');
        await sleep(300);

        // 5. Back to the report: both new comments are at the top
        await press($('[data-k="tab-report"]'), 0.8);
        tab('report');
        await sleep(1800);

        // 6. Finish > Save and close: back to Activity, nothing changes status, so the loop matches its start
        await press($('[data-k="finish"]'), 1.0);
        $('.rh-menu').classList.add('is-on');
        await sleep(500);
        var sc = $('[data-k="saveclose"]');
        await moveTo(sc, 0.6); await sleep(350); await click();
        $('.rh-menu').classList.remove('is-on');
        sub('activity');
        await sleep(1800);

        // 7. Back to Apps: rest on Privy; the next round opens it again
        await press($('[data-k="back"]'), 1.0);
        view('apps');
        var bp = at(row, 300);
        await move(60, bp.y - 2, 0.8, true);
        await move(bp.x - 3, bp.y - 2, 0.9, true);
        await sleep(2400);
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
      document.querySelectorAll('[data-review-hero]:not(.is-built)').forEach(function (el) {
        if (el.dataset.rhStarted) return;
        el.dataset.rhStarted = '1';
        try { init(el); el.classList.add('is-built'); } catch (e) { el.innerHTML = ''; }
      });
    }
    go();
    if (mq.addEventListener) mq.addEventListener('change', go);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
