/* =========================================
   MIIMIID AI TUTOR - FRONTEND
   File: public/ai-tutor.js

   index.html only needs:
     <section id="miimiid-ai-tutor-view" class="miimiid-ai-tutor-view hidden"></section>
   Everything inside that section is built here.

   Public functions used by index.html:
     initializeMiimiidAITutor()
     setMiimiidAITutorLessonContext(context)
   ========================================= */

(function () {
  "use strict";

  const VIEW_ID = "miimiid-ai-tutor-view";

  let history = [];
  let lessonContext = null;
  let listenersReady = false;
  let sending = false;

  /* ---------- small helpers ---------- */

  function byId(id) {
    return document.getElementById(id);
  }

  function t(key, fallback) {
    try {
      if (typeof miimiidTranslate === "function" && typeof getSavedLanguage === "function") {
        const translated = miimiidTranslate(key, getSavedLanguage());
        if (translated && translated !== key) return translated;
      }
    } catch (_) {}
    return fallback;
  }

  function currentLanguage() {
    try {
      return typeof getSavedLanguage === "function" ? getSavedLanguage() : "en";
    } catch (_) {
      return "en";
    }
  }

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  /* ---------- markup ---------- */

  function buildMarkup() {
    const view = byId(VIEW_ID);
    if (!view || view.dataset.built === "1") return view;

    view.innerHTML = `
      <div class="miimiid-ai-tutor-appbar">
        <button type="button" id="ai-tutor-back-btn" class="ai-tutor-icon-btn" aria-label="Back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <h1 id="ai-tutor-title">AI Tutor</h1>
        <button type="button" id="ai-tutor-menu-btn" class="ai-tutor-icon-btn" aria-label="New chat" title="New chat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>
        </button>
      </div>

      <div class="miimiid-ai-tutor-scroll" id="ai-tutor-scroll">
        <div class="miimiid-ai-tutor-greeting">
          <h2 id="ai-tutor-greeting-name">Hi <span id="ai-tutor-username">there</span>! 👋</h2>
          <p id="ai-tutor-subtitle">Your personal financial learning assistant.</p>
        </div>

        <div id="ai-tutor-context" class="miimiid-ai-tutor-context hidden"></div>
        <div id="ai-tutor-starters" class="miimiid-ai-tutor-starters" aria-label="AI Tutor suggested questions"></div>

        <div class="miimiid-ai-tutor-day-divider"><span>Today</span></div>

        <div id="ai-tutor-messages" class="miimiid-ai-tutor-messages" role="log" aria-live="polite" aria-label="AI Tutor conversation"></div>
        <div id="ai-tutor-status" class="miimiid-ai-tutor-status" aria-live="polite"></div>
      </div>

      <form id="ai-tutor-form" class="miimiid-ai-tutor-form">
        <textarea id="ai-tutor-input" class="miimiid-ai-tutor-input" rows="1" maxlength="4000"
          placeholder="Type your question..." aria-label="Ask Miimiid AI Tutor"></textarea>
        <button type="submit" id="ai-tutor-send-btn" class="miimiid-ai-tutor-send" aria-label="Send">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 20l18-8L3 4v7l13 1-13 1v7z" fill="currentColor"/></svg>
        </button>
      </form>
    `;

    view.dataset.built = "1";
    return view;
  }

  /* ---------- layout (keeps the chat above the nav and the keyboard) ---------- */

  function layout() {
    const view = byId(VIEW_ID);
    if (!view || view.classList.contains("hidden")) return;

    const nav = document.querySelector(".miimiid-bottom-nav");
    const navHeight = nav ? nav.offsetHeight : 64;
    view.style.setProperty("--ait-nav-h", navHeight + "px");

    const vv = window.visualViewport;
    if (!vv) {
      view.style.top = "";
      view.style.height = "";
      return;
    }

    // Keyboard open: the visual viewport becomes much shorter than the window
    const keyboardOpen = window.innerHeight - vv.height > 150;
    const height = keyboardOpen ? vv.height : vv.height - navHeight;

    view.style.top = vv.offsetTop + "px";
    view.style.height = Math.max(height, 220) + "px";
  }

  function scrollToBottom() {
    const scroll = byId("ai-tutor-scroll");
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }

  /* ---------- lesson context ---------- */

  function setLessonContext(context) {
    if (!context || typeof context !== "object") {
      lessonContext = null;
      renderContext();
      return;
    }

    lessonContext = {
      courseId: context.courseId || null,
      courseTitle: context.courseTitle || "",
      moduleTitle: context.moduleTitle || "",
      moduleNumber: Number(context.moduleNumber) || 0,
      lessonId: context.lessonId || null,
      lessonTitle: context.lessonTitle || "",
      lessonDescription: context.lessonDescription || "",
      contentBlocks: Array.isArray(context.contentBlocks) ? context.contentBlocks : [],
      language: context.language || currentLanguage()
    };

    renderContext();
  }

  function renderStarters() {
    const container = byId("ai-tutor-starters");
    if (!container) return;

    container.innerHTML = "";
    if (!lessonContext || !lessonContext.lessonTitle) return;

    const starters = [
      { key: "aiTutorExplain", fallback: "Explain this lesson", prompt: "Explain this lesson to me in simple, practical terms. Use examples I can relate to." },
      { key: "aiTutorExample", fallback: "Give me a real-life example", prompt: "Give me a realistic real-life example that shows how this lesson applies to everyday money decisions." },
      { key: "aiTutorQuiz", fallback: "Test me", prompt: "Test me on this lesson with a short interactive quiz. Ask one question at a time and wait for my answer." },
      { key: "aiTutorRemember", fallback: "What should I remember?", prompt: "What are the most important practical things I should remember from this lesson?" },
      { key: "aiTutorHelp", fallback: "I don't understand this", prompt: "Help me understand this lesson more simply. Break down the difficult parts step by step and avoid unnecessary jargon." }
    ];

    starters.forEach(item => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "miimiid-ai-tutor-starter";
      button.textContent = t(item.key, item.fallback);
      button.addEventListener("click", () => {
        const input = byId("ai-tutor-input");
        if (!input) return;
        input.value = item.prompt;
        autosizeInput();
        input.focus();
      });
      container.appendChild(button);
    });
  }

  function renderContext() {
    const el = byId("ai-tutor-context");
    if (!el) return;

    if (!lessonContext || !lessonContext.lessonTitle) {
      el.textContent = "";
      el.classList.add("hidden");
      renderStarters();
      return;
    }

    const moduleText = lessonContext.moduleTitle
      ? lessonContext.moduleTitle
      : (lessonContext.moduleNumber > 0 ? `Module ${lessonContext.moduleNumber}` : "");

    const prefix = t("aiTutorStudying", "Studying");

    el.textContent = moduleText
      ? `${prefix}: ${moduleText} → ${lessonContext.lessonTitle}`
      : `${prefix}: ${lessonContext.lessonTitle}`;

    el.classList.remove("hidden");
    renderStarters();
  }

  /* ---------- greeting / title ---------- */

  function renderGreeting() {
    const nameEl = byId("ai-tutor-username");
    if (nameEl) {
      let name = "";
      try {
        if (typeof miimiidCurrentUser !== "undefined" && miimiidCurrentUser) {
          name = miimiidCurrentUser.firstName || miimiidCurrentUser.name || "";
        }
      } catch (_) {}
      name = String(name).trim().split(/\s+/)[0];
      nameEl.textContent = name || "there";
    }

    const title = byId("ai-tutor-title");
    if (title) title.textContent = t("aiTutor", "AI Tutor");
  }

  /* ---------- messages ---------- */

  function addMessage(role, content) {
    const messages = byId("ai-tutor-messages");
    if (!messages) return;

    const row = document.createElement("div");
    row.className = `miimiid-ai-tutor-message-row ${role}`;

    if (role === "assistant") {
      const avatar = document.createElement("div");
      avatar.className = "miimiid-ai-tutor-avatar";
      avatar.textContent = "🤖";
      row.appendChild(avatar);
    }

    const wrap = document.createElement("div");
    wrap.className = "miimiid-ai-tutor-bubble-wrap";

    const bubble = document.createElement("div");
    bubble.className = `miimiid-ai-tutor-message ${role}`;
    bubble.textContent = content;
    wrap.appendChild(bubble);

    const stamp = document.createElement("div");
    stamp.className = `miimiid-ai-tutor-timestamp ${role}`;
    stamp.textContent = formatTime(new Date());
    wrap.appendChild(stamp);

    row.appendChild(wrap);
    messages.appendChild(row);

    const view = byId(VIEW_ID);
    if (view) view.classList.add("has-chat");

    scrollToBottom();
  }

  function renderWelcome() {
    addMessage(
      "assistant",
      t(
        "aiTutorWelcome",
        "Hi! I'm Miimiid AI Tutor. Ask me anything about money, saving, spending, investing, or building better financial habits."
      )
    );
  }

  function newChat() {
    history = [];
    const messages = byId("ai-tutor-messages");
    const status = byId("ai-tutor-status");
    const view = byId(VIEW_ID);
    if (messages) messages.innerHTML = "";
    if (status) status.textContent = "";
    if (view) view.classList.remove("has-chat");
    renderWelcome();
  }

  /* ---------- input ---------- */

  function autosizeInput() {
    const input = byId("ai-tutor-input");
    if (!input) return;
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (sending) return;

    const input = byId("ai-tutor-input");
    const status = byId("ai-tutor-status");
    const sendButton = byId("ai-tutor-send-btn");
    if (!input) return;

    const message = input.value.trim();

    if (!message) {
      if (status) status.textContent = t("aiTutorEmptyMessage", "Type a question first.");
      input.focus();
      return;
    }

    sending = true;
    addMessage("user", message);
    history.push({ role: "user", content: message });

    input.value = "";
    autosizeInput();

    if (status) status.textContent = t("aiTutorThinking", "Miimiid AI Tutor is thinking...");
    if (sendButton) sendButton.disabled = true;
    scrollToBottom();

    try {
      const ctx = lessonContext || {};

      const response = await fetch("/api/ai-tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: history.slice(-12),
          language: currentLanguage(),
          courseTitle: ctx.courseTitle || (typeof currentCourseTitle !== "undefined" ? currentCourseTitle : ""),
          moduleTitle: ctx.moduleTitle || (typeof currentModuleTitle !== "undefined" ? currentModuleTitle : ""),
          lessonTitle: ctx.lessonTitle || (typeof currentLessonTitle !== "undefined" ? currentLessonTitle : "")
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      if (!response.ok) {
        // The question was not answered, so don't keep it in the history
        history.pop();

        if (data && data.code === "AI_TUTOR_NOT_CONFIGURED") {
          addMessage(
            "assistant",
            t("aiTutorComingSoon", "Miimiid AI Tutor is being prepared. AI conversations will be available soon.")
          );
          if (status) status.textContent = t("aiTutorComingSoonStatus", "AI Tutor is not connected yet.");
          return;
        }

        throw new Error(data && data.message ? data.message : "Unable to reach Miimiid AI Tutor.");
      }

      const answer = data && typeof data.answer === "string" ? data.answer.trim() : "";
      if (!answer) throw new Error("The AI Tutor returned an empty response.");

      addMessage("assistant", answer);
      history.push({ role: "assistant", content: answer });

      if (status) status.textContent = "";
    } catch (error) {
      console.error("Miimiid AI Tutor frontend error:", error);

      if (history.length && history[history.length - 1].role === "user") {
        history.pop();
      }

      addMessage(
        "assistant",
        t("aiTutorError", "I couldn't connect to Miimiid AI Tutor right now. Please try again later.")
      );
      if (status) status.textContent = t("aiTutorErrorStatus", "Connection unavailable.");
    } finally {
      sending = false;
      if (sendButton) sendButton.disabled = false;
      input.focus();
      scrollToBottom();
    }
  }

  /* ---------- init ---------- */

  function setupListeners() {
    if (listenersReady) return;

    const form = byId("ai-tutor-form");
    const input = byId("ai-tutor-input");
    const backBtn = byId("ai-tutor-back-btn");
    const menuBtn = byId("ai-tutor-menu-btn");
    if (!form || !input) return;

    form.addEventListener("submit", handleSubmit);

    input.addEventListener("input", autosizeInput);

    input.addEventListener("focus", () => {
      setTimeout(() => {
        layout();
        scrollToBottom();
      }, 300);
    });

    // On computers Enter sends (Shift+Enter = new line). On phones Enter stays a new line.
    input.addEventListener("keydown", event => {
      if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
      if (!window.matchMedia("(pointer: fine)").matches) return;
      event.preventDefault();
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    });

    if (backBtn) {
      backBtn.addEventListener("click", () => {
        if (typeof miimiidNavigate === "function") {
          miimiidNavigate("home");
        } else {
          window.history.back();
        }
      });
    }

    if (menuBtn) {
      menuBtn.addEventListener("click", newChat);
    }

    window.addEventListener("resize", layout);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", layout);
      window.visualViewport.addEventListener("scroll", layout);
    }

    listenersReady = true;
  }

  function initializeMiimiidAITutor() {
    const view = buildMarkup();
    if (!view) return;

    setupListeners();
    renderGreeting();

    const input = byId("ai-tutor-input");
    if (input) {
      input.placeholder = t("aiTutorPlaceholder", "Type your question...");
    }

    renderContext();

    const messages = byId("ai-tutor-messages");
    if (messages && messages.children.length === 0) {
      renderWelcome();
    }

    layout();
    // The nav may finish rendering a moment later, so measure once more
    setTimeout(layout, 100);
    scrollToBottom();
  }

  window.initializeMiimiidAITutor = initializeMiimiidAITutor;
  window.setMiimiidAITutorLessonContext = setLessonContext;
})();
      
