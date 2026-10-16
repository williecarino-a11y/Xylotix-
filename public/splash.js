(function () {
  var MIN_MS = 900;    // never flash: show at least this long
  var WAKE_MS = 3500;  // show the "waking up" line after this long
  var MAX_MS = 20000;  // safety: always leave after this long (covers a Render cold start)
  var MASCOT = '/assets/fun-center/characters/miimiid/waving.png';

  // once per app open (not every reload in the same tab)
  try {
    if (sessionStorage.getItem('mmSplashShown')) return;
    sessionStorage.setItem('mmSplashShown', '1');
  } catch (e) {}

  var start = Date.now();
  var done = false;

  var el = document.createElement('div');
  el.id = 'mm-splash';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-label', 'Loading Miimiid');

  var glow = document.createElement('div');
  glow.className = 'mm-splash-glow';

  var center = document.createElement('div');
  center.className = 'mm-splash-center';

  var mascot = document.createElement('div');
  mascot.className = 'mm-splash-mascot';
  var img = document.createElement('img');
  img.alt = '';
  img.onerror = function () { mascot.classList.add('mm-no-img'); img.remove(); };
  img.src = MASCOT;
  mascot.appendChild(img);

  var word = document.createElement('div');
  word.className = 'mm-splash-word';
  'Miimiid'.split('').forEach(function (ch, i) {
    var s = document.createElement('span');
    s.textContent = ch;
    s.style.animationDelay = (0.35 + i * 0.07) + 's';
    word.appendChild(s);
  });

  var tag = document.createElement('div');
  tag.className = 'mm-splash-tag';
  tag.textContent = 'Smart Choices. Brighter Tomorrows.';

  var wake = document.createElement('div');
  wake.className = 'mm-splash-wake';
  wake.textContent = 'Waking things up\u2026';

  center.appendChild(mascot);
  center.appendChild(word);
  center.appendChild(tag);
  center.appendChild(wake);

  var bar = document.createElement('div');
  bar.className = 'mm-splash-bar';
  bar.appendChild(document.createElement('i'));

  el.appendChild(glow);
  el.appendChild(center);
  el.appendChild(bar);
  document.body.appendChild(el);

  function hide() {
    if (done) return;
    done = true;
    var wait = Math.max(0, MIN_MS - (Date.now() - start));
    setTimeout(function () {
      el.classList.add('mm-hide');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 600);
    }, wait);
  }

  setTimeout(function () { if (!done) wake.classList.add('mm-show'); }, WAKE_MS);
  setTimeout(hide, MAX_MS);

  if (document.readyState === 'complete') hide();
  else window.addEventListener('load', hide);
})();
