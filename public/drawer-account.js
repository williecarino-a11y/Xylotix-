(function () {
  'use strict';
  if (window.MiimiidAccount) return;

  /* ---------- styles (kept in this file so no other file needs CSS edits) ---------- */
  var CSS = `
.mm-list { border-top: 1px solid #1c2640; }
.mm-list-gap { margin-top: 28px; }
.mm-lrow {
  width: 100%; min-height: 62px; box-sizing: border-box;
  display: flex; align-items: center; gap: 12px; padding: 0 4px;
  border: 0; border-bottom: 1px solid #1c2640; background: transparent;
  color: #e6e9f0; font-family: inherit; font-size: 1rem; font-weight: 600;
  text-align: left; cursor: pointer; transition: background 0.18s ease;
}
.mm-lrow:active { background: rgba(148, 163, 184, 0.08); }
.mm-lrow.is-static { cursor: default; }
.mm-lrow.is-static:active { background: transparent; }
.mm-lrow-label { flex: 1 1 auto; }
.mm-lrow-value {
  flex: 0 1 auto; min-width: 0; max-width: 62%;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: #94a3b8; font-size: 0.95rem; font-weight: 500;
}
.mm-lrow svg { flex: 0 0 auto; color: #64748b; }
.mm-lrow.is-danger, .mm-lrow.is-danger svg { color: #f87171; }

.mm-sub {
  position: fixed; inset: 0; z-index: 3700;
  display: flex; flex-direction: column; background: #0b1220;
  opacity: 0; transform: translateX(6%);
  transition: opacity 0.25s ease, transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.mm-sub.is-open { opacity: 1; transform: translateX(0); }
.mm-sub-head {
  flex: 0 0 auto; display: flex; align-items: center; gap: 6px;
  padding: calc(env(safe-area-inset-top, 0px) + 8px) 12px 8px;
  border-bottom: 1px solid #1c2640;
}
.mm-sub-title { margin: 0; color: #f8fafc; font-size: 1.1rem; font-weight: 700; }
.mm-sub-body {
  flex: 1; overflow-y: auto; overscroll-behavior: contain;
  padding: 22px 18px calc(36px + env(safe-area-inset-bottom, 0px));
}

.mm-sf { max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }
.mm-sf-help { margin: 0; color: #94a3b8; font-size: 0.95rem; line-height: 1.55; }
.mm-sf-field { display: flex; flex-direction: column; gap: 8px; }
.mm-sf-label { color: #94a3b8; font-size: 0.85rem; font-weight: 600; }
.mm-sf-input {
  width: 100%; box-sizing: border-box; min-height: 54px; padding: 0 16px;
  border: 1px solid #26314d; border-radius: 14px; background: #111a2e;
  color: #f1f5f9; font-family: inherit; font-size: 1rem;
  transition: border-color 0.2s ease;
}
.mm-sf-input:focus { outline: none; border-color: #4da3ff; }
.mm-sf-pw { position: relative; display: block; }
.mm-sf-pw .mm-sf-input { padding-right: 52px; }
.mm-sf-eye {
  position: absolute; top: 0; right: 0; width: 52px; height: 54px;
  display: flex; align-items: center; justify-content: center;
  border: 0; background: transparent; color: #94a3b8; cursor: pointer;
}
.mm-sf-msg { min-height: 1.3em; color: #f87171; font-size: 0.92rem; line-height: 1.4; }
.mm-sf-btn {
  width: 100%; min-height: 54px; display: flex; align-items: center; justify-content: center;
  border: 0; border-radius: 14px; background: #1f6feb; color: #fff;
  font-family: inherit; font-size: 1rem; font-weight: 700; cursor: pointer;
  transition: transform 0.15s ease, opacity 0.2s ease;
}
.mm-sf-btn:active { transform: scale(0.98); }
.mm-sf-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.mm-sf-btn.is-danger { background: #dc2626; }

.mm-sf-warn { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
.mm-sf-warn .mm-sf-ico {
  width: 56px; height: 56px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(248, 113, 113, 0.14); color: #f87171;
}
.mm-sf-warn h3 { margin: 0; color: #f8fafc; font-size: 1.25rem; }
.mm-sf-list { margin: 0; padding-left: 1.2em; color: #aab6cc; font-size: 0.95rem; line-height: 1.7; }

.mm-toast {
  position: fixed; left: 50%; bottom: calc(28px + env(safe-area-inset-bottom, 0px));
  z-index: 3800; display: flex; align-items: center; gap: 10px;
  max-width: calc(100vw - 32px); padding: 12px 18px; border-radius: 999px;
  background: #1e293b; border: 1px solid #2a3552; color: #f1f5f9;
  font-size: 0.95rem; font-weight: 600; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
  opacity: 0; transform: translate(-50%, 12px); pointer-events: none;
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.mm-toast.is-show { opacity: 1; transform: translate(-50%, 0); }
.mm-toast svg { color: #4ade80; flex: 0 0 auto; }

@media (prefers-reduced-motion: reduce) {
  .mm-sub, .mm-toast { transition: none !important; }
}
`;
  var styleEl = document.createElement('style');
  styleEl.id = 'mm-account-style';
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ---------- helpers ---------- */
  var ICONS = {
    chevron: '<polyline points="9 18 15 12 9 6"/>',
    back: '<polyline points="15 18 9 12 15 6"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
    warn: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
  };

  function svg(name, size) {
    var s = size || 22;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function user() { return window.MIIMIID_CURRENT_USER || window.currentUser || {}; }
  function emailOf(u) { return typeof u.email === 'string' ? u.email : ''; }
  function nameOf(u) {
    var n = u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || (emailOf(u) ? emailOf(u).split('@')[0] : '');
    return String(n || '').trim();
  }
  function displayName(u) { return nameOf(u) || 'Your account'; }
  function initialOf(u) { return (nameOf(u).charAt(0) || 'M').toUpperCase(); }

  function post(url, payload) {
    return fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        return { ok: response.ok, status: response.status, data: data };
      });
    });
  }

  function errorText(r, fallback) {
    return (r && r.data && r.data.message) || fallback;
  }

  var toastTimer = null;
  function toast(text) {
    var old = document.querySelector('.mm-toast');
    if (old) old.parentNode.removeChild(old);
    clearTimeout(toastTimer);
    var el = document.createElement('div');
    el.className = 'mm-toast';
    el.setAttribute('role', 'status');
    el.innerHTML = svg('check', 18) + '<span>' + esc(text) + '</span>';
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('is-show'); });
    });
    toastTimer = setTimeout(function () {
      el.classList.remove('is-show');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }, 2400);
  }

  function applyUser(fresh) {
    var a = window.MIIMIID_CURRENT_USER;
    var b = window.currentUser;
    if (a) Object.assign(a, fresh);
    if (b && b !== a) Object.assign(b, fresh);
    if (!a && !b) { window.MIIMIID_CURRENT_USER = window.currentUser = fresh; }
    var initial = initialOf(user());
    document.querySelectorAll('.mm-avatar-btn').forEach(function (el) { el.textContent = initial; });
  }

  /* ---------- sub pages (full screen, with the Android back button) ---------- */
  function openSub(title, build) {
    var drawer = window.MiimiidDrawer;
    if (!drawer || typeof drawer.pushLayer !== 'function') return;

    var el = document.createElement('section');
    el.className = 'mm-sub';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', title);
    el.innerHTML =
      '<header class="mm-sub-head">' +
        '<button type="button" class="mm-icon-btn" aria-label="Back">' + svg('back', 24) + '</button>' +
        '<h2 class="mm-sub-title">' + esc(title) + '</h2>' +
      '</header>' +
      '<div class="mm-sub-body"></div>';
    document.body.appendChild(el);

    el.querySelector('button').addEventListener('click', function () { drawer.close(); });

    drawer.pushLayer(function () {
      el.classList.remove('is-open');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    });

    build(el.querySelector('.mm-sub-body'));

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('is-open'); });
    });
  }

  function textField(id, label, value, auto) {
    return '<label class="mm-sf-field"><span class="mm-sf-label">' + esc(label) + '</span>' +
      '<input class="mm-sf-input" id="' + id + '" type="text" maxlength="50" autocomplete="' + auto + '" value="' + esc(value) + '"></label>';
  }

  function passwordField(id, label, auto) {
    return '<label class="mm-sf-field"><span class="mm-sf-label">' + esc(label) + '</span>' +
      '<span class="mm-sf-pw"><input class="mm-sf-input" id="' + id + '" type="password" autocomplete="' + auto + '">' +
      '<button type="button" class="mm-sf-eye" aria-label="Show password" data-eye="' + id + '">' + svg('eye', 20) + '</button></span></label>';
  }

  function wireEyes(form) {
    form.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('[data-eye]') : null;
      if (!btn) return;
      var input = form.querySelector('#' + btn.getAttribute('data-eye'));
      if (!input) return;
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = svg(show ? 'eyeoff' : 'eye', 20);
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  }

  function setBusy(btn, on, label) {
    btn.disabled = on;
    btn.querySelector('span').textContent = on ? 'Please wait...' : label;
  }

  /* ----- Edit name ----- */
  function openName() {
    var u = user();
    openSub('Edit name', function (body) {
      body.innerHTML =
        '<form class="mm-sf" novalidate>' +
          '<p class="mm-sf-help">This is the name shown across Miimiid.</p>' +
          textField('mm-sf-first', 'First name', u.firstName || '', 'given-name') +
          textField('mm-sf-last', 'Last name', u.lastName || '', 'family-name') +
          '<div class="mm-sf-msg" role="alert"></div>' +
          '<button type="submit" class="mm-sf-btn" disabled><span>Save</span></button>' +
        '</form>';

      var form = body.querySelector('form');
      var first = form.querySelector('#mm-sf-first');
      var last = form.querySelector('#mm-sf-last');
      var msg = form.querySelector('.mm-sf-msg');
      var btn = form.querySelector('button[type="submit"]');

      function sync() {
        var f = first.value.trim();
        var l = last.value.trim();
        btn.disabled = !(f && l && (f !== (u.firstName || '') || l !== (u.lastName || '')));
      }
      first.addEventListener('input', sync);
      last.addEventListener('input', sync);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (btn.disabled) return;
        msg.textContent = '';
        setBusy(btn, true, 'Save');
        post('/api/auth/account/profile', {
          firstName: first.value.trim(),
          lastName: last.value.trim()
        }).then(function (r) {
          var fresh = r.data && r.data.data && r.data.data.user;
          if (r.ok && fresh) {
            applyUser(fresh);
            window.MiimiidDrawer.close();
            renderProfile(profileBody);
            toast('Name updated');
          } else {
            setBusy(btn, false, 'Save');
            msg.textContent = errorText(r, 'Unable to update your name.');
          }
        }).catch(function () {
          setBusy(btn, false, 'Save');
          msg.textContent = 'Could not reach the server. Check your connection.';
        });
      });
    });
  }

  /* ----- Change password ----- */
  function openPassword() {
    openSub('Change password', function (body) {
      body.innerHTML =
        '<form class="mm-sf" novalidate>' +
          '<p class="mm-sf-help">Choose a strong password you do not use anywhere else. You stay signed in here, and other devices are signed out.</p>' +
          passwordField('mm-sf-cur', 'Current password', 'current-password') +
          passwordField('mm-sf-new', 'New password', 'new-password') +
          passwordField('mm-sf-conf', 'Confirm new password', 'new-password') +
          '<div class="mm-sf-msg" role="alert"></div>' +
          '<button type="submit" class="mm-sf-btn" disabled><span>Update password</span></button>' +
        '</form>' +
        '<p class="mm-sf-help" style="max-width:560px;margin:18px auto 0;">Signed up with Google and never set a password? Use Forgot password on the sign-in screen once to create one.</p>';

      var form = body.querySelector('form');
      var cur = form.querySelector('#mm-sf-cur');
      var nw = form.querySelector('#mm-sf-new');
      var conf = form.querySelector('#mm-sf-conf');
      var msg = form.querySelector('.mm-sf-msg');
      var btn = form.querySelector('button[type="submit"]');

      wireEyes(form);

      function sync() { btn.disabled = !(cur.value && nw.value && conf.value); }
      [cur, nw, conf].forEach(function (el) { el.addEventListener('input', sync); });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (btn.disabled) return;
        if (nw.value !== conf.value) { msg.textContent = 'The new passwords do not match.'; return; }
        msg.textContent = '';
        setBusy(btn, true, 'Update password');
        post('/api/auth/account/change-password', {
          currentPassword: cur.value,
          newPassword: nw.value
        }).then(function (r) {
          if (r.ok && r.data && r.data.status === 'success') {
            window.MiimiidDrawer.close();
            toast('Password updated');
          } else {
            setBusy(btn, false, 'Update password');
            msg.textContent = errorText(r, 'Unable to change your password.');
          }
        }).catch(function () {
          setBusy(btn, false, 'Update password');
          msg.textContent = 'Could not reach the server. Check your connection.';
        });
      });
    });
  }

  /* ----- Delete account ----- */
  function openDelete() {
    openSub('Delete account', function (body) {
      body.innerHTML =
        '<form class="mm-sf" novalidate>' +
          '<div class="mm-sf-warn">' +
            '<span class="mm-sf-ico">' + svg('warn', 28) + '</span>' +
            '<h3>Delete your account?</h3>' +
          '</div>' +
          '<p class="mm-sf-help">This is permanent and cannot be undone. We will delete:</p>' +
          '<ul class="mm-sf-list">' +
            '<li>Your account and sign-in details</li>' +
            '<li>Your learning progress and quiz results</li>' +
            '<li>Your Fun Center progress and rewards</li>' +
          '</ul>' +
          passwordField('mm-sf-pw', 'Your password', 'current-password') +
          '<label class="mm-sf-field"><span class="mm-sf-label">Type DELETE to confirm</span>' +
            '<input class="mm-sf-input" id="mm-sf-confirm" type="text" autocomplete="off" autocapitalize="characters"></label>' +
          '<div class="mm-sf-msg" role="alert"></div>' +
          '<button type="submit" class="mm-sf-btn is-danger" disabled><span>Delete my account</span></button>' +
        '</form>';

      var form = body.querySelector('form');
      var pw = form.querySelector('#mm-sf-pw');
      var confirm = form.querySelector('#mm-sf-confirm');
      var msg = form.querySelector('.mm-sf-msg');
      var btn = form.querySelector('button[type="submit"]');

      wireEyes(form);

      function sync() { btn.disabled = !(pw.value && confirm.value.trim() === 'DELETE'); }
      pw.addEventListener('input', sync);
      confirm.addEventListener('input', sync);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (btn.disabled) return;
        msg.textContent = '';
        setBusy(btn, true, 'Delete my account');
        post('/api/auth/account/delete', { password: pw.value, confirm: 'DELETE' }).then(function (r) {
          if (r.ok && r.data && r.data.status === 'success') {
            window.location.replace('/');
          } else {
            setBusy(btn, false, 'Delete my account');
            sync();
            msg.textContent = errorText(r, 'Unable to delete your account.');
          }
        }).catch(function () {
          setBusy(btn, false, 'Delete my account');
          sync();
          msg.textContent = 'Could not reach the server. Check your connection.';
        });
      });
    });
  }

  /* ---------- the Profile settings page ---------- */
  var profileBody = null;

  function row(attrs, label, value, chevron) {
    var tag = attrs.indexOf('data-acc') !== -1 ? 'button type="button"' : 'div';
    var end = tag === 'div' ? 'div' : 'button';
    return '<' + tag + ' class="mm-lrow ' + (attrs.indexOf('data-acc') === -1 ? 'is-static ' : '') + (attrs.indexOf('danger') !== -1 ? 'is-danger' : '') + '" ' + attrs.replace('danger', '') + '>' +
      '<span class="mm-lrow-label">' + esc(label) + '</span>' +
      (value ? '<span class="mm-lrow-value">' + esc(value) + '</span>' : '') +
      (chevron ? svg('chevron', 20) : '') +
      '</' + end + '>';
  }

  function renderProfile(body) {
    if (!body) return;
    profileBody = body;
    var u = user();

    body.innerHTML =
      '<div class="mm-profile-hero">' +
        '<span class="mm-avatar mm-avatar-lg">' + esc(initialOf(u)) + '</span>' +
        '<h3>' + esc(displayName(u)) + '</h3>' +
        (emailOf(u) ? '<p>' + esc(emailOf(u)) + '</p>' : '') +
      '</div>' +
      '<div class="mm-label">Account</div>' +
      '<div class="mm-list">' +
        row('data-acc="name"', 'Name', displayName(u), true) +
        row('', 'Email', emailOf(u), false) +
        row('data-acc="password"', 'Password', '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022', true) +
      '</div>' +
      '<div class="mm-list mm-list-gap">' +
        row('data-acc="delete" danger', 'Delete account', '', true) +
      '</div>';

    body.onclick = function (event) {
      var target = event.target.closest ? event.target.closest('[data-acc]') : null;
      if (!target) return;
      var which = target.getAttribute('data-acc');
      if (which === 'name') openName();
      else if (which === 'password') openPassword();
      else if (which === 'delete') openDelete();
    };
  }

  window.MiimiidAccount = { renderProfile: renderProfile, openSub: openSub, toast: toast };
})();
