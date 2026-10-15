(function () {
  'use strict';

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =====================================================
     3. Sliding highlight on the bottom nav
     The app re-renders the nav's innerHTML on every tab
     switch, so we re-create the pill and slide it from
     where the last one was.
     ===================================================== */
  var lastX = null;
  var lastW = null;

  function layoutPill(nav) {
    var active = nav.querySelector('button.active');
    if (!active || !active.offsetWidth) return;

    var pill = nav.querySelector('.mm-nav-pill');
    var fresh = !pill;

    if (fresh) {
      pill = document.createElement('span');
      pill.className = 'mm-nav-pill';
      pill.setAttribute('aria-hidden', 'true');
      nav.insertBefore(pill, nav.firstChild);
    }

    var x = active.offsetLeft;
    var w = active.offsetWidth;
    pill.style.top = active.offsetTop + 'px';
    pill.style.height = active.offsetHeight + 'px';

    if (fresh) {
      pill.style.transition = 'none';
      pill.style.width = (lastW === null ? w : lastW) + 'px';
      pill.style.transform = 'translateX(' + (lastX === null ? x : lastX) + 'px)';
      void pill.offsetWidth; // force reflow, then let CSS animate to the new spot
      pill.style.transition = '';
    }

    pill.style.width = w + 'px';
    pill.style.transform = 'translateX(' + x + 'px)';
    lastX = x;
    lastW = w;
    nav.classList.add('mm-has-pill');
  }

  function initNav() {
    var nav = document.getElementById('miimiid-bottom-nav');
    if (!nav) return;

    new MutationObserver(function () { layoutPill(nav); })
      .observe(nav, { childList: true });

    if (window.ResizeObserver) {
      new ResizeObserver(function () { layoutPill(nav); }).observe(nav);
    }
    window.addEventListener('resize', function () { layoutPill(nav); });
    layoutPill(nav);
  }

  /* =====================================================
     2. Home: skeleton cards while loading + count-up numbers
     ===================================================== */
  function skeletonMarkup() {
    var cards = '';
    for (var i = 0; i < 4; i++) cards += '<div class="mm-skel mm-skel-card"></div>';
    return '<div class="mm-skel-wrap" aria-hidden="true">' +
      '<div class="mm-skel-head"><div class="mm-skel mm-skel-title"></div>' +
      '<div class="mm-skel mm-skel-user"></div></div>' +
      '<div class="mm-skel-grid">' + cards + '</div></div>';
  }

  var lastStats = {};

  function animateStats(dash) {
    var cards = dash.querySelectorAll('.miimiid-dashboard-stat');
    Array.prototype.forEach.call(cards, function (card) {
      var el = card.querySelector('.miimiid-dashboard-stat-value');
      if (!el) return;

      var id = card.getAttribute('data-dashboard-stat') || '';
      var match = el.textContent.trim().match(/^(-?\d+(?:\.\d+)?)(\s*%)?$/);
      if (!match) return;

      var target = parseFloat(match[1]);
      var suffix = match[2] ? '%' : '';
      var decimals = (match[1].split('.')[1] || '').length;
      var from = Object.prototype.hasOwnProperty.call(lastStats, id) ? lastStats[id] : 0;
      lastStats[id] = target;

      if (reduce || from === target) return;

      function show(v) { return v.toFixed(decimals) + suffix; }

      el.textContent = show(from);
      var started = null;
      var duration = 800;

      function step(ts) {
        if (started === null) started = ts;
        var p = Math.min(1, (ts - started) / duration);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = show(from + (target - from) * eased);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = show(target);
      }
      requestAnimationFrame(step);
    });
  }

  function initHome() {
    var dash = document.getElementById('miimiid-dashboard');
    if (!dash) return;

    // count up every time Home renders its stats
    new MutationObserver(function () {
      if (dash.querySelector('.miimiid-dashboard-stat')) animateStats(dash);
    }).observe(dash, { childList: true });

    // skeleton: only while Home is visible, empty and still loading
    var shown = false;
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (tries > 400 || shown) { clearInterval(timer); return; }
      if (dash.classList.contains('active') && !dash.children.length && dash.offsetWidth > 0) {
        shown = true;
        dash.innerHTML = skeletonMarkup();
        // safety: never leave the skeleton up forever if loading fails
        setTimeout(function () {
          if (dash.querySelector('.mm-skel-wrap')) dash.innerHTML = '';
        }, 15000);
        clearInterval(timer);
      }
    }, 150);
  }

  /* =====================================================
     4. AI Tutor: animated "thinking" dots
     Uses the existing send button (disabled while sending)
     and the status line, so ai-tutor.js is not touched.
     ===================================================== */
  function initTutor() {
    var view = document.getElementById('miimiid-ai-tutor-view');
    if (!view) return;

    var typingRow = null;
    var wasThinking = false;

    function removeTyping() {
      if (typingRow && typingRow.parentNode) typingRow.parentNode.removeChild(typingRow);
      typingRow = null;
      view.classList.remove('mm-is-thinking');
    }

    function showTyping(messages) {
      var row = document.createElement('div');
      row.className = 'miimiid-ai-tutor-message-row assistant mm-typing-row';
      row.setAttribute('aria-hidden', 'true');

      var avatar = document.createElement('div');
      avatar.className = 'miimiid-ai-tutor-avatar';
      avatar.textContent = '\uD83E\uDD16';
      row.appendChild(avatar);

      var wrap = document.createElement('div');
      wrap.className = 'miimiid-ai-tutor-bubble-wrap';
      var bubble = document.createElement('div');
      bubble.className = 'miimiid-ai-tutor-message assistant mm-typing-bubble';
      bubble.innerHTML = '<i></i><i></i><i></i>';
      wrap.appendChild(bubble);
      row.appendChild(wrap);

      messages.appendChild(row);
      typingRow = row;
      view.classList.add('mm-is-thinking');

      var scroller = document.getElementById('ai-tutor-scroll');
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    }

    function sync() {
      var messages = document.getElementById('ai-tutor-messages');
      var send = document.getElementById('ai-tutor-send-btn');
      var status = document.getElementById('ai-tutor-status');
      if (!messages || !send) return;

      var thinking = send.disabled && !!status && status.textContent.trim() !== '';

      // the real reply landed after the dots: remove the dots
      if (typingRow && typingRow.nextSibling) removeTyping();

      if (thinking && !wasThinking) showTyping(messages);
      else if (!thinking && wasThinking) removeTyping();

      wasThinking = thinking;
    }

    new MutationObserver(sync).observe(view, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled']
    });
  }

  function init() {
    initNav();
    initHome();
    initTutor();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
