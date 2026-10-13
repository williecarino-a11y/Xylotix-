/* Miimiid Mart: Settings (name on the board, store look, sound).
 * The name is saved on the server because the leaderboard needs it.
 * Store look and sound are saved on this device. */
(function () {
  'use strict';
  window.MiimiidMart = window.MiimiidMart || {};
  const NO_OVERLAY = { 'X-Continue-Loading': 'false' };
  const LOOK_KEY = 'miimiidStoreLook';
  const SOUND_KEY = 'miimiidSoundOff';

  const LOOKS = [
    { id: 'classic', label: 'Classic blue', swatch: '#1f6feb', colors: { wallTop: 0x1d3d78, wallBot: 0x0e1a38, trim: 0x1f6feb, trimHi: 0x7ab8ff, sideL: 0x17305e, sideR: 0x112347, floorTop: 0xb9ab93, floorBot: 0xf4ead6 } },
    { id: 'mint', label: 'Mint', swatch: '#1fb98a', colors: { wallTop: 0x1b6b58, wallBot: 0x0d3a30, trim: 0x1fb98a, trimHi: 0x8ff0cf, sideL: 0x15513f, sideR: 0x0f3d31, floorTop: 0xb2c2ad, floorBot: 0xeaf5e1 } },
    { id: 'sunset', label: 'Sunset', swatch: '#e8772e', colors: { wallTop: 0x7a3b3a, wallBot: 0x3a1a24, trim: 0xe8772e, trimHi: 0xffc08a, sideL: 0x5f2c30, sideR: 0x4a2229, floorTop: 0xc2a68e, floorBot: 0xf8e6d0 } },
    { id: 'night', label: 'Night', swatch: '#6a5bff', colors: { wallTop: 0x1c1f45, wallBot: 0x0a0c24, trim: 0x6a5bff, trimHi: 0xb7aeff, sideL: 0x15183a, sideR: 0x0f1230, floorTop: 0x6d7189, floorBot: 0xa4a9c2 } }
  ];

  function esc(v) {
    if (typeof miimiidFunCenterEscapeHtml === 'function') return miimiidFunCenterEscapeHtml(v);
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---- saved on this device ----
  function getLook() {
    try {
      const id = localStorage.getItem(LOOK_KEY);
      return LOOKS.find(l => l.id === id) || LOOKS[0];
    } catch (e) { return LOOKS[0]; }
  }
  function setLook(id) { try { localStorage.setItem(LOOK_KEY, id); } catch (e) { /* ignore */ } }
  function soundOff() { try { return localStorage.getItem(SOUND_KEY) === '1'; } catch (e) { return false; } }
  function setSoundOff(off) { try { localStorage.setItem(SOUND_KEY, off ? '1' : '0'); } catch (e) { /* ignore */ } }
  function storeColors() { return Object.assign({}, getLook().colors); }

  function injectStyles() {
    if (document.getElementById('mms-styles')) return;
    const st = document.createElement('style');
    st.id = 'mms-styles';
    st.textContent = `
      .mms { max-width: 440px; margin: 0 auto; padding: 28px 4px 24px; }
      .mms-card { background: #131a2c; border: 1px solid #232c42; border-radius: 18px; padding: 22px 18px; color: #e6e9f0; text-align: left; }
      .mms-kicker { font-size: 11px; font-weight: 800; letter-spacing: .08em; color: #9ec5ff; text-align: center; }
      .mms-card h3 { margin: 6px 0 12px; color: #4da3ff; font-size: 22px; text-align: center; }
      .mms-section { margin: 14px 0; padding-top: 12px; border-top: 1px solid #232c42; }
      .mms-label { display: block; font-size: 13px; font-weight: 800; margin-bottom: 8px; }
      .mms-row { display: flex; gap: 8px; }
      .mms-row input { flex: 1; min-width: 0; padding: 10px 12px; border-radius: 999px; border: 1px solid #232c42; background: #0d1324; color: #e6e9f0; font-size: 14px; }
      .mms-card button { border: 0; border-radius: 999px; padding: 11px 18px; font-weight: 800; font-size: 14px; background: #1f6feb; color: #fff; cursor: pointer; }
      .mms-looks { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .mms-card button.mms-look { display: flex; align-items: center; gap: 8px; background: #0d1324; border: 2px solid #232c42; color: #e6e9f0; padding: 10px 12px; }
      .mms-card button.mms-look.on { border-color: #4da3ff; background: rgba(31, 111, 235, .18); }
      .mms-look i { width: 16px; height: 16px; border-radius: 50%; flex: none; }
      .mms-card button.mms-toggle { width: 100%; background: #0d1324; border: 2px solid #232c42; color: #e6e9f0; }
      .mms-card button.mms-back { width: 100%; margin-top: 8px; background: transparent; border: 1px solid #232c42; color: #9aa4bd; }
      .mms-hint { margin: 8px 0 0; font-size: 12px; color: #9aa4bd; }
      .mms-msg { margin: 8px 0 0; font-size: 13px; }
    `;
    document.head.appendChild(st);
  }

  function draw(content, request, onBack, nick) {
    const look = getLook();
    content.innerHTML = `<div class="mms"><div class="mms-card">
      <div class="mms-kicker">SETTINGS</div>
      <h3>Make it yours</h3>
      <div class="mms-section">
        <label class="mms-label" for="mms-nick">Your name on the leaderboard</label>
        <div class="mms-row">
          <input id="mms-nick" type="text" maxlength="16" placeholder="Pick a nickname" value="${esc(nick)}">
          <button type="button" data-mms-save>Save</button>
        </div>
        <p class="mms-msg" data-mms-msg style="display:none"></p>
      </div>
      <div class="mms-section">
        <div class="mms-label">Store look</div>
        <div class="mms-looks">
          ${LOOKS.map(l => `<button type="button" class="mms-look${l.id === look.id ? ' on' : ''}" data-mms-look="${l.id}"><i style="background:${l.swatch}"></i>${esc(l.label)}</button>`).join('')}
        </div>
        <p class="mms-hint">Changes the walls, floor and trim. It shows the next time you enter the store.</p>
      </div>
      <div class="mms-section">
        <div class="mms-label">Sound</div>
        <button type="button" class="mms-toggle" data-mms-sound>${soundOff() ? 'Sound is off' : 'Sound is on'}</button>
      </div>
      <button type="button" class="mms-back" data-mms-back>Back</button>
    </div></div>`;

    const msg = content.querySelector('[data-mms-msg]');
    const show = (text, ok) => { msg.style.display = 'block'; msg.style.color = ok ? '#7ee2a8' : '#ffb4b4'; msg.textContent = text; };

    content.querySelector('[data-mms-save]').addEventListener('click', () => {
      const input = content.querySelector('#mms-nick');
      request('/api/fun-center/daily/nickname', {
        method: 'POST', body: JSON.stringify({ nickname: input.value }), headers: NO_OVERLAY
      }).then(data => {
        input.value = (data && data.nickname) || input.value;
        show('Saved. This is how you appear on the board.', true);
      }).catch(error => show((error && error.message) || 'Could not save that name.', false));
    });

    content.querySelectorAll('[data-mms-look]').forEach(btn => {
      btn.addEventListener('click', () => {
        setLook(btn.dataset.mmsLook);
        content.querySelectorAll('[data-mms-look]').forEach(b => b.classList.toggle('on', b === btn));
      });
    });

    const soundBtn = content.querySelector('[data-mms-sound]');
    soundBtn.addEventListener('click', () => {
      setSoundOff(!soundOff());
      soundBtn.textContent = soundOff() ? 'Sound is off' : 'Sound is on';
    });

    content.querySelector('[data-mms-back]').addEventListener('click', () => { if (typeof onBack === 'function') onBack(); });
  }

  // Opens Settings inside the Fun Center content area. onBack runs when the player taps Back.
  function open(content, request, onBack) {
    injectStyles();
    content.innerHTML = '<div class="miimiid-fun-loading">Loading settings…</div>';
    request('/api/fun-center/daily', { headers: NO_OVERLAY })
      .then(info => (info && info.nickname) || '', () => '')
      .then(nick => draw(content, request, onBack, nick));
  }

  window.MiimiidMart.settings = { open, storeColors, soundOff, setSoundOff };
})();
