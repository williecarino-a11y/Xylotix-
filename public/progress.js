(function () {
  'use strict';
  if (window.__mmProgressInstalled) return;
  window.__mmProgressInstalled = true;

  /* ---------- styles ---------- */
  var style = document.createElement('style');
  style.textContent = `
.mm-pg { max-width: 560px; margin: 0 auto; }
.mm-pg-stats { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #1c2640; }
.mm-pg-stat { display: flex; flex-direction: column; gap: 4px; padding: 16px 4px; border-bottom: 1px solid #1c2640; }
.mm-pg-stat:nth-child(odd) { border-right: 1px solid #1c2640; padding-right: 12px; }
.mm-pg-stat:nth-child(even) { padding-left: 16px; }
.mm-pg-stat strong { color: #f8fafc; font-size: 1.6rem; font-weight: 800; line-height: 1.1; }
.mm-pg-stat small { color: #94a3b8; font-size: 0.82rem; font-weight: 600; }

.mm-pg-cal { display: grid; grid-template-columns: repeat(12, 1fr); grid-template-rows: repeat(7, auto); grid-auto-flow: column; gap: 4px; }
.mm-pg-day { aspect-ratio: 1; border-radius: 4px; background: #14203a; }
.mm-pg-day.is-on { background: #4da3ff; }
.mm-pg-day.is-today { outline: 1.5px solid #94a3b8; outline-offset: 1px; }
.mm-pg-day.is-future { visibility: hidden; }

.mm-pg-bars { display: flex; align-items: flex-end; gap: 4px; height: 96px; }
 .mm-pg-b { flex: 1; max-width: 34px; min-height: 3px; border-radius: 4px 4px 0 0; background: #4da3ff; }
.mm-pg-b.is-low { background: #f87171; }
.mm-pg-cap { margin: 8px 0 0; color: #8b95ad; font-size: 0.82rem; line-height: 1.5; }
.mm-pg-empty { padding: 14px 4px; color: #8b95ad; font-size: 0.92rem; }

.mm-pg-course {
  width: 100%; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px;
  padding: 16px 4px 14px; border: 0; border-bottom: 1px solid #1c2640; background: transparent;
  color: inherit; font-family: inherit; text-align: left;
}
button.mm-pg-course { cursor: pointer; }
button.mm-pg-course:active { background: rgba(148, 163, 184, 0.08); }
.mm-pg-course-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: #f1f5f9; font-weight: 700; }
.mm-pg-course-top span:last-child { flex: 0 0 auto; color: #4da3ff; font-size: 0.85rem; font-weight: 700; }
.mm-pg-bar { height: 5px; border-radius: 5px; background: #1c2640; overflow: hidden; }
.mm-pg-bar i { display: block; height: 100%; border-radius: 5px; background: #4da3ff; }
.mm-pg-bar i.is-done { background: #34d399; }
.mm-pg-sub { color: #94a3b8; font-size: 0.85rem; }

.mm-cert-preview { display: block; width: 100%; height: auto; border: 1px solid #1f2a44; border-radius: 12px; }
`;
  document.head.appendChild(style);

  /* ---------- helpers ---------- */
  var CHEVRON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';
  var FONT = '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function api(url) {
    return fetch(url, { credentials: 'same-origin', headers: { 'Accept': 'application/json' } }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        return { ok: response.ok, data: data };
      });
    });
  }

  function user() { return window.MIIMIID_CURRENT_USER || window.currentUser || {}; }

  function timezone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; }
  }

  /* ---------- the Progress page ---------- */
  function calendar(data) {
    var todayMs = Date.parse(data.today + 'T00:00:00Z');
    var todayDow = new Date(todayMs).getUTCDay();
    var active = {};
    (data.activeDays || []).forEach(function (k) { active[k] = true; });

    var cells = '';
    for (var c = 0; c < 12; c++) {
      for (var r = 0; r < 7; r++) {
        var offset = (c - 11) * 7 + (r - todayDow);
        if (offset > 0) { cells += '<span class="mm-pg-day is-future"></span>'; continue; }
        var key = new Date(todayMs + offset * 86400000).toISOString().slice(0, 10);
        cells += '<span class="mm-pg-day' + (active[key] ? ' is-on' : '') + (offset === 0 ? ' is-today' : '') + '"></span>';
      }
    }
    return '<div class="mm-pg-cal">' + cells + '</div>';
  }

  function render(body, data) {
    var t = data.totals;
    var scores = data.quizScores || [];

    body.innerHTML =
      '<div class="mm-pg">' +
        '<div class="mm-pg-stats">' +
          '<div class="mm-pg-stat"><strong>' + t.lessonsCompleted + '</strong><small>Lessons completed</small></div>' +
          '<div class="mm-pg-stat"><strong>' + t.averageQuizScore + '%</strong><small>Average quiz score</small></div>' +
          '<div class="mm-pg-stat"><strong>' + t.streak + '</strong><small>Current streak</small></div>' +
          '<div class="mm-pg-stat"><strong>' + t.bestStreak + '</strong><small>Best streak</small></div>' +
        '</div>' +

        '<div class="mm-label" style="margin-top:28px">Last 12 weeks</div>' +
        calendar(data) +
        '<p class="mm-pg-cap">Each square is a day you completed a lesson.</p>' +

        '<div class="mm-label" style="margin-top:28px">Recent quiz scores</div>' +
        (scores.length
          ? '<div class="mm-pg-bars">' + scores.map(function (s) {
              return '<span class="mm-pg-b' + (s < 50 ? ' is-low' : '') + '" style="height:' + Math.max(3, s) + '%" title="' + s + '%"></span>';
            }).join('') + '</div><p class="mm-pg-cap">Your last ' + scores.length + ' quizzes. Red means below the 50% pass mark.</p>'
          : '<p class="mm-pg-empty">Finish a lesson quiz to see your scores here.</p>') +

        '<div class="mm-label" style="margin-top:28px">Courses</div>' +
        '<div style="border-top:1px solid #1c2640">' +
          (data.courses.length ? data.courses.map(function (c) {
            var inner =
              '<span class="mm-pg-course-top"><span>' + esc(c.title) + '</span>' +
              (c.completed ? '<span>Certificate ' + CHEVRON + '</span>' : '<span>' + c.percent + '%</span>') + '</span>' +
              '<span class="mm-pg-bar"><i class="' + (c.completed ? 'is-done' : '') + '" style="width:' + c.percent + '%"></i></span>' +
              '<span class="mm-pg-sub">' + c.done + ' of ' + c.total + ' lessons' + (c.completed ? ' \u00b7 Completed' : '') + '</span>';
            return c.completed
              ? '<button type="button" class="mm-pg-course" data-cert="' + esc(c.id) + '">' + inner + '</button>'
              : '<div class="mm-pg-course">' + inner + '</div>';
          }).join('') : '<p class="mm-pg-empty">No courses available yet.</p>') +
        '</div>' +
        (data.courses.length
          ? '<button type="button" class="mm-lrow" data-sample="1" style="margin-top:14px;border-top:1px solid #1c2640"><span class="mm-lrow-label">Preview a certificate</span>' + CHEVRON + '</button>'
          : '') +
      '</div>';

    body.onclick = function (event) {
      if (event.target.closest && event.target.closest('[data-sample]')) {
        openCertificate({
          title: (data.courses[0] && data.courses[0].title) || 'Your course',
          completedAt: null,
          certificateId: 'SAMPLE',
          sample: true
        });
        return;
      }
      var btn = event.target.closest ? event.target.closest('[data-cert]') : null;
      if (!btn) return;
      var id = btn.getAttribute('data-cert');
      var course = data.courses.filter(function (c) { return c.id === id; })[0];
      if (course) openCertificate(course);
    };
  }

  function openProgress() {
    var account = window.MiimiidAccount;
    if (!account || typeof account.openSub !== 'function') return;

    account.openSub('Progress', function (body) {
      body.innerHTML = '<div class="mm-pg"><p class="mm-sf-help">Loading...</p></div>';
      api('/api/learn/progress?tz=' + encodeURIComponent(timezone())).then(function (r) {
        var data = r.ok && r.data && r.data.data;
        if (!data) {
          body.innerHTML = '<div class="mm-pg"><p class="mm-sf-help">Could not load your progress. Check your connection and try again.</p></div>';
          return;
        }
        render(body, data);
      }).catch(function () {
        body.innerHTML = '<div class="mm-pg"><p class="mm-sf-help">Could not reach the server. Check your connection.</p></div>';
      });
    });
  }

  /* ---------- the certificate ---------- */
  function fitFont(ctx, text, maxWidth, size, weight) {
    var s = size;
    for (;;) {
      ctx.font = weight + ' ' + s + 'px ' + FONT;
      if (ctx.measureText(text).width <= maxWidth || s <= 28) return s;
      s -= 2;
    }
  }

  function draw(canvas, info) {
    var W = 1600;
    var H = 1131;
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#4da3ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(44, 44, W - 88, H - 88);
    ctx.strokeStyle = '#1f2a44';
    ctx.lineWidth = 2;
    ctx.strokeRect(64, 64, W - 128, H - 128);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    function line(text, y, size, weight, color, spacing) {
      ctx.fillStyle = color;
      if ('letterSpacing' in ctx) ctx.letterSpacing = spacing || '0px';
      var s = fitFont(ctx, text, W - 300, size, weight);
      ctx.font = weight + ' ' + s + 'px ' + FONT;
      ctx.fillText(text, W / 2, y);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    }

    line('MIIMIID FINANCIAL ACADEMY', 250, 34, '700', '#4da3ff', '8px');
    line('Certificate of completion', 390, 88, '700', '#f8fafc');
    line('This certifies that', 505, 36, '500', '#94a3b8');
    line(info.name, 630, 104, '800', '#f8fafc');
    line('has successfully completed the course', 725, 36, '500', '#94a3b8');
    line(info.course, 825, 66, '700', '#e2e8f0');
    line('Completed on ' + info.date, 925, 34, '500', '#94a3b8');
    line('Certificate ID ' + info.id, 1010, 28, '600', '#64748b', '2px');
    line(
      info.sample
        ? 'Sample preview. Finish the course to earn your own certificate.'
        : 'Awarded for finishing a Miimiid course. Not an accredited qualification.',
      1056, 22, '500', '#475569'
    );
  }

  function openCertificate(course) {
    var account = window.MiimiidAccount;
    if (!account || typeof account.openSub !== 'function') return;

    var u = user();
    var info = {
      name: String(u.name || 'Miimiid Learner').trim() || 'Miimiid Learner',
      course: course.title,
      date: new Date(course.completedAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
      id: course.certificateId || '',
      sample: Boolean(course.sample)
    };

    account.openSub('Certificate', function (body) {
      body.innerHTML =
        '<div class="mm-pg">' +
          '<canvas class="mm-cert-preview" aria-label="Certificate of completion"></canvas>' +
          '<div class="mm-sf" style="margin-top:22px">' +
            '<button type="button" class="mm-sf-btn" id="mm-cert-save"><span>Save image</span></button>' +
            '<button type="button" class="mm-sf-btn is-ghost" id="mm-cert-share" style="background:transparent;border:1px solid #26314d;color:#e6e9f0"><span>Share</span></button>' +
            '<div class="mm-sf-msg" role="alert"></div>' +
          '</div>' +
        '</div>';

      var canvas = body.querySelector('canvas');
      var msg = body.querySelector('.mm-sf-msg');
      draw(canvas, info);

      var fileName = 'miimiid-certificate-' + String(course.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';

      function toBlob() {
        return new Promise(function (resolve, reject) {
          canvas.toBlob(function (blob) { blob ? resolve(blob) : reject(new Error('blob')); }, 'image/png');
        });
      }

      function save() {
        return toBlob().then(function (blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        });
      }

      body.querySelector('#mm-cert-save').addEventListener('click', function () {
        msg.textContent = '';
        save().catch(function () { msg.textContent = 'Could not save the image.'; });
      });

      body.querySelector('#mm-cert-share').addEventListener('click', function () {
        msg.textContent = '';
        toBlob().then(function (blob) {
          var file = new File([blob], fileName, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            return navigator.share({ files: [file], title: 'My Miimiid certificate' });
          }
          return save();
        }).catch(function (error) {
          if (error && error.name === 'AbortError') return;
          msg.textContent = 'Could not share the certificate.';
        });
      });
    });
  }

  /* ---------- tapping a stat card on Home opens Progress ---------- */
  var dash = document.getElementById('miimiid-dashboard');
  if (dash) {
    dash.addEventListener('click', function (event) {
      var card = event.target.closest ? event.target.closest('[data-dashboard-stat]') : null;
      if (!card) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openProgress();
    }, true);
  }

  window.MiimiidProgress = { open: openProgress };
})();
