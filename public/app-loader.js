(function () {
  "use strict";

  if (window.__miimiidLoaderInstalled) return;
  window.__miimiidLoaderInstalled = true;

  /* ---------- Top progress bar ---------- */
  var bar = document.createElement("div");
  bar.id = "miimiid-topbar";
  bar.innerHTML = "<span></span>";
  document.body.appendChild(bar);
  var fill = bar.firstChild;

  var progress = 0;
  var trickle = null;
  var hideTimer = null;
  var resetTimer = null;
  var safetyTimer = null;

  function setProgress(p) {
    progress = p;
    fill.style.width = p + "%";
  }

  function startBar() {
    clearTimeout(hideTimer);
    clearTimeout(resetTimer);
    clearTimeout(safetyTimer);
    if (trickle) return;
    bar.classList.add("on");
    setProgress(8);
    trickle = setInterval(function () {
      setProgress(progress + (90 - progress) * 0.12);
    }, 250);
    safetyTimer = setTimeout(finishBar, 20000);
  }

  function finishBar() {
    clearTimeout(safetyTimer);
    if (trickle) {
      clearInterval(trickle);
      trickle = null;
    }
    setProgress(100);
    hideTimer = setTimeout(function () {
      bar.classList.remove("on");
      resetTimer = setTimeout(function () {
        setProgress(0);
      }, 300);
    }, 280);
  }

  /* ---------- Skeleton cards ---------- */
  function skeletonHtml(count) {
    var card =
      '<div class="mm-skel-card">' +
      '<div class="mm-skel h"></div>' +
      '<div class="mm-skel l"></div>' +
      '<div class="mm-skel l s"></div>' +
      '<div class="mm-skel b"></div>' +
      "</div>";
    return (
      '<div data-mm-skeleton="1">' +
      new Array(count + 1).join(card) +
      "</div>"
    );
  }

  function addSkeleton() {
    ["courses-container", "modules-container"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var view = el.closest("#course-list-view, #course-detail-view");
      if (!view || view.classList.contains("hidden")) return;
      if (el.children.length === 0 && !el.textContent.trim()) {
        el.innerHTML = skeletonHtml(2);
      }
    });
  }

  function clearSkeleton() {
    var nodes = document.querySelectorAll("[data-mm-skeleton]");
    for (var i = 0; i < nodes.length; i++) nodes[i].remove();
  }

  /* ---------- Follow the app's existing #loading element ---------- */
  var loadingEl = document.getElementById("loading");
  if (loadingEl) {
    var wasLoading = !loadingEl.classList.contains("hidden");
    new MutationObserver(function () {
      var isLoading = !loadingEl.classList.contains("hidden");
      if (isLoading === wasLoading) return;
      wasLoading = isLoading;
      if (isLoading) {
        startBar();
        addSkeleton();
      } else {
        finishBar();
        clearSkeleton();
      }
    }).observe(loadingEl, { attributes: true, attributeFilter: ["class"] });
  }

  /* ---------- Scroll to top whenever a Learn view opens ---------- */
  ["course-list-view", "course-detail-view", "lesson-view"].forEach(
    function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var wasHidden = el.classList.contains("hidden");
      new MutationObserver(function () {
        var hidden = el.classList.contains("hidden");
        if (wasHidden && !hidden) window.scrollTo(0, 0);
        wasHidden = hidden;
      }).observe(el, { attributes: true, attributeFilter: ["class"] });
    }
  );
})();
