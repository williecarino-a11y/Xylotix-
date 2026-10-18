/*
 * MIIMIID PROFILE PHOTO
 *
 * Lets a learner add, change or remove their profile photo.
 *  - Tap the photo (or the Photo row) on the Profile page.
 *  - Choose a picture, drag and zoom to crop a square, Save.
 *  - The picture is shrunk to 256 x 256 on the phone before it is uploaded.
 *  - The photo replaces the initial in the header and on the Profile page.
 *
 * Works with public/drawer-account.js without changing it.
 * Loaded after drawer-account.js in index.html.
 */
(function () {
  'use strict';
  if (window.MiimiidProfilePhoto) return;

  var OUT_SIZE = 256;
  var API = '/api/profile/avatar';

  var avatarUrl = null; // set when the learner has a photo
  var hasPhoto = false;

  /* ---------- styles ---------- */
  var CSS = '' +
    '.mm-avatar img[data-mmp]{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block}' +
    '.mm-profile-hero .mm-avatar-lg{position:relative;cursor:pointer}' +
    '.mmp-badge{position:absolute;right:-2px;bottom:-2px;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#1f6feb;border:2px solid #0b1220;color:#fff}' +
    '.mmp-wrap{max-width:560px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:20px}' +
    '.mmp-prev{width:168px;height:168px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#1f6feb;color:#fff;font-size:3.4rem;font-weight:700}' +
    '.mmp-prev img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.mmp-actions{width:100%;display:flex;flex-direction:column;gap:12px}' +
    '.mmp-ghost{width:100%;min-height:54px;border-radius:14px;border:1px solid #26314d;background:transparent;color:#e6e9f0;font-family:inherit;font-size:1rem;font-weight:600;cursor:pointer}' +
    '.mmp-ghost.is-danger{color:#f87171}' +
    '.mmp-ghost:disabled{opacity:.4;cursor:not-allowed}' +
    '.mmp-stage{position:relative;touch-action:none;border-radius:18px;overflow:hidden;background:#111a2e}' +
    '.mmp-stage canvas{display:block;touch-action:none;cursor:grab}' +
    '.mmp-zoom{width:100%;display:flex;align-items:center;gap:12px;color:#94a3b8;font-size:.85rem;font-weight:600}' +
    '.mmp-zoom input{flex:1;accent-color:#4da3ff}' +
    '.mmp-hint{margin:0;color:#94a3b8;font-size:.92rem;text-align:center}';
  var styleEl = document.createElement('style');
  styleEl.id = 'mm-photo-style';
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ---------- helpers ---------- */
  function user() { return window.MIIMIID_CURRENT_USER || window.currentUser || null; }

  function initialOf(u) {
    u = u || {};
    var email = typeof u.email === 'string' ? u.email : '';
    var name = u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || (email ? email.split('@')[0] : '');
    return (String(name || '').trim().charAt(0) || 'M').toUpperCase();
  }

  function toast(text) {
    if (window.MiimiidAccount && window.MiimiidAccount.toast) window.MiimiidAccount.toast(text);
  }

  function api(method, body) {
    return fetch(API, {
      method: method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        return { ok: res.ok, data: data };
      });
    });
  }

  var CAMERA = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
  var CHEVRON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';

  /* ---------- show the photo everywhere an avatar is drawn ---------- */
  var applying = false;

  function applyAvatars() {
    if (applying) return;
    applying = true;
    try {
      var nodes = document.querySelectorAll('.mm-avatar-btn, .mm-avatar');
      Array.prototype.forEach.call(nodes, function (el) {
        var img = el.querySelector('img[data-mmp]');
        if (avatarUrl) {
          if (img && img.getAttribute('src') === avatarUrl) return;
          if (!img) {
            el.textContent = '';
            img = new Image();
            img.setAttribute('data-mmp', '1');
            img.alt = '';
            img.decoding = 'async';
            el.appendChild(img);
          }
          img.src = avatarUrl;
          if (el.classList.contains('mm-avatar-lg') && !el.querySelector('.mmp-badge')) {
            var badge = document.createElement('span');
            badge.className = 'mmp-badge';
            badge.innerHTML = CAMERA;
            el.appendChild(badge);
          }
        } else if (img) {
          el.textContent = initialOf(user());
        }
        if (el.classList.contains('mm-avatar-lg') && !avatarUrl && !el.querySelector('.mmp-badge')) {
          var b2 = document.createElement('span');
          b2.className = 'mmp-badge';
          b2.innerHTML = CAMERA;
          el.appendChild(b2);
        }
      });

      // A "Photo" row at the top of the Account list on the Profile page.
      var hero = document.querySelector('.mm-profile-hero');
      if (hero) {
        var list = hero.parentNode.querySelector('.mm-list');
        if (list && !list.querySelector('[data-mmp-open]')) {
          var row = document.createElement('button');
          row.type = 'button';
          row.className = 'mm-lrow';
          row.setAttribute('data-mmp-open', '1');
          row.innerHTML = '<span class="mm-lrow-label">Photo</span><span class="mm-lrow-value">' +
            (hasPhoto ? 'Change' : 'Add') + '</span>' + CHEVRON;
          list.insertBefore(row, list.firstChild);
        } else if (list) {
          var val = list.querySelector('[data-mmp-open] .mm-lrow-value');
          if (val) val.textContent = hasPhoto ? 'Change' : 'Add';
        }
      }
    } finally {
      applying = false;
    }
  }

  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () { scheduled = false; applyAvatars(); });
  }

  function setState(has, version) {
    hasPhoto = !!has;
    avatarUrl = has ? API + '?v=' + encodeURIComponent(version || Date.now()) : null;
    applyAvatars();
  }

  function loadStatus() {
    fetch(API + '/status', { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (body) {
        if (body && body.status === 'success' && body.data) setState(body.data.hasAvatar, body.data.version);
      })
      .catch(function () { /* offline: keep initials */ });
  }

  /* ---------- the Photo page ---------- */
  function previewHtml() {
    return avatarUrl ? '<img src="' + avatarUrl + '" alt="">' : initialOf(user());
  }

  function openPhoto() {
    var account = window.MiimiidAccount;
    if (!account || typeof account.openSub !== 'function') return;

    account.openSub('Profile photo', function (body) {
      showChoose(body);
    });
  }

  function showChoose(body) {
    body.innerHTML =
      '<div class="mmp-wrap">' +
        '<div class="mmp-prev">' + previewHtml() + '</div>' +
        '<p class="mmp-hint">Your photo shows in the header and on your profile.</p>' +
        '<div class="mmp-actions">' +
          '<button type="button" class="mm-sf-btn" data-mmp-choose><span>' + (hasPhoto ? 'Choose a new photo' : 'Choose a photo') + '</span></button>' +
          (hasPhoto ? '<button type="button" class="mmp-ghost is-danger" data-mmp-remove>Remove photo</button>' : '') +
        '</div>' +
        '<div class="mm-sf-msg" role="alert"></div>' +
        '<input type="file" accept="image/*" hidden data-mmp-file>' +
      '</div>';

    var input = body.querySelector('[data-mmp-file]');
    var msg = body.querySelector('.mm-sf-msg');

    body.querySelector('[data-mmp-choose]').addEventListener('click', function () { input.click(); });

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      msg.textContent = '';
      loadImage(file).then(function (img) {
        showCrop(body, img);
      }).catch(function () {
        msg.textContent = 'This photo could not be opened. Try a JPEG or PNG picture.';
        input.value = '';
      });
    });

    var removeBtn = body.querySelector('[data-mmp-remove]');
    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        removeBtn.disabled = true;
        removeBtn.textContent = 'Please wait...';
        api('DELETE').then(function (r) {
          if (r.ok && r.data && r.data.status === 'success') {
            setState(false, null);
            window.MiimiidDrawer.close();
            toast('Photo removed');
          } else {
            removeBtn.disabled = false;
            removeBtn.textContent = 'Remove photo';
            msg.textContent = (r.data && r.data.message) || 'Unable to remove your photo.';
          }
        }).catch(function () {
          removeBtn.disabled = false;
          removeBtn.textContent = 'Remove photo';
          msg.textContent = 'Could not reach the server. Check your connection.';
        });
      });
    }
  }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        if (!img.naturalWidth || !img.naturalHeight) reject(new Error('empty'));
        else resolve(img);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;
    });
  }

  function showCrop(body, img) {
    var view = Math.max(220, Math.min(320, Math.floor(window.innerWidth - 56)));
    var ratio = Math.min(window.devicePixelRatio || 1, 2);

    body.innerHTML =
      '<div class="mmp-wrap">' +
        '<p class="mmp-hint">Drag to move. Use the slider to zoom.</p>' +
        '<div class="mmp-stage"><canvas></canvas></div>' +
        '<label class="mmp-zoom"><span>Zoom</span><input type="range" min="1" max="3" step="0.01" value="1" aria-label="Zoom"></label>' +
        '<div class="mm-sf-msg" role="alert"></div>' +
        '<div class="mmp-actions">' +
          '<button type="button" class="mm-sf-btn" data-mmp-save><span>Save photo</span></button>' +
          '<button type="button" class="mmp-ghost" data-mmp-back>Choose another</button>' +
        '</div>' +
      '</div>';

    var canvas = body.querySelector('canvas');
    canvas.width = Math.round(view * ratio);
    canvas.height = Math.round(view * ratio);
    canvas.style.width = view + 'px';
    canvas.style.height = view + 'px';
    var ctx = canvas.getContext('2d');
    var zoomInput = body.querySelector('input[type="range"]');
    var msg = body.querySelector('.mm-sf-msg');
    var saveBtn = body.querySelector('[data-mmp-save]');

    var w = img.naturalWidth;
    var h = img.naturalHeight;
    var baseScale = view / Math.min(w, h); // the photo always fills the square
    var zoom = 1;
    var cx = w / 2; // the point of the photo shown at the centre of the square
    var cy = h / 2;

    function scale() { return baseScale * zoom; }

    function clamp() {
      var half = view / (2 * scale());
      cx = Math.min(Math.max(cx, half), w - half);
      cy = Math.min(Math.max(cy, half), h - half);
    }

    function draw() {
      clamp();
      var s = scale() * ratio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#111a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, canvas.width / 2 - cx * s, canvas.height / 2 - cy * s, w * s, h * s);

      // Dim everything outside the circle that will be kept.
      var c = canvas.width / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.arc(c, c, c - 2 * ratio, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(11, 18, 32, 0.72)';
      ctx.fill('evenodd');
      ctx.restore();
      ctx.beginPath();
      ctx.arc(c, c, c - 2 * ratio, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.85)';
      ctx.lineWidth = 2 * ratio;
      ctx.stroke();
    }

    zoomInput.addEventListener('input', function () {
      zoom = parseFloat(zoomInput.value) || 1;
      draw();
    });

    var dragging = false;
    var lastX = 0;
    var lastY = 0;
    canvas.addEventListener('pointerdown', function (e) {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      canvas.style.cursor = 'grabbing';
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      cx -= (e.clientX - lastX) / scale();
      cy -= (e.clientY - lastY) / scale();
      lastX = e.clientX;
      lastY = e.clientY;
      draw();
    });
    function endDrag() { dragging = false; canvas.style.cursor = 'grab'; }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    body.querySelector('[data-mmp-back]').addEventListener('click', function () { showChoose(body); });

    saveBtn.addEventListener('click', function () {
      clamp();
      var out = document.createElement('canvas');
      out.width = OUT_SIZE;
      out.height = OUT_SIZE;
      var octx = out.getContext('2d');
      var side = view / scale(); // the square cut out of the original photo
      octx.imageSmoothingQuality = 'high';
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, OUT_SIZE, OUT_SIZE);
      octx.drawImage(img, cx - side / 2, cy - side / 2, side, side, 0, 0, OUT_SIZE, OUT_SIZE);
      var dataUrl = out.toDataURL('image/jpeg', 0.86);

      msg.textContent = '';
      saveBtn.disabled = true;
      saveBtn.querySelector('span').textContent = 'Please wait...';
      api('PUT', { image: dataUrl }).then(function (r) {
        if (r.ok && r.data && r.data.status === 'success') {
          setState(true, r.data.data && r.data.data.version);
          window.MiimiidDrawer.close();
          toast('Photo updated');
        } else {
          saveBtn.disabled = false;
          saveBtn.querySelector('span').textContent = 'Save photo';
          msg.textContent = (r.data && r.data.message) || 'Unable to save your photo.';
        }
      }).catch(function () {
        saveBtn.disabled = false;
        saveBtn.querySelector('span').textContent = 'Save photo';
        msg.textContent = 'Could not reach the server. Check your connection.';
      });
    });

    draw();
  }

  /* ---------- wiring ---------- */
  document.addEventListener('click', function (e) {
    var target = e.target && e.target.closest ? e.target.closest('.mm-profile-hero .mm-avatar-lg, [data-mmp-open]') : null;
    if (target) openPhoto();
  });

  try {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  } catch (e) { /* ignore */ }

  // Ask for the photo once the signed-in user is known.
  var waited = 0;
  var timer = setInterval(function () {
    waited += 500;
    if (user()) { clearInterval(timer); loadStatus(); }
    else if (waited >= 60000) clearInterval(timer);
  }, 500);

  window.MiimiidProfilePhoto = { open: openPhoto, refresh: loadStatus };
})();
