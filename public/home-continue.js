(function () {
  'use strict';
  if (window.__mmContinueInstalled) return;
  window.__mmContinueInstalled = true;

  /* ---------- styles ---------- */
  var style = document.createElement('style');
  style.textContent = `
.mm-continue {
  width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 14px;
  margin: 0 0 16px; padding: 16px 18px;
  border: 1px solid #1f2a44; border-radius: 16px; background: #111a2e;
  color: #f1f5f9; font-family: inherit; text-align: left; cursor: pointer;
  transition: background 0.18s ease, transform 0.15s ease;
}
.mm-continue:active { transform: scale(0.985); background: #16213a; }
.mm-continue-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.mm-continue small { color: #4da3ff; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; }
.mm-continue strong { font-size: 1.05rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mm-continue em { font-style: normal; color: #94a3b8; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mm-continue svg { flex: 0 0 auto; color: #64748b; }
`;
  document.head.appendChild(style);

  /* ---------- storage (one entry per user, on this device) ---------- */
  var KEY = 'mmContinue:';

  function uid() {
    var u = window.MIIMIID_CURRENT_USER || window.currentUser || {};
    return u.id || u._id || '';
  }
  function load() {
    var id = uid();
    if (!id) return null;
    try { return JSON.parse(localStorage.getItem(KEY + id) || 'null'); } catch (e) { return null; }
  }
  function save(value) {
    var id = uid();
    if (!id) return;
    try {
      if (value) localStorage.setItem(KEY + id, JSON.stringify(value));
      else localStorage.removeItem(KEY + id);
    } catch (e) {}
  }

  /* ---------- read the app's current course ---------- */
  function cache() {
    try { return typeof courseDataCache !== 'undefined' ? courseDataCache : null; } catch (e) { return null; }
  }
  function currentCourse() {
    try { return typeof currentCourseId !== 'undefined' ? currentCourseId : null; } catch (e) { return null; }
  }

  function describe(lessonId) {
    var c = cache();
    if (!c || !Array.isArray(c.modules)) return null;
    for (var m = 0; m < c.modules.length; m++) {
      var mod = c.modules[m];
      var lessons = Array.isArray(mod.lessons) ? mod.lessons : [];
      for (var l = 0; l < lessons.length; l++) {
        if (String(lessons[l]._id) === String(lessonId)) {
          return {
            courseId: currentCourse(),
            courseTitle: c.title || '',
            moduleTitle: mod.title || '',
            lessonId: String(lessons[l]._id),
            lessonTitle: lessons[l].title || 'Untitled lesson',
            number: l + 1,
            total: lessons.length
          };
        }
      }
    }
    return null;
  }

  function nextLessonId(lessonId) {
    var c = cache();
    if (!c || !Array.isArray(c.modules)) return null;
    var flat = [];
    c.modules.forEach(function (mod) {
      (Array.isArray(mod.lessons) ? mod.lessons : []).forEach(function (lesson) { flat.push(String(lesson._id)); });
    });
    var i = flat.indexOf(String(lessonId));
    return i !== -1 && i + 1 < flat.length ? flat[i + 1] : null;
  }

  /* ---------- remember the lesson when it is opened ---------- */
  var originalOpenLesson = window.openLesson;
  if (typeof originalOpenLesson === 'function') {
    window.openLesson = function (lessonId) {
      var result = originalOpenLesson.apply(this, arguments);
      try {
        var entry = describe(lessonId);
        if (entry) save(entry);
      } catch (e) {}
      return result;
    };
  }

  /* ---------- when a lesson is completed, point to the next one ---------- */
  var originalFetch = window.fetch;
  window.fetch = function (input, init) {
    var promise = originalFetch.apply(this, arguments);
    try {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var match = url.match(/\/api\/learn\/lessons\/([^/?]+)\/complete/);
      if (match && init && String(init.method).toUpperCase() === 'POST') {
        promise.then(function (response) {
          if (!response || !response.ok) return;
          var nextId = nextLessonId(match[1]);
          save(nextId ? describe(nextId) : null);
        }).catch(function () {});
      }
    } catch (e) {}
    return promise;
  };

  /* ---------- the card on Home ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async function resume(t) {
    try {
      if (typeof miimiidNavigate === 'function') await miimiidNavigate('learn');
      if (typeof openCourse === 'function') await openCourse(t.courseId);
      if (typeof openLesson === 'function') openLesson(t.lessonId);
    } catch (e) {
      console.error('Continue learning error:', e);
    }
  }

  function render() {
    var content = document.querySelector('#miimiid-dashboard .miimiid-dashboard-content');
    if (!content || content.querySelector('.mm-continue')) return;

    var t = load();
    if (!t || !t.lessonId || !t.courseId) return;

    var sub = [t.moduleTitle || t.courseTitle, t.number && t.total ? 'Lesson ' + t.number + ' of ' + t.total : '']
      .filter(Boolean).join(' \u00b7 ');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mm-continue';
    btn.innerHTML =
      '<span class="mm-continue-text">' +
        '<small>Continue learning</small>' +
        '<strong>' + esc(t.lessonTitle) + '</strong>' +
        (sub ? '<em>' + esc(sub) + '</em>' : '') +
      '</span>' +
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';
    btn.addEventListener('click', function () { resume(t); });
    content.insertBefore(btn, content.firstChild);
  }

  var dash = document.getElementById('miimiid-dashboard');
  if (dash) {
    new MutationObserver(render).observe(dash, { childList: true });
    render();
  }
})();
