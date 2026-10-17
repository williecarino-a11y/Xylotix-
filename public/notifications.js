(function () {
  'use strict';
  if (window.__mmNotificationsInstalled) return;
  window.__mmNotificationsInstalled = true;

  /* ---------- styles ---------- */
  var style = document.createElement('style');
  style.textContent = `
.mm-bell {
  position: relative; flex: 0 0 auto; margin-left: auto; width: 44px; height: 44px;
  display: inline-flex; align-items: center; justify-content: center;
  border: 0; border-radius: 12px; background: transparent; color: #f8fafc; cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
}
.mm-bell:active { transform: scale(0.92); background: #1e293b; }
.mm-bell + .mm-avatar-btn { margin-left: 6px; }
.mm-bell-dot {
  position: absolute; top: 9px; right: 10px; width: 10px; height: 10px;
  border-radius: 50%; background: #4da3ff; border: 2px solid #0b1220;
}
.mm-bell-dot[hidden] { display: none; }

.mm-nlist { max-width: 560px; margin: 0 auto; border-top: 1px solid #1c2640; }
.mm-nitem { display: flex; flex-direction: column; gap: 4px; padding: 16px 4px; border-bottom: 1px solid #1c2640; }
.mm-ntitle { color: #f1f5f9; font-size: 1rem; font-weight: 700; }
.mm-nitem.is-unread .mm-ntitle::before {
  content: ""; display: inline-block; width: 8px; height: 8px; margin-right: 8px;
  border-radius: 50%; background: #4da3ff;
}
.mm-nbody { color: #aab6cc; font-size: 0.92rem; line-height: 1.5; }
.mm-ntime { color: #64748b; font-size: 0.8rem; }
.mm-nempty { max-width: 560px; margin: 0 auto; padding-top: 40px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
.mm-nempty h3 { margin: 0; color: #f8fafc; font-size: 1.2rem; }
`;
  document.head.appendChild(style);

  var BELL = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function api(url, options) {
    var settings = Object.assign({
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    }, options || {});
    return fetch(url, settings).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        return { ok: response.ok, status: response.status, data: data };
      });
    });
  }

  function timeAgo(value) {
    var then = new Date(value).getTime();
    if (!then) return '';
    var minutes = Math.floor((Date.now() - then) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return minutes + ' min ago';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
    var days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return days + ' days ago';
    return new Date(value).toLocaleDateString();
  }

  function setDot(show) {
    document.querySelectorAll('.mm-bell-dot').forEach(function (dot) { dot.hidden = !show; });
  }

  function refreshDot() {
    api('/api/learn/notifications/summary').then(function (r) {
      var unread = r.ok && r.data && r.data.data ? Number(r.data.data.unread) : 0;
      setDot(unread > 0);
    }).catch(function () {});
  }

  /* ---------- the Notifications page ---------- */
  function openInbox() {
    var account = window.MiimiidAccount;
    if (!account || typeof account.openSub !== 'function') return;

    account.openSub('Notifications', function (body) {
      body.innerHTML = '<div class="mm-sf"><p class="mm-sf-help">Loading...</p></div>';

      api('/api/learn/notifications').then(function (r) {
        var list = r.ok && r.data && r.data.data ? r.data.data.notifications : null;

        if (!Array.isArray(list)) {
          body.innerHTML = '<div class="mm-sf"><p class="mm-sf-help">Could not load notifications. Check your connection and try again.</p></div>';
          return;
        }

        if (!list.length) {
          body.innerHTML =
            '<div class="mm-nempty">' +
              '<h3>No notifications yet</h3>' +
              '<p class="mm-sf-help">Your daily learning reminders will show up here.</p>' +
              '<button type="button" class="mm-sf-btn" id="mm-n-setup"><span>Set up daily reminder</span></button>' +
            '</div>';
          var setup = body.querySelector('#mm-n-setup');
          setup.addEventListener('click', function () {
            if (window.MiimiidReminders && window.MiimiidReminders.openPage) window.MiimiidReminders.openPage();
          });
          return;
        }

        body.innerHTML =
          '<div class="mm-nlist">' +
          list.map(function (n) {
            return '<div class="mm-nitem' + (n.unread ? ' is-unread' : '') + '">' +
              '<span class="mm-ntitle">' + esc(n.title) + '</span>' +
              (n.body ? '<span class="mm-nbody">' + esc(n.body) + '</span>' : '') +
              '<span class="mm-ntime">' + esc(timeAgo(n.createdAt)) + '</span>' +
            '</div>';
          }).join('') +
          '</div>';

        if (list.some(function (n) { return n.unread; })) {
          api('/api/learn/notifications/read', { method: 'POST', body: '{}' }).then(function () { setDot(false); });
        }
      }).catch(function () {
        body.innerHTML = '<div class="mm-sf"><p class="mm-sf-help">Could not reach the server. Check your connection.</p></div>';
      });
    });
  }

  /* ---------- the bell in the Home header ---------- */
  function inject() {
    var header = document.querySelector('#miimiid-dashboard .miimiid-dashboard-header');
    if (!header || header.querySelector('.mm-bell')) return;

    var bell = document.createElement('button');
    bell.type = 'button';
    bell.className = 'mm-bell';
    bell.setAttribute('aria-label', 'Notifications');
    bell.innerHTML = BELL + '<span class="mm-bell-dot" hidden></span>';
    bell.addEventListener('click', openInbox);

    var avatar = header.querySelector('.mm-avatar-btn');
    if (avatar) header.insertBefore(bell, avatar);
    else header.appendChild(bell);

    refreshDot();
  }

  var dash = document.getElementById('miimiid-dashboard');
  if (dash) {
    new MutationObserver(inject).observe(dash, { childList: true });
    inject();
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && document.querySelector('.mm-bell')) refreshDot();
  });
})();
