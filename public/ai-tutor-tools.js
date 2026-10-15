/* =========================================
   MIIMIID AI TUTOR - TOOLS ADD-ON
   File: public/ai-tutor-tools.js

   Load AFTER ai-tutor.js. Needs no edits to ai-tutor.js.
   Adds:
     - layout fixes (last message/timestamp/status never hide under the input bar)
     - arrow send button
     - attach popup with round icons (Camera / Photos / Files)
     - audio recorder (mic button)
     - text to speech (speaker button under each tutor reply)
   ========================================= */

(function () {
  "use strict";

  const VIEW_ID = "miimiid-ai-tutor-view";
  const $ = id => document.getElementById(id);

  function svg(inner, size, width) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="' + (width || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";
  }

  const ICONS = {
    camera: svg('<path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', 22),
    photos: svg('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9.5" r="1.6"/><path d="M4 17l5-5 4 4 3-3 4 4"/>', 22),
    files: svg('<path d="M20 11.5l-7.8 7.8a5 5 0 01-7-7l8.2-8.2a3.3 3.3 0 014.7 4.7l-8.2 8.2a1.7 1.7 0 01-2.4-2.4l7.5-7.5"/>', 22),
    mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21"/>', 22),
    arrow: svg('<path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/>', 22, 2.4),
    speaker: svg('<path d="M4 9.5v5h3.5l5 4v-13l-5 4z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a7.5 7.5 0 010 11"/>', 18),
    speakerStop: svg('<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/>', 18),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 22, 2.4),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>', 22)
  };

  /* ---------- styles (ID-scoped so old leftover CSS can't override them) ---------- */

  function injectStyles() {
    if ($("ai-tutor-tools-style")) return;
    const style = document.createElement("style");
    style.id = "ai-tutor-tools-style";
    style.textContent = `
      #${VIEW_ID} .miimiid-ai-tutor-scroll {
        flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden;
        position: relative; z-index: 0; padding: 16px 14px 32px; box-sizing: border-box;
      }
      #${VIEW_ID} .miimiid-ai-tutor-status { min-height: 20px; margin: 10px 0 0; padding-bottom: 8px; }
      #${VIEW_ID} .miimiid-ai-tutor-form {
        flex: 0 0 auto; position: relative; z-index: 3; background: #0f172a;
        padding: 10px 12px; box-sizing: border-box;
      }
      #${VIEW_ID} .miimiid-ai-tutor-input { background: #151e33; }

      #${VIEW_ID} .miimiid-ai-tutor-send {
        width: 44px; height: 44px; flex: 0 0 44px; padding: 0; border: none; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        background: #1f6feb; color: #fff;
      }

      #${VIEW_ID} .ait-mic {
        width: 44px; height: 44px; flex: 0 0 44px; border-radius: 50%;
        border: 1px solid #2c3652; background: rgba(255, 255, 255, 0.04); color: #9aa4bb;
      }

      #${VIEW_ID} .ai-tutor-attach-menu {
        left: 12px; bottom: calc(100% + 6px); min-width: 210px; padding: 8px; border-radius: 20px;
      }
      #${VIEW_ID} .ait-attach-item { gap: 14px; padding: 8px 10px; }
      #${VIEW_ID} .ait-attach-icon {
        width: 42px; height: 42px; flex: 0 0 42px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        background: #2a3452; color: #e6e9f0;
      }

      #${VIEW_ID} .ait-rec { display: none; flex: 1; align-items: center; gap: 10px; min-height: 44px; }
      #${VIEW_ID} .miimiid-ai-tutor-composer.is-recording > :not(.ait-rec) { display: none !important; }
      #${VIEW_ID} .miimiid-ai-tutor-composer.is-recording .ait-rec { display: flex; }
      #${VIEW_ID} .ait-rec-dot {
        width: 10px; height: 10px; border-radius: 50%; background: #ef4444;
        animation: aitPulse 1s ease-in-out infinite;
      }
      #${VIEW_ID} .ait-rec-time { flex: 1; font-variant-numeric: tabular-nums; color: #e6e9f0; }
      #${VIEW_ID} .ait-rec-btn {
        width: 44px; height: 44px; flex: 0 0 44px; padding: 0; border: none; border-radius: 50%;
        display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff;
      }
      #${VIEW_ID} .ait-rec-cancel { background: #2a3452; }
      #${VIEW_ID} .ait-rec-done { background: #1f6feb; }
      @keyframes aitPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }

      #${VIEW_ID} .miimiid-ai-tutor-timestamp .ait-speak {
        display: inline-flex; align-items: center; justify-content: center;
        width: 28px; height: 28px; margin-left: 6px; padding: 0; vertical-align: middle;
        border: none; border-radius: 50%; background: none; color: #9aa4bb; cursor: pointer;
      }
      #${VIEW_ID} .miimiid-ai-tutor-timestamp .ait-speak.is-speaking { color: #4da3ff; background: rgba(77, 163, 255, 0.15); }
    `;
    document.head.appendChild(style);
  }

  /* ---------- small helpers ---------- */

  function scrollChatToBottom() {
    const sc = $("ai-tutor-scroll");
    if (sc) requestAnimationFrame(() => { sc.scrollTop = sc.scrollHeight; });
  }

  function setStatus(text) {
    const el = $("ai-tutor-status");
    if (!el) return;
    el.textContent = text || "";
    if (text) scrollChatToBottom();
  }

  function currentLang() {
    try {
      if (typeof getSavedLanguage === "function") return getSavedLanguage() || "en";
    } catch (_) {}
    return document.documentElement.lang || "en";
  }

  /* ---------- keep the chat pinned above the input bar ---------- */

  function setupScrollPin() {
    const sc = $("ai-tutor-scroll");
    if (!sc || sc.dataset.pin === "1" || typeof ResizeObserver === "undefined") return;
    sc.dataset.pin = "1";

    let stick = true;
    sc.addEventListener("scroll", () => {
      stick = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 80;
    }, { passive: true });

    const toBottom = () => {
      if (stick) requestAnimationFrame(() => { sc.scrollTop = sc.scrollHeight; });
    };

    [sc, $("ai-tutor-messages"), $("ai-tutor-status")].forEach(el => {
      if (el) new ResizeObserver(toBottom).observe(el);
    });

    // New messages and status lines always scroll into view
    [$("ai-tutor-messages"), $("ai-tutor-status")].forEach(el => {
      if (!el) return;
      new MutationObserver(() => {
        stick = true;
        toBottom();
      }).observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  /* ---------- make the chat end exactly where the bottom nav starts ---------- */

  function findNavTop() {
    const view = $(VIEW_ID);
    let best = null;

    const consider = el => {
      if (!el || (view && view.contains(el))) return;
      const r = el.getBoundingClientRect();
      if (r.height < 40 || r.height > 200) return;
      if (r.width < window.innerWidth * 0.6) return;
      if (r.bottom < window.innerHeight - 4) return;
      if (best === null || r.top < best) best = r.top;
    };

    const known = document.querySelector(".miimiid-bottom-nav");
    if (known) consider(known);

    if (best === null) {
      document.querySelectorAll('nav, footer, [class*="nav"], [class*="bottom"]').forEach(el => {
        if (getComputedStyle(el).position === "fixed") consider(el);
      });
    }

    return best;
  }

  function fixBottom() {
    const view = $(VIEW_ID);
    if (!view || view.classList.contains("hidden")) return;

    const vv = window.visualViewport;
    if (vv && window.innerHeight - vv.height > 150) return; // keyboard open: leave it alone

    const navTop = findNavTop();
    if (navTop === null) return;

    const top = parseFloat(view.style.top) || 0;
    const height = Math.floor(navTop - top);
    if (height > 220) view.style.height = height + "px";
  }

  // ai-tutor.js measures the bottom nav inside layout(); re-run it whenever the tutor appears
  function nudgeLayout() {
    [0, 120, 400, 1000].forEach(ms => {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
        fixBottom();
      }, ms);
    });
  }

  function watchView() {
    const view = $(VIEW_ID);
    if (!view || view.dataset.toolsWatch === "1") return;
    view.dataset.toolsWatch = "1";

    let wasHidden = view.classList.contains("hidden");
    new MutationObserver(() => {
      const hidden = view.classList.contains("hidden");
      if (hidden && !wasHidden) {
        stopSpeaking();
        cancelRecording();
      }
      if (!hidden && wasHidden) nudgeLayout();
      wasHidden = hidden;
    }).observe(view, { attributes: true, attributeFilter: ["class"] });
  }

  /* ---------- arrow send button + attach popup ---------- */

  function upgradeSendButton() {
    const send = $("ai-tutor-send-btn");
    if (send) send.innerHTML = ICONS.arrow;
  }

  function upgradeAttachMenu() {
    const menu = $("ai-tutor-attach-menu");
    if (!menu) return;

    const defaults = { camera: "Take a photo", photos: "Photos", files: "Files" };
    const labels = {};
    menu.querySelectorAll("button[data-attach]").forEach(button => {
      const span = button.querySelector("[data-label]");
      labels[button.dataset.attach] = span && span.textContent.trim() ? span.textContent.trim() : "";
    });

    menu.innerHTML = ["camera", "photos", "files"].map(kind =>
      '<button type="button" role="menuitem" data-attach="' + kind + '" class="ait-attach-item">' +
        '<span class="ait-attach-icon">' + ICONS[kind] + "</span>" +
        '<span data-label="' + kind + '">' + (labels[kind] || defaults[kind]) + "</span>" +
      "</button>"
    ).join("");
  }

  /* ---------- audio recorder ---------- */

  const MAX_RECORD_SECONDS = 300;
  let recorder = null;
  let recStream = null;
  let recChunks = [];
  let recCancelled = false;
  let recStartedAt = 0;
  let recTimer = null;

  function formatClock(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return m + ":" + String(s).padStart(2, "0");
  }

  function setRecordingUI(on) {
    const composer = document.querySelector("#" + VIEW_ID + " .miimiid-ai-tutor-composer");
    if (composer) composer.classList.toggle("is-recording", on);

    const time = $("ai-tutor-rec-time");
    if (time) time.textContent = "0:00";

    clearInterval(recTimer);
    recTimer = null;

    if (on) {
      recTimer = setInterval(() => {
        const seconds = Math.floor((Date.now() - recStartedAt) / 1000);
        if (time) time.textContent = formatClock(seconds);
        if (seconds >= MAX_RECORD_SECONDS) stopRecording();
      }, 250);
    }
  }

  function releaseStream() {
    if (recStream) {
      recStream.getTracks().forEach(track => track.stop());
      recStream = null;
    }
  }

  function attachRecording(file) {
    const picker = $("ai-tutor-file-files");
    if (!picker || typeof DataTransfer === "undefined") return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    picker.files = transfer.files;
    picker.dispatchEvent(new Event("change"));
  }

  async function startRecording() {
    if (recorder) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus("Audio recording isn't supported in this browser.");
      return;
    }

    try {
      recStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const name = error && error.name ? error.name : "";
      if (name === "NotFoundError" || name === "OverconstrainedError") {
        setStatus("No microphone was found on this device.");
      } else if (name === "NotReadableError") {
        setStatus("The microphone is busy. Close other apps that use it and try again.");
      } else if (name === "NotAllowedError" || name === "SecurityError") {
        setStatus("Microphone is blocked (" + name + "). Open Miimiid in Chrome and allow Microphone for this site.");
      } else {
        setStatus("Couldn't start recording (" + (name || "unknown error") + ").");
      }
      return;
    }

    stopSpeaking();
    recChunks = [];
    recCancelled = false;

    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
      .find(type => MediaRecorder.isTypeSupported(type)) || "";

    try {
      recorder = mime ? new MediaRecorder(recStream, { mimeType: mime }) : new MediaRecorder(recStream);
    } catch (_) {
      releaseStream();
      setStatus("Audio recording isn't supported in this browser.");
      return;
    }

    const active = recorder;
    active.ondataavailable = event => {
      if (event.data && event.data.size) recChunks.push(event.data);
    };
    active.onstop = () => {
      releaseStream();
      const type = active.mimeType || "audio/webm";
      const keep = !recCancelled && recChunks.length > 0;
      const chunks = recChunks;
      recorder = null;
      recChunks = [];
      setRecordingUI(false);

      if (keep) {
        const ext = type.indexOf("mp4") !== -1 ? "m4a" : "webm";
        attachRecording(new File(chunks, "voice-note-" + Date.now() + "." + ext, { type }));
      }
    };

    active.start();
    recStartedAt = Date.now();
    setStatus("");
    setRecordingUI(true);
  }

  function stopRecording() {
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  function cancelRecording() {
    if (!recorder) return;
    recCancelled = true;
    if (recorder.state !== "inactive") {
      recorder.stop();
    } else {
      releaseStream();
      recorder = null;
      setRecordingUI(false);
    }
  }

  function addRecorderUI() {
    const composer = document.querySelector("#" + VIEW_ID + " .miimiid-ai-tutor-composer");
    const send = $("ai-tutor-send-btn");
    if (!composer || !send || $("ai-tutor-mic-btn")) return;

    const mic = document.createElement("button");
    mic.type = "button";
    mic.id = "ai-tutor-mic-btn";
    mic.className = "ai-tutor-icon-btn ait-mic";
    mic.setAttribute("aria-label", "Record audio");
    mic.innerHTML = ICONS.mic;
    mic.addEventListener("click", startRecording);
    composer.insertBefore(mic, send);

    const bar = document.createElement("div");
    bar.className = "ait-rec";
    bar.innerHTML =
      '<button type="button" class="ait-rec-btn ait-rec-cancel" aria-label="Cancel recording">' + ICONS.close + "</button>" +
      '<span class="ait-rec-dot"></span>' +
      '<span class="ait-rec-time" id="ai-tutor-rec-time">0:00</span>' +
      '<button type="button" class="ait-rec-btn ait-rec-done" aria-label="Finish recording">' + ICONS.check + "</button>";
    bar.querySelector(".ait-rec-cancel").addEventListener("click", cancelRecording);
    bar.querySelector(".ait-rec-done").addEventListener("click", stopRecording);
    composer.appendChild(bar);
  }

  /* ---------- text to speech ---------- */

  let speakingUtterance = null;
  let speakingButton = null;

  function resetSpeakButton() {
    if (!speakingButton) return;
    speakingButton.classList.remove("is-speaking");
    speakingButton.innerHTML = ICONS.speaker;
    speakingButton.setAttribute("aria-label", "Read aloud");
    speakingButton = null;
  }

  function stopSpeaking() {
    if (!("speechSynthesis" in window)) return;
    speakingUtterance = null;
    window.speechSynthesis.cancel();
    resetSpeakButton();
  }

  function speak(text, button) {
    if (!("speechSynthesis" in window)) return;

    if (speakingButton === button) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLang();
    utterance.rate = 1;

    const finish = () => {
      if (speakingUtterance === utterance) {
        speakingUtterance = null;
        resetSpeakButton();
      }
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    speakingUtterance = utterance;
    speakingButton = button;
    button.classList.add("is-speaking");
    button.innerHTML = ICONS.speakerStop;
    button.setAttribute("aria-label", "Stop reading");
    window.speechSynthesis.speak(utterance);
  }

  function decorateMessages() {
    if (!("speechSynthesis" in window)) return;

    document.querySelectorAll("#ai-tutor-messages .miimiid-ai-tutor-message-row.assistant").forEach(row => {
      const stamp = row.querySelector(".miimiid-ai-tutor-timestamp");
      const bubble = row.querySelector(".miimiid-ai-tutor-message");
      if (!stamp || !bubble || stamp.querySelector(".ait-speak")) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "ait-speak";
      button.setAttribute("aria-label", "Read aloud");
      button.innerHTML = ICONS.speaker;
      button.addEventListener("click", () => speak(bubble.textContent || "", button));
      stamp.appendChild(button);
    });
  }

  function watchMessages() {
    const messages = $("ai-tutor-messages");
    if (!messages || messages.dataset.toolsWatch === "1") return;
    messages.dataset.toolsWatch = "1";

    new MutationObserver(decorateMessages).observe(messages, { childList: true });
    decorateMessages();
  }

  /* ---------- setup ---------- */

  function setup() {
    const form = $("ai-tutor-form");
    if (!form) return;

    injectStyles();

    if (form.dataset.toolsReady !== "1") {
      form.dataset.toolsReady = "1";
      upgradeSendButton();
      upgradeAttachMenu();
      addRecorderUI();
    }

    setupScrollPin();
    watchMessages();
    watchView();

    if (!window.__aitFixBottomHooked) {
      window.__aitFixBottomHooked = true;
      window.addEventListener("resize", () => requestAnimationFrame(fixBottom));
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", () => requestAnimationFrame(fixBottom));
      }
    }
    fixBottom();

    const view = $(VIEW_ID);
    if (view && !view.classList.contains("hidden")) nudgeLayout();
  }

  const originalInit = window.initializeMiimiidAITutor;
  if (typeof originalInit === "function") {
    window.initializeMiimiidAITutor = function () {
      const result = originalInit.apply(this, arguments);
      setup();
      return result;
    };
  }

  injectStyles();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
})();
