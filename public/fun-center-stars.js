/* Miimiid Mart: star rating card. The server decides the stars; this only draws them. */
(function () {
  'use strict';
  window.MiimiidMart = window.MiimiidMart || {};

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function injectStyles() {
    if (document.getElementById('mm-stars-styles')) return;
    const st = document.createElement('style');
    st.id = 'mm-stars-styles';
    st.textContent = `
      .mm-stars { margin: 4px 0 8px; }
      .mm-stars-row { display: flex; justify-content: center; gap: 10px; }
      .mm-star { font-size: 44px; line-height: 1; filter: grayscale(1); opacity: .25; transform: scale(.8); transition: all .3s; }
      .mm-star.on { filter: none; opacity: 1; transform: scale(1); animation: mmStarPop .45s ease-out; }
      @keyframes mmStarPop { 0% { transform: scale(.4); } 60% { transform: scale(1.3); } 100% { transform: scale(1); } }
      .mm-stars-title { margin: 4px 0; font-weight: 800; color: #ffd34d; font-size: 15px; }
      .mm-stars-notes { text-align: left; font-size: 13px; margin-top: 6px; }
      .mm-stars-notes div { padding: 3px 0; }
      .mm-stars-notes small { color: #9aa4bd; }
    `;
    document.head.appendChild(st);
  }

  function title(n) {
    if (n === 3) return 'Perfect trip!';
    if (n === 2) return 'Great shopping!';
    if (n === 1) return 'A good start';
    return 'Keep practicing';
  }

  function animate(r, tone) {
    const root = document.querySelector('[data-mm-stars]');
    if (!root) return;
    const stars = root.querySelectorAll('.mm-star');
    for (let i = 0; i < r.stars && i < stars.length; i++) {
      setTimeout(() => {
        stars[i].classList.add('on');
        if (tone) tone(660 + i * 220, 0.18, 'triangle', 0.12);
      }, 350 + i * 450);
    }
  }

  // Returns the card markup, then lights the stars one by one.
  function html(r, tone) {
    if (!r || !Array.isArray(r.starRows)) return '';
    injectStyles();
    const n = Number.isFinite(r.stars) ? r.stars : 0;
    setTimeout(() => animate(r, tone), 200);
    return `
      <div class="mm-stars" data-mm-stars>
        <div class="mm-stars-row"><span class="mm-star">⭐</span><span class="mm-star">⭐</span><span class="mm-star">⭐</span></div>
        <div class="mm-stars-title">${esc(title(n))} ${n} / 3 stars</div>
        <div class="mm-stars-notes">
          ${r.starRows.map(row => row.earned
            ? `<div>✅ ${esc(row.label)}</div>`
            : `<div>⬜ ${esc(row.label)}<br><small>${esc(row.hint)}</small></div>`).join('')}
        </div>
      </div>`;
  }

  window.MiimiidMart.stars = { html };
})();
