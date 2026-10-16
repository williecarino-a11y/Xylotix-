(function () {
  'use strict';
  if (window.MiimiidAccount) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function user() { return window.MIIMIID_CURRENT_USER || window.currentUser || {}; }

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

  function say(el, text, ok) {
    el.textContent = text || '';
    el.className = 'mm-form-msg' + (text ? (ok ? ' is-ok' : ' is-error') : '');
  }

  function busy(btn, on, label) {
    btn.disabled = on;
    btn.querySelector('span').textContent = on ? 'Please wait...' : label;
  }

  function errorText(r, fallback) {
    return (r && r.data && r.data.message) || fallback;
  }

  function initialOf(u) {
    var n = String(u.name || u.firstName || u.email || '').trim();
    return (n.charAt(0) || 'M').toUpperCase();
  }

  function mount(body) {
    var u = user();
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="mm-label">Edit name</div>' +
      '<div class="mm-card"><form class="mm-form" id="mm-name-form" novalidate>' +
        '<label class="mm-field"><span>First name</span><input class="mm-input" id="mm-first" type="text" maxlength="50" autocomplete="given-name" value="' + esc(u.firstName || '') + '"></label>' +
        '<label class="mm-field"><span>Last name</span><input class="mm-input" id="mm-last" type="text" maxlength="50" autocomplete="family-name" value="' + esc(u.lastName || '') + '"></label>' +
        '<div class="mm-form-msg" id="mm-name-msg"></div>' +
        '<button type="submit" class="mm-btn"><span>Save name</span></button>' +
      '</form></div>' +

      '<div class="mm-label">Change password</div>' +
      '<div class="mm-card"><form class="mm-form" id="mm-pw-form" novalidate>' +
        '<label class="mm-field"><span>Current password</span><input class="mm-input" id="mm-pw-current" type="password" autocomplete="current-password"></label>' +
        '<label class="mm-field"><span>New password</span><input class="mm-input" id="mm-pw-new" type="password" autocomplete="new-password"></label>' +
        '<label class="mm-field"><span>Confirm new password</span><input class="mm-input" id="mm-pw-confirm" type="password" autocomplete="new-password"></label>' +
        '<div class="mm-form-msg" id="mm-pw-msg"></div>' +
        '<button type="submit" class="mm-btn"><span>Change password</span></button>' +
      '</form></div>' +
      '<p class="mm-note">Signed up with Google and never set a password? Use Forgot password on the sign-in screen once to create one.</p>' +

      '<div class="mm-label">Delete account</div>' +
      '<div class="mm-card"><form class="mm-form" id="mm-del-form" novalidate>' +
        '<p class="mm-form-note">This permanently deletes your account, your learning progress and your Fun Center data. It cannot be undone.</p>' +
        '<label class="mm-field"><span>Your password</span><input class="mm-input" id="mm-del-pw" type="password" autocomplete="current-password"></label>' +
        '<label class="mm-field"><span>Type DELETE to confirm</span><input class="mm-input" id="mm-del-confirm" type="text" autocomplete="off" autocapitalize="characters"></label>' +
        '<div class="mm-form-msg" id="mm-del-msg"></div>' +
        '<button type="submit" class="mm-btn mm-btn-danger" id="mm-del-btn" disabled><span>Delete my account</span></button>' +
      '</form></div>';
    body.appendChild(wrap);

    /* ----- edit name ----- */
    var nameForm = wrap.querySelector('#mm-name-form');
    var nameMsg = wrap.querySelector('#mm-name-msg');
    nameForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = nameForm.querySelector('button');
      var first = wrap.querySelector('#mm-first').value.trim();
      var last = wrap.querySelector('#mm-last').value.trim();
      if (!first || !last) { say(nameMsg, 'Enter your first and last name.', false); return; }
      say(nameMsg, '');
      busy(btn, true, 'Save name');
      post('/api/auth/account/profile', { firstName: first, lastName: last }).then(function (r) {
        busy(btn, false, 'Save name');
        var fresh = r.data && r.data.data && r.data.data.user;
        if (r.ok && fresh) {
          [window.MIIMIID_CURRENT_USER, window.currentUser].forEach(function (obj, i, arr) {
            if (obj && arr.indexOf(obj) === i) Object.assign(obj, fresh);
          });
          if (!window.MIIMIID_CURRENT_USER && !window.currentUser) {
            window.MIIMIID_CURRENT_USER = window.currentUser = fresh;
          }
          var h3 = body.querySelector('.mm-profile-hero h3');
          if (h3) h3.textContent = fresh.name;
          var big = body.querySelector('.mm-avatar-lg');
          if (big) big.textContent = initialOf(fresh);
          var firstKv = body.querySelector('.mm-kv strong');
          if (firstKv) firstKv.textContent = fresh.name;
          document.querySelectorAll('.mm-avatar-btn').forEach(function (el) { el.textContent = initialOf(fresh); });
          say(nameMsg, 'Name updated.', true);
        } else {
          say(nameMsg, errorText(r, 'Unable to update your name.'), false);
        }
      }).catch(function () {
        busy(btn, false, 'Save name');
        say(nameMsg, 'Could not reach the server. Check your connection.', false);
      });
    });

    /* ----- change password ----- */
    var pwForm = wrap.querySelector('#mm-pw-form');
    var pwMsg = wrap.querySelector('#mm-pw-msg');
    pwForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = pwForm.querySelector('button');
      var cur = wrap.querySelector('#mm-pw-current');
      var nw = wrap.querySelector('#mm-pw-new');
      var cf = wrap.querySelector('#mm-pw-confirm');
      if (!cur.value || !nw.value) { say(pwMsg, 'Fill in your current and new password.', false); return; }
      if (nw.value !== cf.value) { say(pwMsg, 'The new passwords do not match.', false); return; }
      say(pwMsg, '');
      busy(btn, true, 'Change password');
      post('/api/auth/account/change-password', { currentPassword: cur.value, newPassword: nw.value }).then(function (r) {
        busy(btn, false, 'Change password');
        if (r.ok && r.data && r.data.status === 'success') {
          cur.value = ''; nw.value = ''; cf.value = '';
          say(pwMsg, 'Password changed. Other devices were signed out.', true);
        } else {
          say(pwMsg, errorText(r, 'Unable to change your password.'), false);
        }
      }).catch(function () {
        busy(btn, false, 'Change password');
        say(pwMsg, 'Could not reach the server. Check your connection.', false);
      });
    });

    /* ----- delete account ----- */
    var delForm = wrap.querySelector('#mm-del-form');
    var delMsg = wrap.querySelector('#mm-del-msg');
    var delBtn = wrap.querySelector('#mm-del-btn');
    var delPw = wrap.querySelector('#mm-del-pw');
    var delConfirm = wrap.querySelector('#mm-del-confirm');

    function syncDelete() {
      delBtn.disabled = !(delPw.value && delConfirm.value.trim() === 'DELETE');
    }
    delPw.addEventListener('input', syncDelete);
    delConfirm.addEventListener('input', syncDelete);

    delForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (delBtn.disabled) return;
      say(delMsg, '');
      busy(delBtn, true, 'Delete my account');
      post('/api/auth/account/delete', { password: delPw.value, confirm: 'DELETE' }).then(function (r) {
        if (r.ok && r.data && r.data.status === 'success') {
          if (window.MiimiidDrawer) window.MiimiidDrawer.close();
          setTimeout(function () {
            if (typeof window.logoutMiimiid === 'function') window.logoutMiimiid();
            else window.location.reload();
          }, 150);
        } else {
          busy(delBtn, false, 'Delete my account');
          syncDelete();
          say(delMsg, errorText(r, 'Unable to delete your account.'), false);
        }
      }).catch(function () {
        busy(delBtn, false, 'Delete my account');
        syncDelete();
        say(delMsg, 'Could not reach the server. Check your connection.', false);
      });
    });
  }

  window.MiimiidAccount = { mount: mount };
})();
