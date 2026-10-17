(function () {
  'use strict';
  if (window.__mmStatIconsInstalled) return;
  window.__mmStatIconsInstalled = true;

  /* ---------- styles ---------- */
  var style = document.createElement('style');
  style.textContent = `
#miimiid-dashboard .miimiid-dashboard-stat {
  display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start;
  gap: 14px; height: auto; min-height: 0; padding: 16px; text-align: left;
  background: #111a2e; border: 1px solid #1f2a44; border-radius: 16px;
  transition: background 0.18s ease, transform 0.15s ease;
}
#miimiid-dashboard .miimiid-dashboard-stat:active { background: #16213a; transform: scale(0.985); }
.mm-stat-ico {
  width: 36px; height: 36px; flex: 0 0 auto; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.mm-stat-text { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; }
#miimiid-dashboard .mm-stat-text .miimiid-dashboard-stat-value {
  display: block; font-size: 1.9rem; font-weight: 800; line-height: 1; letter-spacing: -0.01em; color: #f8fafc;
}
#miimiid-dashboard .mm-stat-text .miimiid-dashboard-stat-label {
  display: block; font-size: 0.85rem; font-weight: 500; line-height: 1.3; color: #94a3b8;
}
.mm-stat-xp     .mm-stat-ico { background: rgba(56, 189, 248, 0.14);  color: #38bdf8; }
.mm-stat-streak .mm-stat-ico { background: rgba(251, 146, 60, 0.14);  color: #fb923c; }
.mm-stat-lessons .mm-stat-ico { background: rgba(52, 211, 153, 0.14); color: #34d399; }
.mm-stat-score  .mm-stat-ico { background: rgba(167, 139, 250, 0.14); color: #a78bfa; }
`;
  document.head.appendChild(style);

  /* ---------- icons (24x24 outline, same stroke weight) ---------- */
  function svg(inner) {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }

  var ICONS = {
    xp: svg('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
    streak: svg('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),
    lessons: svg('<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="m9 9.5 2 2 4-4"/>'),
    score: svg('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>')
  };

  /* ---------- decorate the cards ---------- */
  function decorate() {
    document.querySelectorAll('#miimiid-dashboard .miimiid-dashboard-stat').forEach(function (card) {
      if (card.querySelector('.mm-stat-ico')) return;

      var id = card.getAttribute('data-dashboard-stat');
      if (!ICONS[id]) return;

      var value = card.querySelector('.miimiid-dashboard-stat-value');
      var label = card.querySelector('.miimiid-dashboard-stat-label');
      if (!value || !label) return;

      card.classList.add('mm-stat-' + id);

      var icon = document.createElement('span');
      icon.className = 'mm-stat-ico';
      icon.innerHTML = ICONS[id];

      var text = document.createElement('span');
      text.className = 'mm-stat-text';
      text.appendChild(value);
      text.appendChild(label);

      card.appendChild(icon);
      card.appendChild(text);
    });
  }

  var dash = document.getElementById('miimiid-dashboard');
  if (dash) {
    new MutationObserver(decorate).observe(dash, { childList: true });
    decorate();
  }
})();
