(function () {
  'use strict';

  /* =====================================================
     MIIMIID DRAWER
     Left menu (like Claude / ChatGPT) with full-screen pages:
     Profile, Settings, App theme, Miimiid Pro, Support center,
     Privacy policy, Terms & conditions, and Sign out.
     Content lives in public/drawer-pages.js.
     ===================================================== */

  if (window.__mmDrawerInstalled) return;
  window.__mmDrawerInstalled = true;

  var CFG = window.MIIMIID_DRAWER_CONFIG || {};
  var PAGES = window.MIIMIID_DRAWER_PAGES || {};

  /* ---------- helpers ---------- */
  var ICONS = {
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    settings: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.9" y1="4.9" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.1" y2="19.1"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.9" y1="19.1" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.1" y2="4.9"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/>',
    star: '<polygon points="12 2 15.1 8.6 22 9.3 16.8 14 18.2 21 12 17.5 5.8 21 7.2 14 2 9.3 8.9 8.6 12 2"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    back: '<polyline points="15 18 9 12 15 6"/>',
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>'
  };

  function icon(name, size) {
    var s = size || 22;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function currentUser() {
    return window.MIIMIID_CURRENT_USER || window.currentUser || {};
  }
  function emailOf(u) { return typeof u.email === 'string' ? u.email : ''; }
  function nameOf(u) {
    var n = u.name || u.username || (emailOf(u) ? emailOf(u).split('@')[0] : '');
    return String(n || '').trim();
  }
  function displayName(u) { return nameOf(u) || 'Your account'; }
  function initialOf(u) { return (nameOf(u).charAt(0) || 'M').toUpperCase(); }

  function hapticsOn() {
    try { return localStorage.getItem('mmHaptics') !== 'off'; } catch (e) { return true; }
  }
  function setHaptics(on) {
    try { localStorage.setItem('mmHaptics', on ? 'on' : 'off'); } catch (e) {}
  }

  /* ---------- build the drawer + page shell ---------- */
  var root = document.createElement('div');
  root.id = 'mm-drawer-root';
  root.innerHTML =
    '<div class="mm-layer-backdrop" id="mm-backdrop"></div>' +
    '<aside class="mm-drawer" id="mm-drawer" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden="true">' +
      '<div class="mm-drawer-top">' +
        '<span class="mm-drawer-brand">Miimiid</span>' +
        '<button type="button" class="mm-icon-btn" id="mm-drawer-close" aria-label="Close menu">' + icon('x', 22) + '</button>' +
      '</div>' +
      '<div class="mm-drawer-scroll" id="mm-drawer-scroll"></div>' +
      '<div class="mm-drawer-foot">' +
        '<button type="button" class="mm-row mm-danger" id="mm-signout">' + icon('logout', 22) + '<span>Sign out</span></button>' +
      '</div>' +
    '</aside>' +
    '<section class="mm-sheet" id="mm-sheet" role="dialog" aria-modal="true" aria-hidden="true">' +
      '<header class="mm-sheet-head">' +
        '<button type="button" class="mm-icon-btn" id="mm-sheet-back" aria-label="Back">' + icon('back', 24) + '</button>' +
        '<h2 class="mm-sheet-title" id="mm-sheet-title"></h2>' +
      '</header>' +
      '<div class="mm-sheet-body" id="mm-sheet-body"></div>' +
      '<div id="mm-lang-holder" hidden></div>' +
    '</section>';
  document.body.appendChild(root);

  var drawerEl = document.getElementById('mm-drawer');
  var drawerScroll = document.getElementById('mm-drawer-scroll');
  var sheetEl = document.getElementById('mm-sheet');
  var sheetTitle = document.getElementById('mm-sheet-title');
  var sheetBody = document.getElementById('mm-sheet-body');
  var signoutBtn = document.getElementById('mm-signout');

  /* The existing language selector moves into Settings. It is parked in a
     hidden holder so it keeps working (and is never wiped by the old menu). */
  var langHolder = document.getElementById('mm-lang-holder');
  var langSel = document.getElementById('language-selector');
  if (langSel && langHolder) langHolder.appendChild(langSel);

  function stashLanguage() {
    if (langSel && langHolder && langSel.parentNode !== langHolder) langHolder.appendChild(langSel);
  }

  /* ---------- layers + Android back button ---------- */
  var layers = [];
  var stashTimer = null;

  function syncBody() {
    document.body.classList.toggle('mm-layer-open', layers.length > 0);
  }

  function pushLayer(name) {
    layers.push(name);
    try { history.pushState({ mmLayer: layers.length }, ''); } catch (e) {}
    syncBody();
  }

  function closeTop() {
    var name = layers.pop();
    if (name === 'sheet') {
      root.classList.remove('mm-sheet-open');
      sheetEl.setAttribute('aria-hidden', 'true');
      clearTimeout(stashTimer);
      stashTimer = setTimeout(stashLanguage, 340);
    } else if (name === 'drawer') {
      root.classList.remove('mm-drawer-open');
      drawerEl.setAttribute('aria-hidden', 'true');
    }
    syncBody();
  }

  // closing from the UI goes through history so the back stack stays correct
  function closeFromUI() {
    if (!layers.length) return;
    var before = layers.length;
    try { history.back(); } catch (e) { closeTop(); return; }
    setTimeout(function () { if (layers.length === before) closeTop(); }, 150);
  }

  window.addEventListener('popstate', function () {
    if (layers.length) closeTop();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && layers.length) closeFromUI();
  });

  /* ---------- drawer ---------- */
  var MENU = [
    [
      { id: 'profile', icon: 'user', label: 'Profile settings' },
      { id: 'settings', icon: 'settings', label: 'Settings' },
      { id: 'theme', icon: 'moon', label: 'App theme' },
      { id: 'pro', icon: 'star', label: 'Miimiid Pro', badge: 'Soon' }
    ],
    [
      { id: 'support', icon: 'help', label: 'Support center' },
      { id: 'privacy', icon: 'shield', label: 'Privacy policy' },
      { id: 'terms', icon: 'file', label: 'Terms & conditions' }
    ]
  ];

  function renderDrawer() {
    var u = currentUser();
    var html =
      '<button type="button" class="mm-profile-card" data-open="profile">' +
        '<span class="mm-avatar">' + esc(initialOf(u)) + '</span>' +
        '<span class="mm-profile-text"><strong>' + esc(displayName(u)) + '</strong>' +
        (emailOf(u) ? '<small>' + esc(emailOf(u)) + '</small>' : '') + '</span>' +
      '</button>';

    MENU.forEach(function (group) {
      html += '<div class="mm-divider"></div><div class="mm-group">';
      group.forEach(function (item) {
        html += '<button type="button" class="mm-row" data-open="' + item.id + '">' +
          icon(item.icon, 22) + '<span>' + esc(item.label) + '</span>' +
          (item.badge ? '<span class="mm-badge">' + esc(item.badge) + '</span>' : '') +
        '</button>';
      });
      html += '</div>';
    });
    drawerScroll.innerHTML = html;
  }

  function openDrawer() {
    if (layers.indexOf('drawer') !== -1) return;
    renderDrawer();
    resetSignout();
    pushLayer('drawer');
    root.classList.add('mm-drawer-open');
    drawerEl.setAttribute('aria-hidden', 'false');
  }

  document.getElementById('mm-backdrop').addEventListener('click', closeFromUI);
  document.getElementById('mm-drawer-close').addEventListener('click', closeFromUI);
  document.getElementById('mm-sheet-back').addEventListener('click', closeFromUI);

  drawerScroll.addEventListener('click', function (event) {
    var target = event.target.closest ? event.target.closest('[data-open]') : null;
    if (target) openSheet(target.getAttribute('data-open'));
  });

  // swipe the drawer to the left to close it
  (function () {
    var startX = null;
    var dx = 0;
    drawerEl.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      dx = 0;
    }, { passive: true });
    drawerEl.addEventListener('touchmove', function (e) {
      if (startX === null) return;
      dx = Math.min(0, e.touches[0].clientX - startX);
      if (dx < -10) {
        drawerEl.style.transition = 'none';
        drawerEl.style.transform = 'translateX(' + dx + 'px)';
      }
    }, { passive: true });
    drawerEl.addEventListener('touchend', function () {
      if (startX === null) return;
      drawerEl.style.transition = '';
      drawerEl.style.transform = '';
      if (dx < -70) closeFromUI();
      startX = null;
      dx = 0;
    });
  })();

  /* ---------- sign out (tap twice to confirm) ---------- */
  var signoutTimer = null;
  var signoutArmed = false;

  function resetSignout() {
    clearTimeout(signoutTimer);
    signoutArmed = false;
    signoutBtn.querySelector('span').textContent = 'Sign out';
  }

  function doLogout() {
    try {
      if (typeof window.logoutMiimiid === 'function') { window.logoutMiimiid(); return; }
    } catch (e) {}
    var fallback = document.getElementById('miimiid-logout-btn');
    if (fallback) fallback.click();
  }

  signoutBtn.addEventListener('click', function () {
    if (!signoutArmed) {
      signoutArmed = true;
      signoutBtn.querySelector('span').textContent = 'Tap again to sign out';
      signoutTimer = setTimeout(resetSignout, 3000);
      return;
    }
    resetSignout();
    closeFromUI();
    setTimeout(doLogout, 80);
  });

  /* ---------- pages ---------- */
  function kv(label, value) {
    return '<div class="mm-kv"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong></div>';
  }

  // Turns plain text into paragraphs. Lines starting with "- " become bullet points.
  function richText(text) {
    var lines = String(text == null ? '' : text).split('\n');
    var out = '';
    var inList = false;
    lines.forEach(function (line) {
      var t = line.trim();
      if (!t) return;
      if (t.indexOf('- ') === 0) {
        if (!inList) { out += '<ul>'; inList = true; }
        out += '<li>' + esc(t.slice(2)) + '</li>';
      } else {
        if (inList) { out += '</ul>'; inList = false; }
        out += '<p>' + esc(t) + '</p>';
      }
    });
    if (inList) out += '</ul>';
    return out;
  }

  var PAGE_DEFS = {
    profile: {
      title: 'Profile settings',
      render: function (body) {
        if (window.MiimiidAccount) { window.MiimiidAccount.renderProfile(body); return; }
        var u = currentUser();
        body.innerHTML =
          '<div class="mm-profile-hero">' +
            '<span class="mm-avatar mm-avatar-lg">' + esc(initialOf(u)) + '</span>' +
            '<h3>' + esc(displayName(u)) + '</h3>' +
            (emailOf(u) ? '<p>' + esc(emailOf(u)) + '</p>' : '') +
          '</div>';
      }
    },

    settings: {
      title: 'Settings',
      render: function (body) {
        var on = hapticsOn();
        body.innerHTML =
          '<div class="mm-label">General</div>' +
          '<div class="mm-card">' +
            '<div class="mm-setting">' +
              '<div class="mm-setting-head">' + icon('globe', 20) + '<span>Language</span></div>' +
              '<div class="miimiid-drawer-language-slot" id="mm-lang-slot"></div>' +
            '</div>' +
            '<div class="mm-setting mm-setting-line">' +
              '<div class="mm-setting-head">' + icon('phone', 20) + '<span>Haptic feedback</span></div>' +
              '<button type="button" class="mm-switch" id="mm-haptics" role="switch" aria-label="Haptic feedback" aria-checked="' + on + '"><i></i></button>' +
            '</div>' +
          '</div>';

        var slot = body.querySelector('#mm-lang-slot');
        if (slot && langSel) slot.appendChild(langSel);

        var toggle = body.querySelector('#mm-haptics');
        toggle.addEventListener('click', function () {
          var next = toggle.getAttribute('aria-checked') !== 'true';
          toggle.setAttribute('aria-checked', String(next));
          setHaptics(next);
          if (next && navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
        });
      }
    },

    theme: {
      title: 'App theme',
      render: function (body) {
        body.innerHTML =
          '<div class="mm-label">Appearance</div>' +
          '<div class="mm-card">' +
            '<div class="mm-option is-selected">' + icon('moon', 20) + '<span>Dark</span>' + icon('check', 20) + '</div>' +
            '<div class="mm-option is-disabled">' + icon('sun', 20) + '<span>Light</span><span class="mm-badge">Coming soon</span></div>' +
            '<div class="mm-option is-disabled">' + icon('phone', 20) + '<span>Match device</span><span class="mm-badge">Coming soon</span></div>' +
          '</div>' +
          '<p class="mm-note">Miimiid uses the dark theme everywhere for now.</p>';
      }
    },

    pro: {
      title: 'Miimiid Pro',
      render: function (body) {
        var features = Array.isArray(PAGES.proFeatures) ? PAGES.proFeatures : [];
        body.innerHTML =
          '<div class="mm-pro-hero">' +
            '<span class="mm-pro-icon">' + icon('star', 26) + '</span>' +
            '<h3>Miimiid Pro</h3>' +
            '<span class="mm-badge">Coming soon</span>' +
            '<p>Pro is not available yet. When it launches, you will find it here.</p>' +
          '</div>' +
          (features.length
            ? '<div class="mm-label">What we are planning</div><div class="mm-card">' +
              features.map(function (f) {
                return '<div class="mm-feature">' + icon('check', 18) +
                  '<div><strong>' + esc(f.title) + '</strong><small>' + esc(f.text) + '</small></div></div>';
              }).join('') + '</div>'
            : '');
      }
    },

    support: {
      title: 'Support center',
      render: function (body) {
        var faq = Array.isArray(PAGES.faq) ? PAGES.faq : [];
        var intro = PAGES.supportIntro;
        var commit = PAGES.supportCommitment;
        var u = currentUser();
        var html = '';

        if (intro) {
          html +=
            '<div class="mm-support-hero">' +
              '<span class="mm-pro-icon">' + icon('help', 26) + '</span>' +
              '<h3>' + esc(intro.title) + '</h3>' +
              (intro.lead ? '<p class="mm-support-lead">' + esc(intro.lead) + '</p>' : '') +
              richText(intro.text) +
            '</div>';
        }

        html +=
          '<div class="mm-label">Common questions</div>' +
          '<div class="mm-card mm-faq">' +
            faq.map(function (item) {
              return '<details><summary>' + esc(item.q) + '</summary>' +
                '<div class="mm-answer">' + richText(item.a) + '</div></details>';
            }).join('') +
          '</div>';

        if (commit) {
          html +=
            '<div class="mm-label">' + esc(commit.title) + '</div>' +
            '<div class="mm-card mm-commit">' + richText(commit.text) + '</div>';
        }

        var email = typeof CFG.supportEmail === 'string' ? CFG.supportEmail.trim() : '';
        if (email) {
          var bodyText = '\n\n---\nAccount: ' + (emailOf(u) || 'unknown');
          var href = 'mailto:' + encodeURIComponent(email).replace('%40', '@') +
            '?subject=' + encodeURIComponent('Miimiid support') +
            '&body=' + encodeURIComponent(bodyText);
          html += '<a class="mm-btn" href="' + esc(href) + '">' + icon('mail', 20) + '<span>Email support</span></a>';
        }
        body.innerHTML = html;
      }
    },
    
    privacy: {
      title: 'Privacy policy',
      render: function (body) { body.innerHTML = '<div class="mm-prose">' + (PAGES.privacy || '') + '</div>'; }
    },

    terms: {
      title: 'Terms & conditions',
      render: function (body) { body.innerHTML = '<div class="mm-prose">' + (PAGES.terms || '') + '</div>'; }
    }
  };

  function openSheet(id) {
    var def = PAGE_DEFS[id];
    if (!def) return;

    clearTimeout(stashTimer);
    stashLanguage(); // park the language selector before the page is rebuilt
    sheetTitle.textContent = def.title;
    def.render(sheetBody);
    sheetBody.scrollTop = 0;

    var drawerIndex = layers.indexOf('drawer');
    if (drawerIndex !== -1) {
      // the drawer hands its history entry to the page
      root.classList.remove('mm-drawer-open');
      drawerEl.setAttribute('aria-hidden', 'true');
      layers[drawerIndex] = 'sheet';
      syncBody();
    } else if (layers.indexOf('sheet') === -1) {
      pushLayer('sheet');
    }
    root.classList.add('mm-sheet-open');
    sheetEl.setAttribute('aria-hidden', 'false');
  }

  /* ---------- Home header: menu button + avatar ---------- */
  function injectHeaderButtons() {
    var header = document.querySelector('#miimiid-dashboard .miimiid-dashboard-header');
    if (!header) return;

    var u = currentUser();
    var avatar = header.querySelector('.mm-avatar-btn');
    if (avatar) { avatar.textContent = initialOf(u); }

    if (!header.querySelector('.mm-burger')) {
      var burger = document.createElement('button');
      burger.type = 'button';
      burger.className = 'mm-burger';
      burger.setAttribute('aria-label', 'Open menu');
      burger.innerHTML = icon('menu', 26);
      burger.addEventListener('click', openDrawer);
      header.insertBefore(burger, header.firstChild);
    }

    if (!avatar) {
      avatar = document.createElement('button');
      avatar.type = 'button';
      avatar.className = 'mm-avatar-btn';
      avatar.setAttribute('aria-label', 'Profile settings');
      avatar.textContent = initialOf(u);
      avatar.addEventListener('click', function () { openSheet('profile'); });
      header.appendChild(avatar);
    }
  }

  var dash = document.getElementById('miimiid-dashboard');
  if (dash) {
    new MutationObserver(injectHeaderButtons).observe(dash, { childList: true });
    injectHeaderButtons();
  }

  // the old header menu button (if it is ever visible) opens this drawer too
  document.addEventListener('click', function (event) {
    var old = event.target.closest ? event.target.closest('#miimiid-menu-toggle') : null;
    if (!old) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openDrawer();
  }, true);

  window.MiimiidDrawer = { open: openDrawer, openPage: openSheet, close: closeFromUI };
})();
