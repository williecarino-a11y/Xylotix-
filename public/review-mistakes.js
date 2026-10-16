(function () {
  'use strict';
  if (window.__mmReviewInstalled) return;
  window.__mmReviewInstalled = true;

  /* ---------- styles ---------- */
  var style = document.createElement('style');
  style.textContent = `
.mm-review-row {
  width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 12px;
  margin: 0 0 16px; padding: 14px 18px;
  border: 1px solid #1f2a44; border-radius: 16px; background: #111a2e;
  color: #f1f5f9; font-family: inherit; font-size: 1rem; font-weight: 600;
  text-align: left; cursor: pointer; transition: background 0.18s ease, transform 0.15s ease;
}
.mm-review-row:active { transform: scale(0.985); background: #16213a; }
.mm-review-row .mm-review-label { flex: 1; }
.mm-review-count {
  padding: 3px 10px; border-radius: 999px; background: rgba(77,163,255,0.14);
  border: 1px solid rgba(77,163,255,0.4); color: #4da3ff; font-size: 0.8rem; font-weight: 700;
}
.mm-review-row svg { flex: 0 0 auto; color: #64748b; }

.mm-rv {
  position: fixed; inset: 0; z-index: 3700; display: flex; flex-direction: column;
  background: #0b1220; opacity: 0; transform: translateX(6%);
  transition: opacity 0.25s ease, transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.mm-rv.is-open { opacity: 1; transform: translateX(0); }
.mm-rv-head {
  flex: 0 0 auto; display: flex; align-items: center; gap: 6px;
  padding: calc(env(safe-area-inset-top, 0px) + 8px) 12px 8px; border-bottom: 1px solid #1c2640;
}
.mm-rv-title { margin: 0; color: #f8fafc; font-size: 1.1rem; font-weight: 700; }
.mm-rv-body {
  flex: 1; overflow-y: auto; overscroll-behavior: contain;
  padding: 22px 18px calc(36px + env(safe-area-inset-bottom, 0px));
}
.mm-rv-wrap { max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
.mm-rv-center { align-items: center; text-align: center; padding-top: 40px; }
.mm-rv-muted { margin: 0; color: #94a3b8; font-size: 0.95rem; line-height: 1.55; }
.mm-rv-progress { display: flex; flex-direction: column; gap: 8px; color: #94a3b8; font-size: 0.85rem; font-weight: 600; }
.mm-rv-bar { height: 4px; border-radius: 4px; background: #1c2640; overflow: hidden; }
.mm-rv-bar i { display: block; height: 100%; background: #4da3ff; transition: width 0.3s ease; }
.mm-rv-context { margin: 0; color: #aab6cc; font-size: 0.95rem; line-height: 1.6; }
.mm-rv-q { margin: 0; color: #f8fafc; font-size: 1.2rem; line-height: 1.45; }
.mm-rv-options { display: flex; flex-direction: column; gap: 10px; }
.mm-rv-opt {
  width: 100%; box-sizing: border-box; min-height: 54px; padding: 12px 16px;
  border: 1px solid #26314d; border-radius: 14px; background: #111a2e; color: #e6e9f0;
  font-family: inherit; font-size: 1rem; font-weight: 600; text-align: left; cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.mm-rv-opt:active:not(:disabled) { background: #16213a; }
.mm-rv-opt:disabled { cursor: default; }
.mm-rv-opt.is-correct { border-color: #22c55e; background: rgba(34,197,94,0.12); }
.mm-rv-opt.is-wrong { border-color: #ef4444; background: rgba(239,68,68,0.12); }
.mm-rv-input {
  width: 100%; box-sizing: border-box; min-height: 54px; padding: 0 16px;
  border: 1px solid #26314d; border-radius: 14px; background: #111a2e; color: #f1f5f9;
  font-family: inherit; font-size: 1rem;
}
.mm-rv-input:focus { outline: none; border-color: #4da3ff; }
.mm-rv-feedback { padding: 14px 16px; border-radius: 14px; font-size: 0.95rem; line-height: 1.55; color: #cbd5e1; }
.mm-rv-feedback.is-correct { background: rgba(34,197,94,0.1); }
.mm-rv-feedback.is-wrong { background: rgba(239,68,68,0.1); }
.mm-rv-feedback strong { display: block; margin-bottom: 4px; color: #f8fafc; }
.mm-rv-btn {
  width: 100%; min-height: 54px; display: flex; align-items: center; justify-content: center;
  border: 0; border-radius: 14px; background: #1f6feb; color: #fff;
  font-family: inherit; font-size: 1rem; font-weight: 700; cursor: pointer;
  transition: transform 0.15s ease, opacity 0.2s ease;
}
.mm-rv-btn:active { transform: scale(0.98); }
.mm-rv-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
@media (prefers-reduced-motion: reduce) { .mm-rv, .mm-rv-bar i { transition: none !important; } }
`;
  document.head.appendChild(style);

  /* ---------- helpers ---------- */
  var BACK = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';
  var CHEVRON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function lang() {
    try { return typeof getSavedLanguage === 'function' ? getSavedLanguage() : 'en'; } catch (e) { return 'en'; }
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

  /* ---------- the row on Home ---------- */
  var loadingRow = false;

  function renderRow() {
    var content = document.querySelector('#miimiid-dashboard .miimiid-dashboard-content');
    if (!content || content.querySelector('.mm-review-row') || loadingRow) return;
    loadingRow = true;

    api('/api/learn/review/summary').then(function (r) {
      loadingRow = false;
      var count = r.ok && r.data && r.data.data ? Number(r.data.data.count) : 0;
      var current = document.querySelector('#miimiid-dashboard .miimiid-dashboard-content');
      if (!count || !current || current.querySelector('.mm-review-row')) return;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mm-review-row';
      btn.innerHTML =
        '<span class="mm-review-label">Review mistakes</span>' +
        '<span class="mm-review-count">' + count + ' to review</span>' + CHEVRON;
      btn.addEventListener('click', openReview);

      var anchor = current.querySelector('.mm-continue');
      if (anchor) anchor.insertAdjacentElement('afterend', btn);
      else current.insertBefore(btn, current.firstChild);
    }).catch(function () { loadingRow = false; });
  }

  function refreshRow() {
    var old = document.querySelector('.mm-review-row');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    renderRow();
  }

  /* ---------- the review page ---------- */
  function openReview() {
    var drawer = window.MiimiidDrawer;
    if (!drawer || typeof drawer.pushLayer !== 'function') return;

    var el = document.createElement('section');
    el.className = 'mm-rv';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Review mistakes');
    el.innerHTML =
      '<header class="mm-rv-head">' +
        '<button type="button" class="mm-icon-btn" aria-label="Back">' + BACK + '</button>' +
        '<h2 class="mm-rv-title">Review mistakes</h2>' +
      '</header>' +
      '<div class="mm-rv-body"></div>';
    document.body.appendChild(el);

    var body = el.querySelector('.mm-rv-body');
    el.querySelector('button').addEventListener('click', function () { drawer.close(); });

    drawer.pushLayer(function () {
      el.classList.remove('is-open');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
      refreshRow();
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('is-open'); });
    });

    var questions = [];
    var index = 0;
    var right = 0;

    function showMessage(title, text) {
      body.innerHTML =
        '<div class="mm-rv-wrap mm-rv-center">' +
          '<h3 class="mm-rv-q">' + esc(title) + '</h3>' +
          '<p class="mm-rv-muted">' + esc(text) + '</p>' +
          '<button type="button" class="mm-rv-btn" id="mm-rv-done">Done</button>' +
        '</div>';
      body.querySelector('#mm-rv-done').addEventListener('click', function () { drawer.close(); });
    }

    function showSummary() {
      var total = questions.length;
      showMessage(
        'Review complete',
        'You got ' + right + ' of ' + total + ' right. ' +
        (right === total
          ? 'Those questions are cleared from your list.'
          : 'The ones you missed stay in your list so you can try them again.')
      );
    }

    function showQuestion() {
      var q = questions[index];
      var total = questions.length;
      var isCalc = q.questionType === 'calculate';
      var options = Array.isArray(q.options) ? q.options : [];
      var answered = false;

      var html =
        '<div class="mm-rv-wrap">' +
          '<div class="mm-rv-progress"><span>Question ' + (index + 1) + ' of ' + total + '</span>' +
            '<div class="mm-rv-bar"><i style="width:' + Math.round((index / total) * 100) + '%"></i></div></div>' +
          (q.context ? '<p class="mm-rv-context">' + esc(q.context) + '</p>' : '') +
          '<h3 class="mm-rv-q">' + esc(q.question) + '</h3>';

      if (isCalc) {
        html +=
          '<input class="mm-rv-input" id="mm-rv-num" type="number" inputmode="decimal" step="any" placeholder="Your answer">' +
          '<button type="button" class="mm-rv-btn" id="mm-rv-check" disabled>Check answer</button>';
      } else {
        html += '<div class="mm-rv-options">' +
          options.map(function (o, i) {
            return '<button type="button" class="mm-rv-opt" data-i="' + i + '">' + esc(o) + '</button>';
          }).join('') + '</div>';
      }

      html +=
          '<div class="mm-rv-feedback" id="mm-rv-fb" hidden></div>' +
          '<button type="button" class="mm-rv-btn" id="mm-rv-next" hidden>' +
            (index + 1 < total ? 'Next' : 'See results') + '</button>' +
        '</div>';

      body.innerHTML = html;
      body.scrollTop = 0;

      var feedback = body.querySelector('#mm-rv-fb');
      var nextBtn = body.querySelector('#mm-rv-next');

      function showResult(correct, correctAnswer, given) {
        if (correct) right += 1;

        if (isCalc) {
          body.querySelector('#mm-rv-num').disabled = true;
          body.querySelector('#mm-rv-check').hidden = true;
        } else {
          body.querySelectorAll('.mm-rv-opt').forEach(function (btn) {
            btn.disabled = true;
            var i = Number(btn.getAttribute('data-i'));
            if (i === Number(correctAnswer)) btn.classList.add('is-correct');
            else if (i === given && !correct) btn.classList.add('is-wrong');
          });
        }

        feedback.className = 'mm-rv-feedback ' + (correct ? 'is-correct' : 'is-wrong');
        feedback.innerHTML =
          '<strong>' + (correct ? 'Correct' : 'Not quite') + '</strong>' +
          (isCalc && !correct ? 'The answer is ' + esc(correctAnswer) + '. ' : '') +
          esc(q.explanation || '');
        feedback.hidden = false;
        nextBtn.hidden = false;
      }

      function submit(answer) {
        if (answered) return;
        answered = true;

        api('/api/learn/review/answer', {
          method: 'POST',
          body: JSON.stringify({ quizId: q._id, answer: answer })
        }).then(function (r) {
          var d = r.data && r.data.data;
          if (r.ok && d) {
            showResult(d.correct === true, d.correctAnswer, answer);
          } else {
            answered = false;
            feedback.className = 'mm-rv-feedback is-wrong';
            feedback.textContent = (r.data && r.data.message) || 'Unable to check your answer.';
            feedback.hidden = false;
          }
        }).catch(function () {
          answered = false;
          feedback.className = 'mm-rv-feedback is-wrong';
          feedback.textContent = 'Could not reach the server. Check your connection.';
          feedback.hidden = false;
        });
      }

      if (isCalc) {
        var input = body.querySelector('#mm-rv-num');
        var check = body.querySelector('#mm-rv-check');
        input.addEventListener('input', function () { check.disabled = input.value.trim() === ''; });
        check.addEventListener('click', function () { submit(Number(input.value)); });
      } else {
        body.querySelectorAll('.mm-rv-opt').forEach(function (btn) {
          btn.addEventListener('click', function () { submit(Number(btn.getAttribute('data-i'))); });
        });
      }

      nextBtn.addEventListener('click', function () {
        index += 1;
        if (index >= questions.length) showSummary();
        else showQuestion();
      });
    }

    body.innerHTML = '<div class="mm-rv-wrap mm-rv-center"><p class="mm-rv-muted">Loading...</p></div>';

    api('/api/learn/review?language=' + encodeURIComponent(lang())).then(function (r) {
      var list = r.ok && r.data && r.data.data ? r.data.data.questions : null;
      if (!Array.isArray(list)) {
        showMessage('Could not load', (r.data && r.data.message) || 'Please try again in a moment.');
        return;
      }
      if (!list.length) {
        showMessage('Nothing to review', 'You have no mistakes to practise right now. Nice work.');
        return;
      }
      questions = list;
      showQuestion();
    }).catch(function () {
      showMessage('Could not load', 'Check your connection and try again.');
    });
  }

  /* ---------- start ---------- */
  var dash = document.getElementById('miimiid-dashboard');
  if (dash) {
    new MutationObserver(renderRow).observe(dash, { childList: true });
    renderRow();
  }
})();
