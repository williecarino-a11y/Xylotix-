(function () {
  'use strict';
  if (window.MiimiidOnboarding) return;

  /* =====================================================
     WORDING (to add a language, copy the "en" block,
     rename it, e.g. yo, ig, ha, and translate the text)
     ===================================================== */
  var CONTENT = {
    en: {
      skip: 'Skip',
      cancel: 'Cancel',
      back: 'Back',
      next: 'Continue',
      goalTitle: 'What brings you to Miimiid?',
      goalHelp: 'Pick the one that matters most right now. You can change it later in Settings.',
      goals: [
        { id: 'budget', label: 'Manage my money better', keywords: ['basics', 'budget', 'money'] },
        { id: 'save', label: 'Save for something', keywords: ['saving', 'save', 'basics'] },
        { id: 'invest', label: 'Start investing', keywords: ['invest'] },
        { id: 'debt', label: 'Handle debt and credit', keywords: ['debt', 'credit', 'loan'] },
        { id: 'income', label: 'Earn and grow my income', keywords: ['income', 'business', 'earn'] },
        { id: 'learn', label: 'Just learn how money works', keywords: [] }
      ],
      timeTitle: 'How much time can you give each day?',
      timeHelp: 'Small and steady beats long and rare.',
      times: [
        { v: 5, label: '5 minutes', sub: 'A quick daily habit' },
        { v: 10, label: '10 minutes', sub: 'A steady pace' },
        { v: 15, label: '15 minutes', sub: 'Serious progress' },
        { v: 20, label: '20 minutes', sub: 'Going all in' }
      ],
      levelTitle: 'How comfortable are you with money topics?',
      levelHelp: 'There is no wrong answer. This helps us plan with you.',
      levels: [
        { v: 'beginner', label: 'Brand new', sub: 'Start from the basics' },
        { v: 'some', label: 'I know a little', sub: 'I have picked up some things' },
        { v: 'confident', label: 'Fairly confident', sub: 'I want to go deeper' }
      ],
      checkLink: 'Not sure? Check my level in 5 questions',
      checkTitle: 'Question',
      resultTitle: 'Thanks. Here is where you are.',
      resultScore: 'You got {n} of {total} right.',
      planTitle: 'Your plan is ready',
      planHelp: 'Here is a good place to start.',
      planCourse: 'Recommended course',
      planGoal: 'Your goal',
      planTime: 'Daily goal',
      planLevel: 'Your level',
      start: 'Start learning',
      saveChanges: 'Save changes',
      remind: 'Set a daily reminder',
      noCourse: 'More courses are coming soon.',
      loading: 'Preparing your plan...',
      saveError: 'Could not save. Check your connection and try again.',
      goalRow: 'Learning goal',
      notSet: 'Not set',
      updated: 'Learning goal updated',
      questions: [
        { q: 'Prices rise 10% over a year, but your savings earn 2%. What happens to what your savings can buy?', o: ['It buys the same', 'It buys less', 'It buys more'], a: 1 },
        { q: 'What is an emergency fund mainly for?', o: ['Paying for unexpected costs without borrowing', 'Buying things on sale', 'Investing for high returns'], a: 0 },
        { q: 'Compound interest means you earn interest on...', o: ['Only the money you first put in', 'Your original money and the interest it has already earned', 'Only the interest, not the original money'], a: 1 },
        { q: 'Which is generally true about investments with higher possible returns?', o: ['They never lose value', 'They are guaranteed', 'They usually carry higher risk'], a: 2 },
        { q: 'You borrow at 20% interest a year and only pay the minimum each month. What usually happens?', o: ['The debt is gone quickly', 'It takes longer and costs much more in total', 'The interest stops growing'], a: 1 }
      ]
    }
  };

  function lang() {
    try { return typeof getSavedLanguage === 'function' ? getSavedLanguage() : 'en'; } catch (e) { return 'en'; }
  }
  function C() { return CONTENT[lang()] || CONTENT.en; }

  /* ---------- styles ---------- */
  var style = document.createElement('style');
  style.textContent = `
.mm-ob {
  position: fixed; inset: 0; z-index: 3700; display: flex; flex-direction: column;
  background: #0b1220; opacity: 0; transform: translateY(3%);
  transition: opacity 0.25s ease, transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.mm-ob.is-open { opacity: 1; transform: translateY(0); }
.mm-ob-top {
  flex: 0 0 auto; display: flex; align-items: center; gap: 16px;
  padding: calc(env(safe-area-inset-top, 0px) + 16px) 20px 0; max-width: 560px; width: 100%; margin: 0 auto; box-sizing: border-box;
}
.mm-ob-bar { flex: 1; display: flex; gap: 6px; }
.mm-ob-seg { flex: 1; height: 4px; border-radius: 4px; background: #1c2640; }
.mm-ob-seg.is-on { background: #4da3ff; }
.mm-ob-skip { border: 0; background: transparent; color: #94a3b8; font-family: inherit; font-size: 0.95rem; font-weight: 600; cursor: pointer; padding: 8px 0; }
.mm-ob-body { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 30px 20px 12px; max-width: 560px; width: 100%; margin: 0 auto; box-sizing: border-box; }
.mm-ob-h { margin: 0 0 10px; color: #f8fafc; font-size: 1.65rem; font-weight: 800; line-height: 1.25; letter-spacing: -0.01em; }
.mm-ob-p { margin: 0 0 22px; color: #94a3b8; font-size: 0.98rem; line-height: 1.55; }
.mm-ob-q { margin: 0 0 6px; color: #4da3ff; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; }
.mm-ob-opt {
  width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 14px;
  margin: 0 0 10px; padding: 16px; border: 1px solid #26314d; border-radius: 14px; background: #111a2e;
  color: #e6e9f0; font-family: inherit; text-align: left; cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.mm-ob-opt:active { background: #16213a; }
.mm-ob-opt.is-sel { border-color: #4da3ff; background: rgba(77, 163, 255, 0.1); }
.mm-ob-opt-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.mm-ob-opt-text strong { font-size: 1rem; font-weight: 700; line-height: 1.35; }
.mm-ob-opt-text small { color: #94a3b8; font-size: 0.85rem; }
.mm-ob-dot {
  flex: 0 0 auto; width: 22px; height: 22px; border: 2px solid #3a4666; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: #06111f;
}
.mm-ob-opt.is-sel .mm-ob-dot { background: #4da3ff; border-color: #4da3ff; }
.mm-ob-link { display: block; width: 100%; margin: 6px 0 0; padding: 12px 0; border: 0; background: transparent; color: #4da3ff; font-family: inherit; font-size: 0.95rem; font-weight: 600; text-align: center; cursor: pointer; }
.mm-ob-foot { flex: 0 0 auto; display: flex; flex-direction: column; gap: 4px; padding: 12px 20px calc(18px + env(safe-area-inset-bottom, 0px)); max-width: 560px; width: 100%; margin: 0 auto; box-sizing: border-box; }
.mm-ob-btn {
  width: 100%; min-height: 54px; display: flex; align-items: center; justify-content: center;
  border: 0; border-radius: 14px; background: #1f6feb; color: #fff;
  font-family: inherit; font-size: 1rem; font-weight: 700; cursor: pointer;
  transition: transform 0.15s ease, opacity 0.2s ease;
}
.mm-ob-btn:active { transform: scale(0.98); }
.mm-ob-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.mm-ob-sum { border-top: 1px solid #1c2640; margin-bottom: 8px; }
.mm-ob-sum div { display: flex; justify-content: space-between; gap: 16px; padding: 15px 4px; border-bottom: 1px solid #1c2640; color: #94a3b8; font-size: 0.95rem; }
.mm-ob-sum strong { color: #f1f5f9; font-weight: 700; text-align: right; }
.mm-ob-err { min-height: 1.3em; margin: 0 0 4px; color: #f87171; font-size: 0.9rem; text-align: center; }
@media (prefers-reduced-motion: reduce) { .mm-ob { transition: none !important; } }
`;
  document.head.appendChild(style);

  /* ---------- helpers ---------- */
  var CHECK = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
  var CHEVRON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

  function find(list, key, value) {
    for (var i = 0; i < list.length; i++) if (list[i][key] === value) return list[i];
    return null;
  }

  function levelFromScore(score) {
    return score <= 1 ? 'beginner' : score <= 3 ? 'some' : 'confident';
  }

  // Picks the course whose title/description best matches the goal; otherwise the first course
  function recommend(courses, goalId) {
    if (!Array.isArray(courses) || !courses.length) return null;
    var goal = find(C().goals, 'id', goalId);
    var words = goal ? goal.keywords : [];
    var best = null;
    var bestScore = 0;
    courses.forEach(function (course) {
      var text = ((course.title || '') + ' ' + (course.description || '')).toLowerCase();
      var score = 0;
      words.forEach(function (w) { if (text.indexOf(w) !== -1) score += 1; });
      if (score > bestScore) { best = course; bestScore = score; }
    });
    return best || courses[0];
  }

  /* =====================================================
     THE FLOW
     ===================================================== */
  function open(mode) {
    var drawer = window.MiimiidDrawer;
    if (!drawer || typeof drawer.pushLayer !== 'function') return;
    if (document.querySelector('.mm-ob')) return;

    var edit = mode === 'edit';
    var state = {
      step: 'goal', goal: null, minutes: null, level: null,
      pick: null, qIndex: 0, score: 0, courses: null, loadingCourses: false, busy: false, error: ''
    };

    var el = document.createElement('section');
    el.className = 'mm-ob';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Set up your learning plan');
    el.innerHTML =
      '<div class="mm-ob-top"><div class="mm-ob-bar"></div><button type="button" class="mm-ob-skip"></button></div>' +
      '<div class="mm-ob-body"></div>' +
      '<div class="mm-ob-foot"></div>';
    document.body.appendChild(el);

    var barEl = el.querySelector('.mm-ob-bar');
    var skipEl = el.querySelector('.mm-ob-skip');
    var bodyEl = el.querySelector('.mm-ob-body');
    var footEl = el.querySelector('.mm-ob-foot');

    drawer.pushLayer(function () {
      el.classList.remove('is-open');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('is-open'); });
    });

    function optionRows(list, selected, valueKey) {
      return list.map(function (item) {
        var value = item[valueKey];
        var sel = selected === value;
        return '<button type="button" class="mm-ob-opt' + (sel ? ' is-sel' : '') + '" data-v="' + esc(value) + '">' +
          '<span class="mm-ob-opt-text"><strong>' + esc(item.label) + '</strong>' + (item.sub ? '<small>' + esc(item.sub) + '</small>' : '') + '</span>' +
          '<span class="mm-ob-dot">' + (sel ? CHECK : '') + '</span></button>';
      }).join('');
    }

    function segments(active) {
      var html = '';
      for (var i = 0; i < 4; i++) html += '<span class="mm-ob-seg' + (i <= active ? ' is-on' : '') + '"></span>';
      return html;
    }

    function loadCourses() {
      if (state.courses || state.loadingCourses) return;
      state.loadingCourses = true;
      api('/api/learn/courses?language=' + encodeURIComponent(lang())).then(function (r) {
        state.courses = r.ok && r.data && Array.isArray(r.data.data) ? r.data.data : [];
      }).catch(function () {
        state.courses = [];
      }).then(function () {
        state.loadingCourses = false;
        if (state.step === 'plan') render();
      });
    }

    function render() {
      var c = C();
      var step = state.step;
      var html = '';
      var cta = c.next;
      var ready = false;
      var showBack = step !== 'goal';
      var segActive = step === 'goal' ? 0 : step === 'time' ? 1 : step === 'plan' ? 3 : 2;

      if (step === 'goal') {
        html = '<h1 class="mm-ob-h">' + esc(c.goalTitle) + '</h1><p class="mm-ob-p">' + esc(c.goalHelp) + '</p>' +
          optionRows(c.goals, state.goal, 'id');
        ready = Boolean(state.goal);
      } else if (step === 'time') {
        html = '<h1 class="mm-ob-h">' + esc(c.timeTitle) + '</h1><p class="mm-ob-p">' + esc(c.timeHelp) + '</p>' +
          optionRows(c.times, state.minutes, 'v');
        ready = Boolean(state.minutes);
      } else if (step === 'level') {
        html = '<h1 class="mm-ob-h">' + esc(c.levelTitle) + '</h1><p class="mm-ob-p">' + esc(c.levelHelp) + '</p>' +
          optionRows(c.levels, state.level, 'v') +
          '<button type="button" class="mm-ob-link" data-action="check">' + esc(c.checkLink) + '</button>';
        ready = Boolean(state.level);
      } else if (step === 'check') {
        var q = c.questions[state.qIndex];
        var rows = q.o.map(function (text, i) { return { label: text, v: String(i) }; });
        html = '<p class="mm-ob-q">' + esc(c.checkTitle) + ' ' + (state.qIndex + 1) + ' / ' + c.questions.length + '</p>' +
          '<h1 class="mm-ob-h" style="font-size:1.35rem">' + esc(q.q) + '</h1>' +
          optionRows(rows, state.pick === null ? null : String(state.pick), 'v');
        ready = state.pick !== null;
      } else if (step === 'result') {
        var lvl = find(c.levels, 'v', state.level);
        html = '<h1 class="mm-ob-h">' + esc(c.resultTitle) + '</h1>' +
          '<p class="mm-ob-p">' + esc(c.resultScore.replace('{n}', state.score).replace('{total}', c.questions.length)) + '</p>' +
          '<div class="mm-ob-sum"><div><span>' + esc(c.planLevel) + '</span><strong>' + esc(lvl ? lvl.label : '') + '</strong></div></div>';
        ready = true;
      } else if (step === 'plan') {
        loadCourses();
        var goal = find(c.goals, 'id', state.goal);
        var time = find(c.times, 'v', state.minutes);
        var level = find(c.levels, 'v', state.level);
        var course = state.courses ? recommend(state.courses, state.goal) : null;

        if (!state.courses) {
          html = '<h1 class="mm-ob-h">' + esc(c.planTitle) + '</h1><p class="mm-ob-p">' + esc(c.loading) + '</p>';
        } else {
          html = '<h1 class="mm-ob-h">' + esc(c.planTitle) + '</h1><p class="mm-ob-p">' + esc(c.planHelp) + '</p>' +
            '<div class="mm-ob-sum">' +
              '<div><span>' + esc(c.planCourse) + '</span><strong>' + esc(course ? course.title : c.noCourse) + '</strong></div>' +
              '<div><span>' + esc(c.planGoal) + '</span><strong>' + esc(goal ? goal.label : '') + '</strong></div>' +
              '<div><span>' + esc(c.planTime) + '</span><strong>' + esc(time ? time.label : '') + '</strong></div>' +
              '<div><span>' + esc(c.planLevel) + '</span><strong>' + esc(level ? level.label : '') + '</strong></div>' +
            '</div>';
        }
        cta = edit ? c.saveChanges : c.start;
        ready = Boolean(state.courses) && !state.busy;
      }

      barEl.innerHTML = segments(segActive);
      skipEl.textContent = edit ? c.cancel : c.skip;
      bodyEl.innerHTML = html;
      bodyEl.scrollTop = 0;

      footEl.innerHTML =
        '<div class="mm-ob-err">' + esc(state.error) + '</div>' +
        '<button type="button" class="mm-ob-btn" id="mm-ob-next"' + (ready ? '' : ' disabled') + '>' + esc(cta) + '</button>' +
        (step === 'plan' && !edit ? '<button type="button" class="mm-ob-link" id="mm-ob-remind">' + esc(c.remind) + '</button>' : '') +
        (showBack ? '<button type="button" class="mm-ob-link" id="mm-ob-back" style="color:#94a3b8">' + esc(c.back) + '</button>' : '');
    }

    function save() {
      return api('/api/learn/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          goal: state.goal || 'learn',
          dailyMinutes: state.minutes || 10,
          level: state.level || 'beginner'
        })
      });
    }

    function startCourse(course) {
      if (!course) return;
      setTimeout(function () {
        Promise.resolve()
          .then(function () { if (typeof miimiidNavigate === 'function') return miimiidNavigate('learn'); })
          .then(function () { if (typeof openCourse === 'function') return openCourse(course._id); })
          .catch(function (e) { console.error('Onboarding start error:', e); });
      }, 380);
    }

    function finish(after) {
      if (state.busy) return;
      state.busy = true;
      state.error = '';
      render();

      save().then(function (r) {
        if (!r.ok) throw new Error('save');
        drawer.close();
        if (window.MiimiidDaily) window.MiimiidDaily.refresh();
        if (edit) {
          if (window.MiimiidAccount && window.MiimiidAccount.toast) window.MiimiidAccount.toast(C().updated);
          return;
        }
        if (after === 'remind') {
          setTimeout(function () {
            if (window.MiimiidReminders && window.MiimiidReminders.openPage) window.MiimiidReminders.openPage();
          }, 400);
        } else {
          startCourse(state.courses ? recommend(state.courses, state.goal) : null);
        }
      }).catch(function () {
        state.busy = false;
        state.error = C().saveError;
        render();
      });
    }

    /* ----- interactions ----- */
    bodyEl.addEventListener('click', function (event) {
      var opt = event.target.closest ? event.target.closest('.mm-ob-opt') : null;
      if (opt) {
        var v = opt.getAttribute('data-v');
        if (state.step === 'goal') state.goal = v;
        else if (state.step === 'time') state.minutes = Number(v);
        else if (state.step === 'level') state.level = v;
        else if (state.step === 'check') state.pick = Number(v);
        state.error = '';
        var keep = bodyEl.scrollTop;
        render();
        bodyEl.scrollTop = keep;
        return;
      }
      var action = event.target.closest ? event.target.closest('[data-action="check"]') : null;
      if (action) {
        state.step = 'check';
        state.qIndex = 0;
        state.score = 0;
        state.pick = null;
        state.level = null;
        render();
      }
    });

    footEl.addEventListener('click', function (event) {
      var target = event.target.closest ? event.target.closest('button') : null;
      if (!target) return;
      var c = C();

      if (target.id === 'mm-ob-back') {
        state.error = '';
        if (state.step === 'time') state.step = 'goal';
        else if (state.step === 'level') state.step = 'time';
        else if (state.step === 'check' || state.step === 'result' || state.step === 'plan') {
          state.step = 'level';
          if (state.step === 'level') { state.pick = null; }
        }
        render();
        return;
      }

      if (target.id === 'mm-ob-remind') { finish('remind'); return; }

      if (target.id === 'mm-ob-next' && !target.disabled) {
        state.error = '';
        if (state.step === 'goal') state.step = 'time';
        else if (state.step === 'time') state.step = 'level';
        else if (state.step === 'level') state.step = 'plan';
        else if (state.step === 'check') {
          if (state.pick === c.questions[state.qIndex].a) state.score += 1;
          state.pick = null;
          state.qIndex += 1;
          if (state.qIndex >= c.questions.length) {
            state.level = levelFromScore(state.score);
            state.step = 'result';
          }
        }
        else if (state.step === 'result') state.step = 'plan';
        else if (state.step === 'plan') { finish('start'); return; }
        render();
      }
    });

    skipEl.addEventListener('click', function () {
      if (edit) { drawer.close(); return; }
      api('/api/learn/onboarding/skip', { method: 'POST', body: '{}' }).catch(function () {});
      drawer.close();
    });

    render();
  }

  /* =====================================================
     STARTS BY ITSELF FOR NEW LEARNERS
     ===================================================== */
  var checked = false;

  function launchIfNeeded() {
    if (checked) return;
    var u = window.MIIMIID_CURRENT_USER || window.currentUser || {};
    if (!(u.id || u._id)) return;
    checked = true;

    api('/api/learn/onboarding').then(function (r) {
      var d = r.ok && r.data && r.data.data;
      if (d && d.needed) setTimeout(function () { open('first'); }, 600);
    }).catch(function () {});
  }

  var dash = document.getElementById('miimiid-dashboard');
  if (dash) {
    new MutationObserver(launchIfNeeded).observe(dash, { childList: true });
    launchIfNeeded();
  }

  /* =====================================================
     SETTINGS ROW: "Learning goal"
     ===================================================== */
  function mountSettings(body) {
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="mm-label">Learning</div>' +
      '<div class="mm-list">' +
        '<button type="button" class="mm-lrow" id="mm-ob-row">' +
          '<span class="mm-lrow-label">' + esc(C().goalRow) + '</span>' +
          '<span class="mm-lrow-value" id="mm-ob-value">' + esc(C().notSet) + '</span>' +
          CHEVRON +
        '</button>' +
      '</div>';
    body.appendChild(wrap);

    wrap.querySelector('#mm-ob-row').addEventListener('click', function () { open('edit'); });

    api('/api/learn/onboarding').then(function (r) {
      var profile = r.ok && r.data && r.data.data && r.data.data.profile;
      var goal = profile ? find(C().goals, 'id', profile.goal) : null;
      var valueEl = wrap.querySelector('#mm-ob-value');
      if (goal && valueEl) valueEl.textContent = goal.label;
    }).catch(function () {});
  }

  window.MiimiidOnboarding = { open: open, mountSettings: mountSettings };
})();
