(function () {
  'use strict';
  if (window.MiimiidReminders) return;

  /* ---------- styles ---------- */
  var style = document.createElement('style');
  style.textContent = `
.mm-switch-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  min-height: 56px; color: #e6e9f0; font-size: 1rem; font-weight: 600;
  border-top: 1px solid #1c2640; border-bottom: 1px solid #1c2640;
}
.mm-sf-link {
  min-height: 48px; border: 0; background: transparent; color: #4da3ff;
  font-family: inherit; font-size: 0.95rem; font-weight: 600; cursor: pointer;
}
.mm-sf-msg.is-ok { color: #4ade80; }
`;
  document.head.appendChild(style);

  var CHEVRON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';

  /* ---------- helpers ---------- */
  function supported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function fmt(hour, minute) {
    var ampm = hour >= 12 ? 'PM' : 'AM';
    var h = hour % 12 || 12;
    return h + ':' + pad(minute) + ' ' + ampm;
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

  function keyToBytes(base64) {
    var padding = '='.repeat((4 - (base64.length % 4)) % 4);
    var raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (resolve, reject) { setTimeout(function () { reject(new Error('timeout')); }, ms); })
    ]);
  }

  /* ---------- settings row ---------- */
  var config = null;
  var valueEl = null;

  function loadConfig() {
    return api('/api/learn/reminders/config').then(function (r) {
      if (r.ok && r.data && r.data.data) config = r.data.data;
      return config;
    }).catch(function () { return config; });
  }

  function currentValue() {
    if (!supported()) return 'Not available';
    if (config && config.enabled && Notification.permission === 'granted') {
      return fmt(config.hour, config.minute);
    }
    return 'Off';
  }

  function updateValue() {
    if (valueEl && document.body.contains(valueEl)) valueEl.textContent = currentValue();
  }

  function mountSettings(body) {
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="mm-label">Reminders</div>' +
      '<div class="mm-list">' +
        '<button type="button" class="mm-lrow" id="mm-rem-row">' +
          '<span class="mm-lrow-label">Daily reminder</span>' +
          '<span class="mm-lrow-value" id="mm-rem-value">' + currentValue() + '</span>' +
          CHEVRON +
        '</button>' +
      '</div>';
    body.appendChild(wrap);

    valueEl = wrap.querySelector('#mm-rem-value');
    wrap.querySelector('#mm-rem-row').addEventListener('click', openPage);
    loadConfig().then(updateValue);
  }

  /* ---------- the reminder page ---------- */
  function openPage() {
    var account = window.MiimiidAccount;
    if (!account || typeof account.openSub !== 'function') return;

    account.openSub('Daily reminder', function (body) {
      if (!supported()) {
        body.innerHTML =
          '<div class="mm-sf"><p class="mm-sf-help">Reminders are not supported on this browser. ' +
          'On iPhone, add Miimiid to your Home Screen first, then try again.</p></div>';
        return;
      }

      body.innerHTML = '<div class="mm-sf"><p class="mm-sf-help">Loading...</p></div>';
      loadConfig().then(function () { build(body, account); });
    });
  }

  function build(body, account) {
    if (!config) {
      body.innerHTML = '<div class="mm-sf"><p class="mm-sf-help">Could not load reminder settings. Check your connection and try again.</p></div>';
      return;
    }

    var wasOn = Boolean(config.enabled && Notification.permission === 'granted');

    body.innerHTML =
      '<form class="mm-sf" novalidate>' +
        '<p class="mm-sf-help">Get one gentle nudge a day, only if you have not learned yet.</p>' +
        '<div class="mm-switch-row"><span>Daily reminder</span>' +
          '<button type="button" class="mm-switch" id="mm-rem-switch" role="switch" aria-label="Daily reminder" aria-checked="' + wasOn + '"><i></i></button>' +
        '</div>' +
        '<label class="mm-sf-field" id="mm-rem-time-field"' + (wasOn ? '' : ' hidden') + '>' +
          '<span class="mm-sf-label">Reminder time</span>' +
          '<input class="mm-sf-input" id="mm-rem-time" type="time" value="' + pad(config.hour) + ':' + pad(config.minute) + '">' +
        '</label>' +
        '<div class="mm-sf-msg" role="alert"></div>' +
        '<button type="submit" class="mm-sf-btn" disabled><span>Save</span></button>' +
        '<button type="button" class="mm-sf-link" id="mm-rem-test"' + (wasOn ? '' : ' hidden') + '>Send a test notification</button>' +
      '</form>';

    var form = body.querySelector('form');
    var sw = form.querySelector('#mm-rem-switch');
    var timeField = form.querySelector('#mm-rem-time-field');
    var timeInput = form.querySelector('#mm-rem-time');
    var msg = form.querySelector('.mm-sf-msg');
    var save = form.querySelector('button[type="submit"]');
    var testBtn = form.querySelector('#mm-rem-test');

    function say(text, ok) {
      msg.textContent = text || '';
      msg.className = 'mm-sf-msg' + (ok ? ' is-ok' : '');
    }
    function busy(on) {
      save.disabled = on;
      save.querySelector('span').textContent = on ? 'Please wait...' : 'Save';
    }

    sw.addEventListener('click', function () {
      var next = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', String(next));
      timeField.hidden = !next;
      save.disabled = false;
      say('');
    });
    timeInput.addEventListener('input', function () { save.disabled = false; });

    function finish(text) {
      updateValue();
      window.MiimiidDrawer.close();
      if (account.toast) account.toast(text);
    }

    function turnOff() {
      busy(true);
      api('/api/learn/reminders/disable', { method: 'POST', body: '{}' }).then(function (r) {
        if (r.ok) {
          config.enabled = false;
          finish('Reminder turned off');
        } else {
          busy(false);
          say((r.data && r.data.message) || 'Unable to turn off the reminder.');
        }
      }).catch(function () {
        busy(false);
        say('Could not reach the server. Check your connection.');
      });
    }

    function turnOn() {
      var parts = String(timeInput.value || '').split(':');
      var hour = Number(parts[0]);
      var minute = Number(parts[1]);
      if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
        say('Choose a reminder time.');
        return;
      }

      busy(true);

      var permission = Notification.permission === 'default'
        ? Notification.requestPermission()
        : Promise.resolve(Notification.permission);

      permission.then(function (result) {
        if (result === 'denied') {
          throw new Error('Notifications are blocked. Allow them for Miimiid in your browser or phone settings, then try again.');
        }
        if (result !== 'granted') {
          throw new Error('Notification permission was not granted.');
        }
        return withTimeout(navigator.serviceWorker.ready, 8000).catch(function () {
          throw new Error('The app is not ready for reminders yet. Reload the app and try again.');
        });
      }).then(function (registration) {
        return registration.pushManager.getSubscription().then(function (existing) {
          return existing || registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: keyToBytes(config.publicKey)
          });
        });
      }).then(function (subscription) {
        return api('/api/learn/reminders/subscribe', {
          method: 'POST',
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            hour: hour,
            minute: minute,
            timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC'
          })
        });
      }).then(function (r) {
        if (r.ok) {
          config.enabled = true;
          config.hour = hour;
          config.minute = minute;
          finish('Reminder set for ' + fmt(hour, minute));
        } else {
          throw new Error((r.data && r.data.message) || 'Unable to save your reminder.');
        }
      }).catch(function (error) {
        busy(false);
        say(error && error.message ? error.message : 'Unable to set up the reminder.');
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (save.disabled) return;
      say('');
      if (sw.getAttribute('aria-checked') === 'true') turnOn();
      else turnOff();
    });

    testBtn.addEventListener('click', function () {
      say('');
      api('/api/learn/reminders/test', { method: 'POST', body: '{}' }).then(function (r) {
        if (r.ok) say('Test sent. It should arrive in a few seconds.', true);
        else say((r.data && r.data.message) || 'Unable to send the test.');
      }).catch(function () { say('Could not reach the server. Check your connection.'); });
    });
  }

  window.MiimiidReminders = { mountSettings: mountSettings, openPage: openPage };
})();
