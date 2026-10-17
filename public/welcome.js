(function () {
  'use strict';
  if (window.MiimiidWelcome) return;

  /* =====================================================
     WORDING (to add a language, copy the "en" block,
     rename it, e.g. yo, ig, ha, and translate the text)
     ===================================================== */
  var CONTENT = {
    en: {
      skip: 'Skip',
      next: 'Next',
      create: 'Create account',
      login: 'I already have an account',
      slides: [
        {
          icon: 'book',
          title: 'Learn money in minutes a day',
          text: 'Short lessons and quizzes that fit around your day, so progress feels easy.'
        },
        {
          icon: 'chart',
          title: 'Practise with your own numbers',
          text: 'Plan a budget, track savings goals and try loan and interest calculators with your own amounts.'
        },
        {
          icon: 'flame',
          title: 'Build a habit that sticks',
          text: 'A daily goal, streaks and gentle reminders keep you going. Finish a course and earn a certificate.'
        }
      ]
    }
  };

  function lang() {
    try { return typeof getSavedLanguage === 'function' ? getSavedLanguage() : 'en'; } catch (e) { return 'en'; }
  }
  function C() { return CONTENT[lang()] || CONTENT.en; }

  var ICONS = {
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    chart: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'
  };

  function icon(name) {
    return '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- styles ---------- */
  var style = document.createElement('style');
  style.textContent = `
.mm-wl {
  position: fixed; inset: 0; z-index: 3700; display: flex; flex-direction: column;
  background: #0b1220; opacity: 0; transition: opacity 0.3s ease;
}
.mm-wl.is-open { opacity: 1; }
.mm-wl-top {
  flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between;
  padding: calc(env(safe-area-inset-top, 0px) + 18px) 22px 0; max-width: 560px; width: 100%; margin: 0 auto; box-sizing: border-box;
}
.mm-wl-brand { color: #38bdf8; font-size: 1.35rem; font-weight: 800; letter-spacing: -0.01em; }
.mm-wl-skip { border: 0; background: transparent; color: #94a3b8; font-family: inherit; font-size: 0.95rem; font-weight: 600; cursor: pointer; padding: 8px 0; }
.mm-wl-stage { flex: 1; min-height: 0; overflow: hidden; display: flex; align-items: center; }
.mm-wl-track { display: flex; width: 100%; transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }
.mm-wl-slide {
  flex: 0 0 100%; box-sizing: border-box; padding: 0 28px; max-width: 560px; margin: 0 auto;
  display: flex; flex-direction: column; align-items: flex-start; gap: 16px;
}
.mm-wl-ico {
  width: 68px; height: 68px; border-radius: 20px; display: flex; align-items: center; justify-content: center;
  background: rgba(77, 163, 255, 0.12); color: #4da3ff; margin-bottom: 8px;
}
.mm-wl-title { margin: 0; color: #f8fafc; font-size: 2rem; font-weight: 800; line-height: 1.2; letter-spacing: -0.015em; }
.mm-wl-text { margin: 0; color: #94a3b8; font-size: 1.05rem; line-height: 1.6; max-width: 440px; }
.mm-wl-foot { flex: 0 0 auto; padding: 8px 22px calc(20px + env(safe-area-inset-bottom, 0px)); max-width: 560px; width: 100%; margin: 0 auto; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; }
.mm-wl-dots { display: flex; gap: 6px; margin: 0 0 18px 6px; }
.mm-wl-dot { width: 8px; height: 8px; border-radius: 8px; background: #26314d; transition: width 0.25s ease, background 0.25s ease; }
.mm-wl-dot.is-on { width: 26px; background: #4da3ff; }
.mm-wl-btn {
  width: 100%; min-height: 54px; display: flex; align-items: center; justify-content: center;
  border: 0; border-radius: 14px; background: #1f6feb; color: #fff;
  font-family: inherit; font-size: 1rem; font-weight: 700; cursor: pointer; transition: transform 0.15s ease;
}
.mm-wl-btn:active { transform: scale(0.98); }
.mm-wl-link { min-height: 48px; border: 0; background: transparent; color: #4da3ff; font-family: inherit; font-size: 0.98rem; font-weight: 600; cursor: pointer; }
.mm-wl-link[hidden], .mm-wl-skip[hidden] { display: none; }
@media (prefers-reduced-motion: reduce) { .mm-wl, .mm-wl-track, .mm-wl-dot { transition: none !important; } }
`;
  document.head.appendChild(style);

  /* ---------- the flow ---------- */
  var KEY = 'mmWelcomeSeen';
  var shownThisSession = false;

  function seen() {
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }
  function mark() {
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
  }
  function userKnown() {
    var u = window.MIIMIID_CURRENT_USER || window.currentUser || {};
    return Boolean(u.id || u._id);
  }

  function open() {
    if (document.querySelector('.mm-wl')) return;
    shownThisSession = true;

    var c = C();
    var index = 0;
    var last = c.slides.length - 1;
    var drawer = window.MiimiidDrawer;
    var pushed = false;

    var el = document.createElement('section');
    el.className = 'mm-wl';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Welcome to Miimiid');
    el.innerHTML =
      '<div class="mm-wl-top"><span class="mm-wl-brand">Miimiid</span><button type="button" class="mm-wl-skip">' + esc(c.skip) + '</button></div>' +
      '<div class="mm-wl-stage"><div class="mm-wl-track">' +
        c.slides.map(function (s) {
          return '<div class="mm-wl-slide"><div class="mm-wl-ico">' + icon(s.icon) + '</div>' +
            '<h1 class="mm-wl-title">' + esc(s.title) + '</h1><p class="mm-wl-text">' + esc(s.text) + '</p></div>';
        }).join('') +
      '</div></div>' +
      '<div class="mm-wl-foot">' +
        '<div class="mm-wl-dots">' + c.slides.map(function () { return '<span class="mm-wl-dot"></span>'; }).join('') + '</div>' +
        '<button type="button" class="mm-wl-btn" id="mm-wl-main"></button>' +
        '<button type="button" class="mm-wl-link" id="mm-wl-login" hidden>' + esc(c.login) + '</button>' +
      '</div>';
    document.body.appendChild(el);

    var track = el.querySelector('.mm-wl-track');
    var dots = el.querySelectorAll('.mm-wl-dot');
    var main = el.querySelector('#mm-wl-main');
    var loginBtn = el.querySelector('#mm-wl-login');
    var skipBtn = el.querySelector('.mm-wl-skip');

    function remove() {
      el.classList.remove('is-open');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    }

    if (drawer && typeof drawer.pushLayer === 'function') {
      drawer.pushLayer(function () { mark(); remove(); });
      pushed = true;
    }

    function dismiss(after) {
      mark();
      if (pushed && drawer && typeof drawer.close === 'function') drawer.close();
      else remove();
      if (after) setTimeout(after, 360);
    }

    function goAuth(mode) {
      dismiss(function () {
        if (typeof showMiimiidAuthMode === 'function') {
          try { showMiimiidAuthMode(mode); } catch (e) {}
        }
      });
    }

    function show(i) {
      index = Math.max(0, Math.min(last, i));
      track.style.transform = 'translateX(-' + index * 100 + '%)';
      dots.forEach(function (d, n) { d.classList.toggle('is-on', n === index); });
      var isLast = index === last;
      main.textContent = isLast ? c.create : c.next;
      loginBtn.hidden = !isLast;
      skipBtn.hidden = isLast;
    }

    main.addEventListener('click', function () {
      if (index === last) goAuth('register');
      else show(index + 1);
    });
    loginBtn.addEventListener('click', function () { goAuth('login'); });
    skipBtn.addEventListener('click', function () { dismiss(); });

    // swipe between screens
    var startX = null;
    el.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) startX = e.touches[0].clientX;
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = (e.changedTouches[0] ? e.changedTouches[0].clientX : startX) - startX;
      startX = null;
      if (dx < -50) show(index + 1);
      else if (dx > 50) show(index - 1);
    });

    show(0);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('is-open'); });
    });
  }

  /* ---------- when to show it ---------- */
  function byId(id) { return document.getElementById(id); }

  function authShowing() {
    var view = byId('miimiid-auth-view');
    var card = byId('miimiid-auth-card');
    var loading = byId('miimiid-auth-loading');
    return Boolean(
      view && !view.classList.contains('hidden') &&
      card && !card.classList.contains('hidden') &&
      (!loading || loading.classList.contains('hidden'))
    );
  }

  function check() {
    // Anyone who is (or has been) signed in never needs the welcome
    if (userKnown()) { mark(); return; }
    if (shownThisSession || seen()) return;
    // A password-reset link goes straight to the reset form
    if (/[?&]resetToken=/.test(location.search)) return;
    if (!authShowing()) return;
    open();
  }

  var view = byId('miimiid-auth-view');
  if (view) {
    new MutationObserver(check).observe(view, { attributes: true, attributeFilter: ['class'], subtree: true });
  }
  var dash = byId('miimiid-dashboard');
  if (dash) {
    new MutationObserver(function () { if (userKnown()) mark(); }).observe(dash, { childList: true });
  }
  setTimeout(check, 400);

  window.MiimiidWelcome = { open: open };
})();
