/* =========================================================
   MIIMIID LEARN JOURNEY
   Replaces the old card/button UI for:
   course list, course page, lesson reader, quiz, next lesson.
   Loaded LAST in index.html, so it wraps whatever other files
   already did to openCourse / openLesson / completeLesson.
   ========================================================= */
(function () {
  "use strict";

  if (window.__miimiidLearnJourney) return;
  window.__miimiidLearnJourney = true;

  // Matches learningService.getUserDashboardStats: totalXP = lessons completed x 50
  var LESSON_XP = 50;

  var LJ = {
    mode: "read",      // read | quiz | result
    qi: 0,             // current question index
    result: null,      // last quiz result from the server
    busy: false,
    msg: "",
    chk: [],           // per-question check results from the server
    busyText: "",      // label shown on the button while busy
    saving: false,     // progress is being saved after a passed quiz
    saved: false,      // progress was saved
    reward: null,      // XP / daily goal numbers shown on the result screen
    rewardPlayed: false,
    goNext: false      // set while "complete lesson" is running
  };

  /* ---------- helpers ---------- */

  function $(id) { return document.getElementById(id); }

  function lang() {
    try { return getSavedLanguage(); } catch (e) { return "en"; }
  }

  // Use the app translation when it exists, otherwise the English fallback.
  function t(key, fallback) {
    try {
      var v = miimiidTranslate(key, lang());
      if (typeof v === "string" && v && v !== key) return v;
    } catch (e) { /* ignore */ }
    return fallback;
  }

  function esc(s) {
    s = s === null || s === undefined ? "" : String(s);
    if (typeof escapeHtml === "function") return escapeHtml(s);
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function setNavHeight() {
    var nav = $("miimiid-bottom-nav");
    var h = nav && nav.offsetHeight ? nav.offsetHeight : 64;
    document.documentElement.style.setProperty("--lj-nav", h + "px");
  }

  function completedIds() {
    return courseDataCache && Array.isArray(courseDataCache.completedLessonIds)
      ? courseDataCache.completedLessonIds.map(String)
      : [];
  }

  function allLessons() {
    var out = [];
    if (courseDataCache && Array.isArray(courseDataCache.modules)) {
      courseDataCache.modules.forEach(function (m) {
        (Array.isArray(m.lessons) ? m.lessons : []).forEach(function (l) { out.push(l); });
      });
    }
    return out;
  }

  function nextLesson() {
    var list = allLessons();
    var i = list.findIndex(function (l) { return String(l._id) === String(currentLessonId); });
    return i >= 0 && i < list.length - 1 ? list[i + 1] : null;
  }

  function isCompleted(id) {
    return completedIds().indexOf(String(id)) !== -1;
  }

  function lessonMinutes() {
    var cur = allLessons().filter(function (l) { return String(l._id) === String(currentLessonId); })[0];
    return cur ? Number(cur.estimatedDuration) || 0 : 0;
  }

  function ring(pct, size, label, cls) {
    pct = Math.max(0, Math.min(100, Number(pct) || 0));
    var r = 18;
    var c = 2 * Math.PI * r;
    var off = c * (1 - pct / 100);
    var text = label !== undefined ? label : String(Math.round(pct));
    return (
      '<svg class="lj-ring ' + (cls || "") + '" viewBox="0 0 44 44" width="' + size +
      '" height="' + size + '" aria-hidden="true">' +
      '<circle class="lj-ring-bg" cx="22" cy="22" r="18"/>' +
      '<circle class="lj-ring-fg" cx="22" cy="22" r="18" stroke-dasharray="' + c.toFixed(2) +
      '" stroke-dashoffset="' + off.toFixed(2) + '" transform="rotate(-90 22 22)"/>' +
      '<text x="22" y="26" text-anchor="middle">' + esc(text) + "</text></svg>"
    );
  }

  /* ---------- 1. COURSE LIST ---------- */

  async function fetchProgress(courseId, uid) {
    if (!uid) return null;
    try {
      var r = await fetch(
        "/api/learn/courses/" + courseId + "/progress/" + encodeURIComponent(uid)
      );
      var d = await r.json();
      return r.ok && d.status === "success" && d.data ? d.data : null;
    } catch (e) {
      return null;
    }
  }

  window.fetchCourses = async function () {
    var container = $("courses-container");
    showLoading(true);
    hideError();

    try {
      var res = await fetch(
        "/api/learn/courses?language=" + encodeURIComponent(lang())
      );
      var result = await res.json();

      if (!res.ok || result.status !== "success") {
        throw new Error(result.message || "load failed");
      }

      var courses = Array.isArray(result.data) ? result.data : [];

      if (courses.length === 0) {
        container.innerHTML =
          '<p class="lj-empty">' + esc(t("noModules", "No courses yet.")) + "</p>";
        return;
      }

      var uid = typeof getMiimiidCurrentUserId === "function" ? getMiimiidCurrentUserId() : null;
      var progress = await Promise.all(
        courses.map(function (c) { return fetchProgress(c._id, uid); })
      );

      container.innerHTML =
        '<div class="lj-page-title">' + esc(t("learn", "Learn")) + "</div>" +
        '<div class="lj-list">' +
        courses
          .map(function (c, i) {
            var p = progress[i] || {};
            var pct = Number(p.progressPercentage || 0);
            var done = Number(p.completedLessons || 0);
            var total = Number(p.totalLessons || 0);

            var pill;
            if (pct >= 100) {
              pill = '<span class="lj-pill is-done">' + esc(t("completed", "Completed")) + "</span>";
            } else if (pct > 0) {
              pill = '<span class="lj-pill is-continue">' + esc(t("continue", "Continue")) + "</span>";
            } else {
              pill = '<span class="lj-pill">' + esc(t("start", "Start")) + "</span>";
            }

            var sub = total > 0
              ? done + " / " + total + " " + t("lessons", "lessons")
              : esc(c.description || "");

            return (
              '<button type="button" class="lj-course" onclick="openCourse(\'' + esc(c._id) + '\')">' +
              ring(pct, 44, undefined, pct >= 100 ? "lj-ring-good" : "") +
              '<span class="lj-course-main"><span class="lj-course-title">' + esc(c.title || "") +
              '</span><span class="lj-course-sub">' + sub + "</span></span>" +
              pill +
              "</button>"
            );
          })
          .join("") +
        "</div>";
    } catch (error) {
      console.error("fetchCourses error:", error);
      showError(t("unableToLoadCourses", "Unable to load courses."));
    } finally {
      showLoading(false);
    }
  };

  /* ---------- 2. COURSE PAGE ---------- */

  var ICON_DONE =
    '<svg class="lj-st lj-st-done" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>';
  var ICON_CUR =
    '<svg class="lj-st lj-st-cur" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M10 8.5l5 3.5-5 3.5z"/></svg>';
  var ICON_TODO =
    '<svg class="lj-st lj-st-todo" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>';

  window.renderModules = function (modules) {
    var container = $("modules-container");

    if (!Array.isArray(modules) || modules.length === 0) {
      container.innerHTML =
        '<p class="lj-empty">' + esc(t("noModules", "No modules yet.")) + "</p>";
      return;
    }

    var done = completedIds();

    // current lesson = first lesson not completed yet
    var current = null;
    var started = done.length > 0;
    outer:
    for (var a = 0; a < modules.length; a++) {
      var ls = Array.isArray(modules[a].lessons) ? modules[a].lessons : [];
      for (var b = 0; b < ls.length; b++) {
        if (done.indexOf(String(ls[b]._id)) === -1) { current = ls[b]; break outer; }
      }
    }

    var html = "";

    if (current) {
      html +=
        '<button type="button" class="lj-continue" onclick="openLesson(\'' + esc(current._id) + '\')">' +
        '<span class="lj-continue-text"><span class="lj-continue-label">' +
        esc(started ? t("continue", "Continue") : t("start", "Start")) +
        '</span><span class="lj-continue-title">' +
        esc(current.title || t("untitledLesson", "Untitled lesson")) +
        '</span></span><span class="lj-continue-play"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span></button>';
    }

    modules.forEach(function (m, mi) {
      var lessons = Array.isArray(m.lessons) ? m.lessons : [];
      var cnt = lessons.filter(function (l) { return done.indexOf(String(l._id)) !== -1; }).length;
      var allDone = lessons.length > 0 && cnt === lessons.length;

      html +=
        '<section class="lj-module"><div class="lj-module-head"><span class="lj-module-title">' +
        esc(m.title || "Module " + (mi + 1)) +
        '</span><span class="lj-module-count' + (allDone ? " is-done" : "") + '">' +
        cnt + "/" + lessons.length + "</span></div>";

      if (lessons.length === 0) {
        html += '<p class="lj-empty">' + esc(t("noLessons", "No lessons yet.")) + "</p>";
      } else {
        html += lessons
          .map(function (l) {
            var id = String(l._id);
            var isDone = done.indexOf(id) !== -1;
            var isCur = !!current && String(current._id) === id;
            var mins = Number(l.estimatedDuration);
            return (
              '<button type="button" class="lj-lesson' + (isDone ? " is-done" : "") +
              (isCur ? " is-current" : "") + '" onclick="openLesson(\'' + esc(id) + '\')">' +
              (isDone ? ICON_DONE : isCur ? ICON_CUR : ICON_TODO) +
              '<span class="lj-lesson-title">' +
              esc(l.title || t("untitledLesson", "Untitled lesson")) + "</span>" +
              (mins > 0 ? '<span class="lj-lesson-min">' + mins + " min</span>" : "") +
              "</button>"
            );
          })
          .join("");
      }

      html += "</section>";
    });

    container.innerHTML = html;
  };

  // The old openCourse drew the modules BEFORE the progress arrived, so ticks
  // never showed on first open. Draw them again once progress is loaded.
  var originalOpenCourse = window.openCourse;

  window.openCourse = async function (courseId) {
    await originalOpenCourse(courseId);

    try {
      if (courseDataCache && Array.isArray(courseDataCache.modules)) {
        renderModules(courseDataCache.modules);
      }
    } catch (e) {
      console.error(e);
    }

    // After "complete lesson", go straight to the next lesson.
    if (LJ.goNext) {
      LJ.goNext = false;
      LJ.busy = false;

      // Lesson saved: update the Home daily goal row (and its "goal reached" toast).
      try {
        if (window.MiimiidDaily && typeof window.MiimiidDaily.refresh === "function") {
          window.MiimiidDaily.refresh();
        }
      } catch (e) { /* ignore */ }

      var next = nextLesson();
      if (next) {
        openLesson(next._id);
        return;
      }
    }

    setNavHeight();
    window.scrollTo(0, 0);
  };

  var originalBackToModules = window.backToModules;

  window.backToModules = function () {
    originalBackToModules();
    try {
      if (courseDataCache && Array.isArray(courseDataCache.modules)) {
        renderModules(courseDataCache.modules);
      }
    } catch (e) {
      console.error(e);
    }
    window.scrollTo(0, 0);
  };

  /* ---------- 3. LESSON READER ---------- */

  var originalOpenLesson = window.openLesson;

  window.openLesson = function (lessonId) {
    originalOpenLesson(lessonId);

    try {
      ensureChrome();

      // The old text blocks started with a line break and spaces, which
      // showed up as a big indent and blank gaps. Trim them.
      var nodes = document.querySelectorAll(
        "#lesson-content .content-text, #lesson-content .content-formula"
      );
      Array.prototype.forEach.call(nodes, function (n) {
        n.textContent = n.textContent.trim();
      });

      // The first heading often repeats the lesson title. Drop the duplicate.
      var firstHeading = document.querySelector("#lesson-content .content-block:first-child .content-heading");
      var titleEl = $("lesson-title");
      if (firstHeading && titleEl &&
          firstHeading.textContent.trim().toLowerCase() === titleEl.textContent.trim().toLowerCase()) {
        firstHeading.closest(".content-block").remove();
      }

      setNavHeight();
      renderBar();
      window.scrollTo(0, 0);
      sync();
    } catch (e) {
      console.error(e);
    }
  };

  var readbar = null;
  var bar = null;

  function ensureChrome() {
    if (!readbar) {
      readbar = document.createElement("div");
      readbar.id = "lj-readbar";
      readbar.innerHTML = "<span></span>";
      document.body.appendChild(readbar);
    }
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "lj-actionbar";
      bar.className = "hidden";
      document.body.appendChild(bar);
    }
  }

  function updateReadBar() {
    if (!readbar) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1;
    readbar.firstElementChild.style.transform = "scaleX(" + p + ")";
  }

  // Show the bar and the progress line only while the lesson is on screen.
  function sync() {
    var lv = $("lesson-view");
    var visible = !!(lv && !lv.classList.contains("hidden") && lv.offsetParent !== null);
    if (bar) bar.classList.toggle("hidden", !visible);
    if (readbar) {
      readbar.style.display = visible && LJ.mode === "read" ? "block" : "none";
      if (visible) updateReadBar();
    }
    setNavHeight();
  }

  window.addEventListener("scroll", updateReadBar, { passive: true });
  window.addEventListener("resize", setNavHeight);
  setInterval(sync, 350);

  /* ---------- 4. QUIZ (one question at a time) ---------- */

  window.renderQuiz = function (lesson) {
    var section = $("quiz-section");
    var options = $("quiz-options");
    var result = $("quiz-result");

    result.innerHTML = "";
    options.innerHTML = "";

    currentQuizzes = Array.isArray(lesson.quizzes) ? lesson.quizzes : [];
    selectedQuizAnswers = new Array(currentQuizzes.length);
    quizSubmitted = false;

    LJ.qi = 0;
    LJ.result = null;
    LJ.msg = "";
    LJ.busy = false;
    LJ.chk = [];
    LJ.saved = false;
    LJ.reward = null;
    LJ.rewardPlayed = false;

    section.classList.toggle("hidden", currentQuizzes.length === 0);
    setMode("read");
  };

  function setMode(mode) {
    LJ.mode = mode;
    LJ.msg = "";
    var lv = $("lesson-view");
    if (lv) lv.setAttribute("data-lj-mode", mode);
    if (mode === "quiz") renderStage(true);
    if (mode === "result") renderResult();
    renderBar();
    window.scrollTo(0, 0);
    sync();
  }

  function answered(i) {
    var v = selectedQuizAnswers[i];
    return v !== undefined && v !== null && v !== "";
  }

  var MARK_OK =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var MARK_BAD =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>';

  function renderStage(animate) {
    var box = $("quiz-options");
    var total = currentQuizzes.length;
    var q = currentQuizzes[LJ.qi];
    if (!box || !q) return;

    var type = q.questionType || "multiple-choice";
    var chk = LJ.chk[LJ.qi] || null;
    var body = "";

    if (type === "multiple-choice" || type === "true-false") {
      var opts = Array.isArray(q.options) ? q.options : [];
      body = opts
        .map(function (o, oi) {
          var cls = "lj-answer";
          if (chk) {
            if (oi === Number(chk.correctAnswer)) cls += " is-correct";
            else if (selectedQuizAnswers[LJ.qi] === oi) cls += " is-wrong";
            else cls += " is-dim";
          } else if (selectedQuizAnswers[LJ.qi] === oi) {
            cls += " is-selected";
          }
          var mark = String.fromCharCode(65 + oi);
          if (chk) {
            if (oi === Number(chk.correctAnswer)) mark = MARK_OK;
            else if (selectedQuizAnswers[LJ.qi] === oi) mark = MARK_BAD;
          }
          return (
            '<button type="button" class="' + cls + '" data-oi="' + oi + '"' +
            (chk ? " disabled" : "") + '><span class="lj-ans-key">' + mark +
            '</span><span class="lj-ans-text">' + esc(o) + "</span></button>"
          );
        })
        .join("");
    } else if (type === "calculate") {
      var val = answered(LJ.qi) ? selectedQuizAnswers[LJ.qi] : "";
      body =
        '<input type="number" step="any" inputmode="decimal" class="lj-calc' +
        (chk ? (chk.correct ? " is-correct" : " is-wrong") : "") + '" value="' +
        esc(val) + '" placeholder="' + esc(t("enterYourAnswer", "Enter your answer")) + '"' +
        (chk ? " disabled" : "") + ">" +
        (q.hint && !chk
          ? '<p class="lj-hint">' + esc(t("hint", "Hint")) + ": " + esc(q.hint) + "</p>"
          : "");
    } else {
      body = '<p class="lj-hint">' + esc(t("unsupportedQuestionType", "Unsupported question type")) + "</p>";
    }

    var fb = "";
    if (chk) {
      fb =
        '<div class="lj-fb ' + (chk.correct ? "is-ok" : "is-bad") + '">' +
        '<div class="lj-fb-head">' +
        esc(chk.correct ? t("correctShort", "Correct") : t("incorrectShort", "Not quite")) + "</div>" +
        (type === "calculate" && !chk.correct
          ? '<div class="lj-fb-line">' + esc(t("correctAnswerIs", "Correct answer")) + ": " + esc(chk.correctAnswer) + "</div>"
          : "") +
        (chk.explanation ? '<div class="lj-fb-text">' + esc(chk.explanation) + "</div>" : "") +
        "</div>";
    }

    box.innerHTML =
      '<div class="lj-qcount">' + esc(t("question", "Question")) + " " + (LJ.qi + 1) + " / " + total + "</div>" +
      '<div class="lj-qprog"><span style="width:' + ((LJ.qi / total) * 100).toFixed(1) + '%"></span></div>' +
      '<div class="lj-qtext">' + esc(q.question || t("questionUnavailable", "Question unavailable")) + "</div>" +
      body + fb;

    box.classList.remove("lj-enter");
    if (animate) {
      void box.offsetWidth;
      box.classList.add("lj-enter");
    }

    if (chk) {
      var node = box.querySelector(".lj-fb");
      if (node && node.scrollIntoView) node.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  // Ask the server if the chosen answer is right (instant feedback).
  async function checkCurrent() {
    if (LJ.busy || LJ.chk[LJ.qi]) return;
    var q = currentQuizzes[LJ.qi];
    if (!q || !answered(LJ.qi)) return;

    LJ.busy = true;
    LJ.busyText = t("checking", "Checking...");
    LJ.msg = "";
    renderBar();

    try {
      var ans = q.questionType === "calculate"
        ? Number(selectedQuizAnswers[LJ.qi])
        : selectedQuizAnswers[LJ.qi];

      var res = await fetch("/api/learn/quiz/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Continue-Loading": "false" },
        body: JSON.stringify({ quizId: q._id, answer: ans })
      });
      var data = await res.json();

      if (res.ok && data.status === "success" && data.data) {
        LJ.chk[LJ.qi] = data.data;
        LJ.busy = false;
        try {
          if (navigator.vibrate) navigator.vibrate(data.data.correct ? 15 : [30, 50, 30]);
        } catch (e) { /* ignore */ }
        renderStage();
        renderBar();
        return;
      }

      LJ.msg = data.message || t("unableToValidateQuiz", "Could not check your answer. Try again.");
    } catch (e) {
      console.error("Quiz check error:", e);
      LJ.msg = t("unableToConnect", "No connection. Try again.");
    }

    LJ.busy = false;
    renderBar();
  }

  var ICON_X =
    '<svg class="lj-st lj-st-bad" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>';

  function renderResult() {
    var box = $("quiz-options");
    var r = LJ.result || {};
    var pct = Number(r.score || 0);
    var passed = !!r.passed;

    // The server already returns { quizId, correct } for every question.
    var byId = {};
    var list = Array.isArray(r.results) ? r.results : [];
    list.forEach(function (x) { byId[String(x.quizId)] = x.correct === true; });

    var review = "";
    if (list.length) {
      review =
        '<div class="lj-review"><div class="lj-review-title">' +
        esc(t("yourAnswers", "Your answers")) + "</div>" +
        currentQuizzes
          .map(function (q, i) {
            var ok = byId[String(q._id)] === true;
            var type = q.questionType || "multiple-choice";
            var mine = type === "calculate"
              ? selectedQuizAnswers[i]
              : Array.isArray(q.options) ? q.options[selectedQuizAnswers[i]] : "";
            return (
              '<div class="lj-rev ' + (ok ? "is-ok" : "is-bad") + '">' +
              (ok ? ICON_DONE : ICON_X) +
              '<div class="lj-rev-body"><div class="lj-rev-q">' + esc(q.question) + "</div>" +
              '<div class="lj-rev-a">' + esc(t("yourAnswer", "Your answer")) + ": " + esc(mine) + "</div>" +
              (!ok && q.explanation
                ? '<div class="lj-rev-x">' + esc(q.explanation) + "</div>"
                : "") +
              "</div></div>"
            );
          })
          .join("") +
        "</div>";
    }

    // XP and daily goal (only for a passed lesson that was not completed before)
    var reward = "";
    if (passed && !LJ.reward && !isCompleted(currentLessonId)) {
      var d = window.MiimiidDaily && typeof window.MiimiidDaily.getLatest === "function"
        ? window.MiimiidDaily.getLatest()
        : null;
      var mins = lessonMinutes();
      LJ.reward = { goal: 0, from: 0, to: 0 };

      if (d && d.dailyMinutes > 0 && mins > 0) {
        var goal = Number(d.dailyMinutes);
        var today = Number(d.minutesToday) || 0;
        LJ.reward = {
          goal: goal,
          from: Math.min(today, goal),
          to: Math.min(today + mins, goal)
        };
      }
    }

    if (passed && LJ.reward) {
      var rw = LJ.reward;
      var goalHtml = "";

      if (rw.goal > 0) {
        var startPct = LJ.rewardPlayed ? rw.to : rw.from;
        goalHtml =
          '<div class="lj-goal"><div class="lj-goal-row"><span>' + esc(t("dailyGoal", "Daily goal")) + "</span>" +
          '<span class="' + (rw.to >= rw.goal ? "is-met" : "") + '">' +
          esc(rw.to >= rw.goal ? t("goalReached", "Goal reached") : rw.to + " / " + rw.goal + " min") + "</span></div>" +
          '<div class="lj-goal-track"><span class="lj-goal-fill" style="width:' + ((startPct / rw.goal) * 100).toFixed(1) +
          '%" data-to="' + ((rw.to / rw.goal) * 100).toFixed(1) + '"></span></div></div>';
      }

      reward =
        '<div class="lj-reward"><div class="lj-xp"><b>+' + LESSON_XP + ' XP</b><span class="lj-xp-note"></span></div>' +
        goalHtml + "</div>";
    }

    box.innerHTML =
      '<div class="lj-result">' +
      ring(pct, 130, Math.round(pct) + "%", passed ? "lj-ring-good" : "lj-ring-warn") +
      "<h3>" + esc(passed ? t("quizPassed", "Nice work") : t("quizNotPassed", "Not quite yet")) + "</h3>" +
      "<p>" + esc(r.correctAnswers) + " / " + esc(r.totalQuestions) + " " + esc(t("correct", "correct")) + "</p>" +
      "</div>" + reward + review;

    var fill = box.querySelector(".lj-goal-fill");
    if (fill) {
      LJ.rewardPlayed = true;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { fill.style.width = fill.getAttribute("data-to") + "%"; });
      });
    }

    updateXpNote();
  }

  // Small status text next to the XP: Saving / XP earned / Not saved
  function updateXpNote() {
    var note = document.querySelector("#quiz-options .lj-xp-note");
    if (!note) return;
    if (LJ.saved) note.textContent = t("xpEarned", "XP earned");
    else if (LJ.msg && !LJ.saving) note.textContent = t("xpNotSaved", "Not saved yet");
    else note.textContent = t("saving", "Saving...");
    note.classList.toggle("is-ok", LJ.saved);
  }

  // Save the lesson as completed in the background (no screen change).
  async function saveCompletion() {
    if (LJ.saving) return;
    var lessonId = currentLessonId;
    LJ.saving = true;
    LJ.saved = false;
    LJ.msg = "";
    updateXpNote();
    renderBar();

    try {
      var answers = currentQuizzes.map(function (q, idx) {
        return q.questionType === "calculate"
          ? Number(selectedQuizAnswers[idx])
          : selectedQuizAnswers[idx];
      });

      var res = await fetch("/api/learn/lessons/" + lessonId + "/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Continue-Loading": "false" },
        body: JSON.stringify({ submittedAnswers: answers })
      });
      var data = await res.json();

      if (res.ok && data.status === "success") {
        if (courseDataCache) {
          var ids = Array.isArray(courseDataCache.completedLessonIds) ? courseDataCache.completedLessonIds : [];
          if (ids.map(String).indexOf(String(lessonId)) === -1) ids.push(String(lessonId));
          courseDataCache.completedLessonIds = ids;
        }
        if (String(currentLessonId) === String(lessonId)) LJ.saved = true;

        try {
          if (window.MiimiidDaily && typeof window.MiimiidDaily.refresh === "function") window.MiimiidDaily.refresh();
        } catch (e) { /* ignore */ }
        try { if (typeof loadCourseProgress === "function") loadCourseProgress(currentCourseId); } catch (e) { /* ignore */ }
      } else {
        LJ.msg = data.message || t("failedToSaveProgress", "Could not save progress.");
      }
    } catch (e) {
      console.error("Save progress error:", e);
      LJ.msg = t("unableToConnect", "No connection. Try again.");
    }

    LJ.saving = false;
    if (String(currentLessonId) === String(lessonId)) {
      updateXpNote();
      renderBar();
    }
  }

  async function submitAll() {
    if (LJ.busy) return;

    for (var i = 0; i < currentQuizzes.length; i++) {
      if (!answered(i)) {
        LJ.qi = i;
        renderStage();
        renderBar();
        return;
      }
    }

    LJ.busy = true;
    LJ.busyText = t("checking", "Checking...");
    LJ.msg = "";
    renderBar();

    try {
      var answers = currentQuizzes.map(function (q, idx) {
        return q.questionType === "calculate"
          ? Number(selectedQuizAnswers[idx])
          : selectedQuizAnswers[idx];
      });

      var res = await fetch("/api/learn/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Continue-Loading": "false" },
        body: JSON.stringify({ lessonId: currentLessonId, submittedAnswers: answers })
      });
      var data = await res.json();

      if (res.ok && data.status === "success" && data.data) {
        LJ.result = data.data;
        quizSubmitted = !!data.data.passed;
        LJ.busy = false;
        setMode("result");

        // Passed: save the progress right away, so leaving the screen never loses it.
        if (data.data.passed && !isCompleted(currentLessonId)) saveCompletion();
        return;
      }

      LJ.msg = data.message || t("unableToValidateQuiz", "Could not check your answers. Try again.");
    } catch (e) {
      console.error("Quiz submission error:", e);
      LJ.msg = t("unableToConnect", "No connection. Try again.");
    }

    LJ.busy = false;
    renderBar();
  }

  /* ---------- 5. COMPLETE + NEXT LESSON ---------- */

  async function completeAndContinue() {
    if (LJ.busy) return;
    LJ.busy = true;
    LJ.busyText = t("saving", "Saving...");
    LJ.msg = "";
    LJ.goNext = true;
    renderBar();

    try {
      // The original function saves progress, then calls openCourse,
      // which now jumps to the next lesson (see window.openCourse above).
      await completeLesson();
    } catch (e) {
      console.error(e);
    }

    if (LJ.goNext) {
      // openCourse never ran, so saving failed. Show the message.
      LJ.goNext = false;
      LJ.busy = false;
      var old = $("quiz-result");
      LJ.msg = (old && old.textContent.trim()) || t("failedToSaveProgress", "Could not save progress.");
      renderBar();
    }
  }

  /* ---------- BOTTOM ACTION BAR ---------- */

  // "Try it in the Mart": only when this lesson has a Mart scenario (see public/mart-scenario.js).
  function martGhost() {
    try {
      var cur = allLessons().filter(function (l) { return String(l._id) === String(currentLessonId); })[0];
      var m = window.MiimiidMartScenario;
      var sc = m && cur ? m.forLesson(cur.title) : null;
      if (!sc) return null;
      return { act: "mart", label: m.isDone(sc.id) ? t("martDone", "Done in the Mart") : t("tryInMart", "Try it in the Mart") };
    } catch (e) { return null; }
  }

  function renderBar() {
    if (!bar) return;

    var hasQuiz = currentQuizzes.length > 0;
    var completed = isCompleted(currentLessonId);
    var next = nextLesson();
    var lastQ = LJ.qi >= currentQuizzes.length - 1;

    var primary = { act: "", label: "", disabled: false };
    var ghost = null;

    if (LJ.mode === "read") {
      if (completed) {
        primary = next
          ? { act: "next", label: t("nextLesson", "Next lesson") }
          : { act: "course", label: t("backToCourse", "Back to course") };
        if (hasQuiz) ghost = { act: "startquiz", label: t("retakeQuiz", "Retake quiz") };
      } else if (hasQuiz) {
        primary = { act: "startquiz", label: t("takeQuiz", "Take the quiz") };
      } else {
        primary = { act: "complete", label: next ? t("nextLesson", "Next lesson") : t("finishLesson", "Finish lesson") };
      }
    } else if (LJ.mode === "quiz") {
      var checked = !!LJ.chk[LJ.qi];
      if (!checked) {
        primary = { act: "check", label: t("check", "Check"), disabled: !answered(LJ.qi) };
        if (LJ.qi === 0) ghost = { act: "read", label: t("reviewLesson", "Review lesson") };
      } else {
        primary = {
          act: lastQ ? "submit" : "qnext",
          label: lastQ ? t("seeResults", "See results") : t("continue", "Continue")
        };
      }
    } else {
      var passed = !!(LJ.result && LJ.result.passed);
      if (passed) {
        ghost = martGhost();
        if (completed) {
          primary = next
            ? { act: "next", label: t("nextLesson", "Next lesson") }
            : { act: "course", label: t("backToCourse", "Back to course") };
        } else {
          primary = { act: "complete", label: next ? t("nextLesson", "Next lesson") : t("finishLesson", "Finish lesson") };
        }
      } else {
        primary = { act: "startquiz", label: t("tryAgain", "Try again") };
        ghost = { act: "read", label: t("reviewLesson", "Review lesson") };
      }
    }

    if (LJ.busy) {
      primary.disabled = true;
      primary.label = LJ.busyText || t("saving", "Saving...");
    } else if (LJ.mode === "result" && LJ.saving) {
      primary.disabled = true;
      primary.label = t("saving", "Saving...");
    }

    bar.innerHTML =
      (LJ.msg ? '<p class="lj-msg">' + esc(LJ.msg) + "</p>" : "") +
      '<div class="lj-bar-row">' +
      (ghost
        ? '<button type="button" class="lj-btn lj-btn-ghost" data-lj-act="' + ghost.act + '"' +
          (LJ.busy ? " disabled" : "") + ">" + esc(ghost.label) + "</button>"
        : "") +
      '<button type="button" class="lj-btn lj-btn-primary" data-lj-act="' + primary.act + '"' +
      (primary.disabled ? " disabled" : "") + ">" + esc(primary.label) + "</button></div>";
  }

  /* ---------- EVENTS ---------- */

  document.addEventListener("click", function (e) {
    var el = e.target;
    if (!el || !el.closest) return;

    var ans = el.closest(".lj-answer");
    if (ans) {
      if (LJ.chk[LJ.qi]) return;
      selectedQuizAnswers[LJ.qi] = Number(ans.getAttribute("data-oi"));
      renderStage();
      renderBar();
      return;
    }

    var btn = el.closest("[data-lj-act]");
    if (!btn || btn.disabled) return;

    switch (btn.getAttribute("data-lj-act")) {
      case "startquiz":
        LJ.qi = 0;
        selectedQuizAnswers = new Array(currentQuizzes.length);
        LJ.chk = [];
        LJ.saved = false;
        LJ.reward = null;
        LJ.rewardPlayed = false;
        quizSubmitted = false;
        $("quiz-result").innerHTML = "";
        setMode("quiz");
        break;
      case "read":
        setMode("read");
        break;
      case "check":
        checkCurrent();
        break;
      case "qnext":
        if (LJ.qi < currentQuizzes.length - 1) {
          LJ.qi++;
          renderStage(true);
          renderBar();
          window.scrollTo(0, 0);
        }
        break;
      case "qprev":
        if (LJ.qi > 0) {
          LJ.qi--;
          renderStage(true);
          renderBar();
          window.scrollTo(0, 0);
        }
        break;
      case "submit":
        submitAll();
        break;
      case "complete":
        completeAndContinue();
        break;
      case "next":
        var n = nextLesson();
        if (n) openLesson(n._id);
        break;
      case "mart":
        try {
          var curLesson = allLessons().filter(function (l) { return String(l._id) === String(currentLessonId); })[0];
          var scn = window.MiimiidMartScenario && curLesson ? window.MiimiidMartScenario.forLesson(curLesson.title) : null;
          if (scn) window.MiimiidMartScenario.start(scn.id);
        } catch (err) { console.error(err); }
        break;
      case "course":
        backToModules();
        break;
    }
  });

  document.addEventListener("input", function (e) {
    var el = e.target;
    if (el && el.classList && el.classList.contains("lj-calc")) {
      selectedQuizAnswers[LJ.qi] = el.value;
      renderBar();
    }
  });
})();
