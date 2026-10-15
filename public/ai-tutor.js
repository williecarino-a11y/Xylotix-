/* =========================================
   MIIMIID AI TUTOR - FRONTEND
   File: public/ai-tutor.js

   index.html only needs:
     <section id="miimiid-ai-tutor-view" class="miimiid-ai-tutor-view hidden"></section>
   Everything inside that section is built here.

   Public functions used by index.html:
     initializeMiimiidAITutor()
     setMiimiidAITutorLessonContext(context)

   This file also hides the tutor automatically whenever the app
   navigates to any other view (it wraps miimiidNavigate).
   ========================================= */

(function () {
  "use strict";

  const VIEW_ID = "miimiid-ai-tutor-view";
  const STORE_PREFIX = "miimiidAITutor:";
  const MAX_CHATS = 30;
  const MAX_MESSAGES_PER_CHAT = 100;
  const MAX_ATTACHMENTS = 5;
  const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

  const DEFAULT_SETTINGS = { starters: true, textSize: "normal" };

  let store = { chats: [], settings: Object.assign({}, DEFAULT_SETTINGS) };
  let activeStoreKey = null;
  let currentChat = null;      // { id, title, createdAt, updatedAt, messages: [] }
  let lessonContext = null;
  let pending = [];            // attachments waiting to be sent
  let attachmentCounter = 0;
  let listenersReady = false;
  let navGuardInstalled = false;
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

  function formatTime(value) {
    return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function formatDay(value) {
    return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function newId() {
    return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  /* ---------- saved chats + settings (kept on this device) ---------- */

  function storeKey() {
    let id = "guest";
    try {
      if (typeof miimiidCurrentUser !== "undefined" && miimiidCurrentUser) {
        id = miimiidCurrentUser.id || miimiidCurrentUser.email || miimiidCurrentUser.name || "guest";
      }
    } catch (_) {}
    return STORE_PREFIX + id;
  }

  function loadStore() {
    try {
      const raw = window.localStorage.getItem(storeKey());
      const data = raw ? JSON.parse(raw) : null;
      if (data && Array.isArray(data.chats)) {
        return {
          chats: data.chats,
          settings: Object.assign({}, DEFAULT_SETTINGS, data.settings || {})
        };
      }
    } catch (_) {}
    return { chats: [], settings: Object.assign({}, DEFAULT_SETTINGS) };
  }

  function saveStore() {
    try {
      window.localStorage.setItem(storeKey(), JSON.stringify(store));
    } catch (_) {}
  }

  function persistCurrentChat() {
    if (!currentChat || currentChat.messages.length === 0) return;

    if (currentChat.messages.length > MAX_MESSAGES_PER_CHAT) {
      currentChat.messages = currentChat.messages.slice(-MAX_MESSAGES_PER_CHAT);
    }

    const index = store.chats.findIndex(chat => chat.id === currentChat.id);
    if (index === -1) {
      store.chats.unshift(currentChat);
    } else {
      store.chats[index] = currentChat;
    }

    store.chats.sort((a, b) => b.updatedAt - a.updatedAt);
    store.chats = store.chats.slice(0, MAX_CHATS);
    saveStore();
  }

  /* ---------- markup ---------- */

  const ICON_BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_DOTS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>';
  const ICON_PLUS = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const ICON_SEND = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 20l18-8L3 4v7l13 1-13 1v7z" fill="currentColor"/></svg>';

  function buildMarkup() {
    const view = byId(VIEW_ID);
    if (!view || view.dataset.built === "1") return view;

    view.innerHTML = `
      <div class="miimiid-ai-tutor-appbar">
        <button type="button" id="ai-tutor-back-btn" class="ai-tutor-icon-btn" aria-label="Back">${ICON_BACK}</button>
        <h1 id="ai-tutor-title">AI Tutor</h1>
        <button type="button" id="ai-tutor-menu-btn" class="ai-tutor-icon-btn" aria-label="Menu" aria-haspopup="menu">${ICON_DOTS}</button>
      </div>

      <div id="ai-tutor-menu" class="miimiid-ai-tutor-popover ai-tutor-menu hidden" role="menu">
        <button type="button" role="menuitem" data-action="new">＋&nbsp; <span data-label="newChat">New chat</span></button>
        <button type="button" role="menuitem" data-action="history">🕘&nbsp; <span data-label="history">History</span></button>
        <button type="button" role="menuitem" data-action="settings">⚙️&nbsp; <span data-label="settings">Settings</span></button>
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
        <div id="ai-tutor-attach-menu" class="miimiid-ai-tutor-popover ai-tutor-attach-menu hidden" role="menu">
          <button type="button" role="menuitem" data-attach="camera">📷&nbsp; <span data-label="camera">Take a photo</span></button>
          <button type="button" role="menuitem" data-attach="photos">🖼️&nbsp; <span data-label="photos">Photos</span></button>
          <button type="button" role="menuitem" data-attach="files">📎&nbsp; <span data-label="files">Files</span></button>
        </div>

        <div id="ai-tutor-tray" class="miimiid-ai-tutor-tray hidden" aria-label="Attachments"></div>

        <div class="miimiid-ai-tutor-composer">
          <button type="button" id="ai-tutor-attach-btn" class="ai-tutor-icon-btn ai-tutor-attach-btn" aria-label="Attach" aria-haspopup="menu">${ICON_PLUS}</button>
          <textarea id="ai-tutor-input" class="miimiid-ai-tutor-input" rows="1" maxlength="4000"
            placeholder="Type your question..." aria-label="Ask Miimiid AI Tutor"></textarea>
          <button type="submit" id="ai-tutor-send-btn" class="miimiid-ai-tutor-send" aria-label="Send">${ICON_SEND}</button>
        </div>

        <input type="file" id="ai-tutor-file-camera" accept="image/*" capture="environment" hidden>
        <input type="file" id="ai-tutor-file-photos" accept="image/*" multiple hidden>
        <input type="file" id="ai-tutor-file-files" accept=".pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx" multiple hidden>
      </form>

      <div id="ai-tutor-panel" class="miimiid-ai-tutor-panel hidden" role="dialog" aria-modal="true">
        <div class="miimiid-ai-tutor-appbar">
          <button type="button" id="ai-tutor-panel-back" class="ai-tutor-icon-btn" aria-label="Back">${ICON_BACK}</button>
          <h1 id="ai-tutor-panel-title"></h1>
          <span class="ai-tutor-icon-btn" aria-hidden="true"></span>
        </div>
        <div id="ai-tutor-panel-body" class="miimiid-ai-tutor-panel-body"></div>
      </div>
    `;

    view.dataset.built = "1";
    return view;
  }

  function applyLabels() {
    const labels = {
      newChat: ["aiTutorNewChat", "New chat"],
      history: ["aiTutorHistory", "History"],
      settings: ["aiTutorSettings", "Settings"],
      camera: ["aiTutorCamera", "Take a photo"],
      photos: ["aiTutorPhotos", "Photos"],
      files: ["aiTutorFiles", "Files"]
    };

    document.querySelectorAll(`#${VIEW_ID} [data-label]`).forEach(el => {
      const entry = labels[el.dataset.label];
      if (entry) el.textContent = t(entry[0], entry[1]);
    });
  }

  /* ---------- layout (keeps the chat exactly between the top and the bottom nav) ---------- */

  function layout() {
    const view = byId(VIEW_ID);
    if (!view || view.classList.contains("hidden")) return;

    const vv = window.visualViewport;
    const top = vv ? vv.offsetTop : 0;
    const keyboardOpen = !!vv && window.innerHeight - vv.height > 150;

    let bottomEdge;
    if (keyboardOpen) {
      // Keyboard is up: sit right on top of it
      bottomEdge = vv.offsetTop + vv.height;
    } else {
      // Normal: stop exactly where the bottom navigation starts
      const nav = document.querySelector(".miimiid-bottom-nav");
      const rect = nav ? nav.getBoundingClientRect() : null;
      bottomEdge = rect && rect.height > 0 ? rect.top : window.innerHeight - 64;
    }

    view.style.top = Math.floor(top) + "px";
    view.style.height = Math.max(Math.floor(bottomEdge - top), 220) + "px";
  }

  function scrollToBottom() {
    const scroll = byId("ai-tutor-scroll");
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }

  /* ---------- hide the tutor whenever the app goes anywhere else ---------- */

  function hideTutor() {
    const view = byId(VIEW_ID);
    if (!view) return;
    view.classList.add("hidden");
    closePopovers();
    closePanel();
  }

  function installNavigationGuard() {
    if (navGuardInstalled) return;
    if (typeof window.miimiidNavigate !== "function") return;

    const original = window.miimiidNavigate;
    window.miimiidNavigate = function (view) {
      if (view !== "aiTutor") hideTutor();
      return original.apply(this, arguments);
    };

    navGuardInstalled = true;
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
    if (!store.settings.starters) return;
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

  /* ---------- greeting / title / settings look ---------- */

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

  function applySettingsLook() {
    const view = byId(VIEW_ID);
    if (!view) return;
    view.classList.remove("ait-text-small", "ait-text-large");
    if (store.settings.textSize === "small") view.classList.add("ait-text-small");
    if (store.settings.textSize === "large") view.classList.add("ait-text-large");
  }

  /* ---------- messages ---------- */

  function buildAttachmentChips(attachments) {
    const wrap = document.createElement("div");
    wrap.className = "miimiid-ai-tutor-msg-attachments";

    attachments.forEach(item => {
      const chip = document.createElement("div");
      chip.className = "miimiid-ai-tutor-msg-chip";

      if (item.url && String(item.type || "").startsWith("image/")) {
        const img = document.createElement("img");
        img.src = item.url;
        img.alt = item.name || "Photo";
        chip.appendChild(img);
      } else {
        chip.textContent = "📎 " + (item.name || "File");
      }

      wrap.appendChild(chip);
    });

    return wrap;
  }

  function addMessage(role, content, options) {
    const messages = byId("ai-tutor-messages");
    if (!messages) return;

    const opts = options || {};
    const time = opts.time || Date.now();

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

    if (Array.isArray(opts.attachments) && opts.attachments.length) {
      bubble.appendChild(buildAttachmentChips(opts.attachments));
    }

    wrap.appendChild(bubble);

    const stamp = document.createElement("div");
    stamp.className = `miimiid-ai-tutor-timestamp ${role}`;
    stamp.textContent = formatTime(time);
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

  function clearConversationView() {
    const messages = byId("ai-tutor-messages");
    const status = byId("ai-tutor-status");
    const view = byId(VIEW_ID);
    if (messages) messages.innerHTML = "";
    if (status) status.textContent = "";
    if (view) view.classList.remove("has-chat");
    clearPending();
  }

  function newChat() {
    currentChat = null;
    clearConversationView();
    renderWelcome();
    closePopovers();
    closePanel();
    const scroll = byId("ai-tutor-scroll");
    if (scroll) scroll.scrollTop = 0;
  }

  function openSavedChat(chatId) {
    const chat = store.chats.find(item => item.id === chatId);
    if (!chat) return;

    currentChat = chat;
    clearConversationView();

    chat.messages.forEach(message => {
      addMessage(message.role, message.content, {
        time: message.time,
        attachments: message.attachments
      });
    });

    closePanel();
    scrollToBottom();
  }

  /* ---------- attachments (UI only for now: files are not sent to the AI yet) ---------- */

  function clearPending() {
    pending.forEach(item => {
      if (item.url) URL.revokeObjectURL(item.url);
    });
    pending = [];
    renderTray();
  }

  function renderTray() {
    const tray = byId("ai-tutor-tray");
    if (!tray) return;

    tray.innerHTML = "";

    if (pending.length === 0) {
      tray.classList.add("hidden");
      layoutSoon();
      return;
    }

    pending.forEach(item => {
      const chip = document.createElement("div");
      chip.className = "miimiid-ai-tutor-tray-chip";

      if (item.url) {
        const img = document.createElement("img");
        img.src = item.url;
        img.alt = "";
        chip.appendChild(img);
      } else {
        const icon = document.createElement("span");
        icon.className = "miimiid-ai-tutor-tray-icon";
        icon.textContent = "📄";
        chip.appendChild(icon);
      }

      const info = document.createElement("div");
      info.className = "miimiid-ai-tutor-tray-info";
      const name = document.createElement("span");
      name.className = "miimiid-ai-tutor-tray-name";
      name.textContent = item.name;
      const size = document.createElement("span");
      size.className = "miimiid-ai-tutor-tray-size";
      size.textContent = formatSize(item.size);
      info.appendChild(name);
      info.appendChild(size);
      chip.appendChild(info);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "miimiid-ai-tutor-tray-remove";
      remove.setAttribute("aria-label", "Remove attachment");
      remove.textContent = "✕";
      remove.addEventListener("click", () => {
        if (item.url) URL.revokeObjectURL(item.url);
        pending = pending.filter(p => p.id !== item.id);
        renderTray();
      });
      chip.appendChild(remove);

      tray.appendChild(chip);
    });

    tray.classList.remove("hidden");
    layoutSoon();
  }

  function handleFiles(fileList) {
    const status = byId("ai-tutor-status");
    const files = Array.from(fileList || []);
    let message = "";

    files.forEach(file => {
      if (pending.length >= MAX_ATTACHMENTS) {
        message = t("aiTutorTooManyFiles", "You can attach up to 5 files.");
        return;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        message = t("aiTutorFileTooBig", "That file is larger than 10 MB.");
        return;
      }

      const isImage = String(file.type).startsWith("image/");
      attachmentCounter += 1;
      pending.push({
        id: attachmentCounter,
        file,
        name: file.name || (isImage ? "Photo" : "File"),
        type: file.type || "",
        size: file.size,
        url: isImage ? URL.createObjectURL(file) : ""
      });
    });

    renderTray();

    if (status) {
      status.textContent = message ||
        t("aiTutorAttachNote", "Attachments are not read by the AI Tutor yet.");
    }
  }

  /* ---------- popovers + panels ---------- */

  function closePopovers() {
    const menu = byId("ai-tutor-menu");
    const attach = byId("ai-tutor-attach-menu");
    if (menu) menu.classList.add("hidden");
    if (attach) attach.classList.add("hidden");
  }

  function togglePopover(id) {
    const target = byId(id);
    if (!target) return;
    const wasHidden = target.classList.contains("hidden");
    closePopovers();
    if (wasHidden) target.classList.remove("hidden");
  }

  function openPanel(kind) {
    const panel = byId("ai-tutor-panel");
    const title = byId("ai-tutor-panel-title");
    const body = byId("ai-tutor-panel-body");
    if (!panel || !title || !body) return;

    closePopovers();
    body.innerHTML = "";

    if (kind === "history") {
      title.textContent = t("aiTutorHistory", "History");
      renderHistory(body);
    } else {
      title.textContent = t("aiTutorSettings", "Settings");
      renderSettings(body);
    }

    panel.classList.remove("hidden");
  }

  function closePanel() {
    const panel = byId("ai-tutor-panel");
    if (panel) panel.classList.add("hidden");
  }

  function renderHistory(body) {
    if (store.chats.length === 0) {
      const empty = document.createElement("p");
      empty.className = "miimiid-ai-tutor-empty";
      empty.textContent = t("aiTutorNoHistory", "No saved chats yet. Your conversations will appear here.");
      body.appendChild(empty);
      return;
    }

    const list = document.createElement("div");
    list.className = "miimiid-ai-tutor-history-list";

    store.chats.forEach(chat => {
      const row = document.createElement("div");
      row.className = "miimiid-ai-tutor-history-row";

      const open = document.createElement("button");
      open.type = "button";
      open.className = "miimiid-ai-tutor-history-open";

      const title = document.createElement("span");
      title.className = "miimiid-ai-tutor-history-title";
      title.textContent = chat.title || "Chat";

      const meta = document.createElement("span");
      meta.className = "miimiid-ai-tutor-history-meta";
      meta.textContent = `${formatDay(chat.updatedAt)} · ${chat.messages.length} ${t("aiTutorMessages", "messages")}`;

      open.appendChild(title);
      open.appendChild(meta);
      open.addEventListener("click", () => openSavedChat(chat.id));

      const del = document.createElement("button");
      del.type = "button";
      del.className = "ai-tutor-icon-btn miimiid-ai-tutor-history-delete";
      del.setAttribute("aria-label", "Delete chat");
      del.textContent = "🗑️";
      del.addEventListener("click", () => {
        store.chats = store.chats.filter(item => item.id !== chat.id);
        if (currentChat && currentChat.id === chat.id) currentChat = null;
        saveStore();
        openPanel("history");
      });

      row.appendChild(open);
      row.appendChild(del);
      list.appendChild(row);
    });

    body.appendChild(list);
  }

  function renderSettings(body) {
    // Suggested questions toggle
    const toggleRow = document.createElement("label");
    toggleRow.className = "miimiid-ai-tutor-setting";

    const toggleText = document.createElement("span");
    toggleText.textContent = t("aiTutorSettingStarters", "Suggested questions in lessons");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!store.settings.starters;
    checkbox.addEventListener("change", () => {
      store.settings.starters = checkbox.checked;
      saveStore();
      renderStarters();
    });

    toggleRow.appendChild(toggleText);
    toggleRow.appendChild(checkbox);
    body.appendChild(toggleRow);

    // Text size
    const sizeRow = document.createElement("div");
    sizeRow.className = "miimiid-ai-tutor-setting column";

    const sizeLabel = document.createElement("span");
    sizeLabel.textContent = t("aiTutorSettingTextSize", "Text size");
    sizeRow.appendChild(sizeLabel);

    const group = document.createElement("div");
    group.className = "miimiid-ai-tutor-segmented";

    [
      ["small", t("aiTutorSizeSmall", "Small")],
      ["normal", t("aiTutorSizeNormal", "Normal")],
      ["large", t("aiTutorSizeLarge", "Large")]
    ].forEach(([value, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      if (store.settings.textSize === value) button.classList.add("active");
      button.addEventListener("click", () => {
        store.settings.textSize = value;
        saveStore();
        applySettingsLook();
        group.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        button.classList.add("active");
      });
      group.appendChild(button);
    });

    sizeRow.appendChild(group);
    body.appendChild(sizeRow);

    // Delete all history
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "miimiid-ai-tutor-danger";
    clear.textContent = t("aiTutorClearHistory", "Delete all chat history");
    clear.addEventListener("click", () => {
      const question = t("aiTutorClearConfirm", "Delete all saved chats on this device?");
      if (!window.confirm(question)) return;
      store.chats = [];
      currentChat = null;
      saveStore();
      clear.textContent = t("aiTutorCleared", "History deleted");
      clear.disabled = true;
    });
    body.appendChild(clear);

    const note = document.createElement("p");
    note.className = "miimiid-ai-tutor-empty";
    note.textContent = t("aiTutorStoredNote", "Chats are saved on this device only.");
    body.appendChild(note);
  }

  /* ---------- input + sending ---------- */

  function autosizeInput() {
    const input = byId("ai-tutor-input");
    if (!input) return;
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  }

  let layoutTimer = null;
  function layoutSoon() {
    if (layoutTimer) clearTimeout(layoutTimer);
    layoutTimer = setTimeout(() => {
      layout();
    }, 0);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (sending) return;

    const input = byId("ai-tutor-input");
    const status = byId("ai-tutor-status");
    const sendButton = byId("ai-tutor-send-btn");
    if (!input) return;

    const typed = input.value.trim();
    const attachments = pending.map(item => ({
      name: item.name,
      type: item.type,
      size: item.size,
      url: item.url
    }));

    if (!typed && attachments.length === 0) {
      if (status) status.textContent = t("aiTutorEmptyMessage", "Type a question first.");
      input.focus();
      return;
    }

    const message = typed || ("📎 " + attachments.map(a => a.name).join(", "));

    sending = true;
    closePopovers();
    addMessage("user", message, { attachments });

    // Previous saved messages + this question
    const previous = currentChat ? currentChat.messages : [];
    const apiHistory = previous
      .slice(-11)
      .map(m => ({ role: m.role, content: m.content }))
      .concat([{ role: "user", content: message }]);

    input.value = "";
    autosizeInput();

    // The attachments now live in the chat bubble, so the tray starts fresh
    pending = [];
    renderTray();

    if (status) status.textContent = t("aiTutorThinking", "Miimiid AI Tutor is thinking...");
    if (sendButton) sendButton.disabled = true;
    scrollToBottom();

    try {
      const ctx = lessonContext || {};

      const response = await fetch("/api/ai-tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Continue-Loading": "false" },
        body: JSON.stringify({
          message,
          history: apiHistory,
          language: currentLanguage(),
          courseTitle: ctx.courseTitle || (typeof currentCourseTitle !== "undefined" ? currentCourseTitle : ""),
          moduleTitle: ctx.moduleTitle || (typeof currentModuleTitle !== "undefined" ? currentModuleTitle : ""),
          lessonTitle: ctx.lessonTitle || (typeof currentLessonTitle !== "undefined" ? currentLessonTitle : ""),
          // Only names/types/sizes for now. Real file upload comes with the AI integration.
          attachments: attachments.map(a => ({ name: a.name, type: a.type, size: a.size }))
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      if (!response.ok) {
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

      // Only answered questions are saved to History
      const now = Date.now();
      if (!currentChat) {
        currentChat = {
          id: newId(),
          title: message.length > 48 ? message.slice(0, 48) + "…" : message,
          createdAt: now,
          updatedAt: now,
          messages: []
        };
      }

      currentChat.messages.push({
        role: "user",
        content: message,
        time: now,
        attachments: attachments.map(a => ({ name: a.name, type: a.type }))
      });
      currentChat.messages.push({ role: "assistant", content: answer, time: Date.now() });
      currentChat.updatedAt = Date.now();
      persistCurrentChat();

      if (status) status.textContent = "";
    } catch (error) {
      console.error("Miimiid AI Tutor frontend error:", error);

      addMessage(
        "assistant",
        t("aiTutorError", "I couldn't connect to Miimiid AI Tutor right now. Please try again later.")
      );
      if (status) status.textContent = t("aiTutorErrorStatus", "Connection unavailable.");
    } finally {
      sending = false;
      if (sendButton) sendButton.disabled = false;
      scrollToBottom();
    }
  }

  /* ---------- init ---------- */

  function setupListeners() {
    if (listenersReady) return;

    const view = byId(VIEW_ID);
    const form = byId("ai-tutor-form");
    const input = byId("ai-tutor-input");
    if (!view || !form || !input) return;

    form.addEventListener("submit", handleSubmit);
    input.addEventListener("input", autosizeInput);

    input.addEventListener("focus", () => {
      closePopovers();
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

    byId("ai-tutor-back-btn").addEventListener("click", () => {
      if (typeof window.miimiidNavigate === "function") {
        window.miimiidNavigate("home");
      } else {
        window.history.back();
      }
    });

    byId("ai-tutor-menu-btn").addEventListener("click", event => {
      event.stopPropagation();
      togglePopover("ai-tutor-menu");
    });

    byId("ai-tutor-menu").addEventListener("click", event => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      closePopovers();
      if (action === "new") newChat();
      if (action === "history") openPanel("history");
      if (action === "settings") openPanel("settings");
    });

    byId("ai-tutor-attach-btn").addEventListener("click", event => {
      event.stopPropagation();
      togglePopover("ai-tutor-attach-menu");
    });

    byId("ai-tutor-attach-menu").addEventListener("click", event => {
      const button = event.target.closest("button[data-attach]");
      if (!button) return;
      closePopovers();
      const picker = byId("ai-tutor-file-" + button.dataset.attach);
      if (picker) picker.click();
    });

    ["camera", "photos", "files"].forEach(kind => {
      const picker = byId("ai-tutor-file-" + kind);
      if (!picker) return;
      picker.addEventListener("change", () => {
        handleFiles(picker.files);
        picker.value = "";
      });
    });

    byId("ai-tutor-panel-back").addEventListener("click", closePanel);

    // Tap anywhere else to close the small menus
    view.addEventListener("click", event => {
      if (!event.target.closest(".miimiid-ai-tutor-popover, #ai-tutor-menu-btn, #ai-tutor-attach-btn")) {
        closePopovers();
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closePopovers();
        closePanel();
      }
    });

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

    // A different person signed in on this device: start clean with their own saved chats
    const key = storeKey();
    if (key !== activeStoreKey) {
      activeStoreKey = key;
      store = loadStore();
      currentChat = null;
      clearConversationView();
    }

    setupListeners();
    installNavigationGuard();
    applyLabels();
    applySettingsLook();
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

    closePopovers();
    closePanel();

    layout();
    // The nav may finish rendering a moment later, so measure once more
    setTimeout(layout, 100);
    setTimeout(layout, 400);
    scrollToBottom();
  }

  // Install the guard as soon as this file loads (miimiidNavigate is defined earlier in index.html)
  installNavigationGuard();

  window.initializeMiimiidAITutor = initializeMiimiidAITutor;
  window.setMiimiidAITutorLessonContext = setLessonContext;
})();
