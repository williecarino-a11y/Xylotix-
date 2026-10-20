/*
 * MIIMIID THEME
 * Saves the choice (light / dark / system) and applies it to <html data-theme>.
 * Default is dark. Quick test: open the app with ?theme=light (or ?theme=dark / ?theme=system).
 * Other files can call: MiimiidTheme.set('light' | 'dark' | 'system'), MiimiidTheme.get()
 */
(function () {
  var KEY = 'miimiid-theme';
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      return v === 'light' || v === 'dark' || v === 'system' ? v : 'dark';
    } catch (e) { return 'dark'; }
  }

  function resolve(choice) {
    if (choice === 'system') return media && media.matches ? 'light' : 'dark';
    return choice;
  }

  function paintBar(mode) {
    var bar = document.querySelector('meta[name="theme-color"]');
    if (!bar) {
      bar = document.createElement('meta');
      bar.name = 'theme-color';
      (document.head || root).appendChild(bar);
    }
    bar.content = mode === 'light' ? '#f3f6fb' : '#07111f';
  }

  function apply(choice, animate) {
    var mode = resolve(choice);
    if (animate) {
      root.classList.add('miimiid-theme-switching');
      setTimeout(function () { root.classList.remove('miimiid-theme-switching'); }, 260);
    }
    root.setAttribute('data-theme', mode);
    root.setAttribute('data-theme-choice', choice);
    paintBar(mode);
    try { window.dispatchEvent(new CustomEvent('miimiid-theme-change', { detail: { choice: choice, mode: mode } })); } catch (e) {}
  }

  function set(choice) {
    if (choice !== 'light' && choice !== 'dark' && choice !== 'system') return;
    try { localStorage.setItem(KEY, choice); } catch (e) {}
    apply(choice, true);
  }

  // ?theme=light for quick testing
  try {
    var q = new URLSearchParams(window.location.search).get('theme');
    if (q === 'light' || q === 'dark' || q === 'system') localStorage.setItem(KEY, q);
  } catch (e) {}

  apply(read(), false);

  if (media) {
    var onChange = function () { if (read() === 'system') apply('system', true); };
    if (media.addEventListener) media.addEventListener('change', onChange);
    else if (media.addListener) media.addListener(onChange);
  }

  window.MiimiidTheme = { set: set, get: read, mode: function () { return resolve(read()); } };
})();
