(function () {
  'use strict';

  /* =====================================================
     MIIMIID AI TUTOR: reply actions
     Under the latest AI answer: a Copy button and three
     one-tap follow-ups. Chips only appear after a real answer
     (not the welcome message and not an error).
     ===================================================== */

  var CHIPS = [
    { label: 'Explain it simpler', prompt: 'Can you explain that in simpler words?' },
    { label: 'Give me an example', prompt: 'Can you give me a real-life example?' },
    { label: 'Quiz me on this', prompt: 'Quiz me on this with one short question.' }
  ];

  function copyText(text, done) {
    function fallback() {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(area);
      done(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    } else {
      fallback();
    }
  }

  function sendPrompt(prompt) {
    var input = document.getElementById('ai-tutor-input');
    var form = document.getElementById('ai-tutor-form');
    var send = document.getElementById('ai-tutor-send-btn');
    if (!input || !form || (send && send.disabled)) return;

    input.value = prompt;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
    else form.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  function buildBar(bubble) {
    var bar = document.createElement('div');
    bar.className = 'mm-ait-actions';

    var copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'mm-ait-copy';
    copy.textContent = 'Copy';
    copy.addEventListener('click', function () {
      copyText(bubble.innerText || bubble.textContent || '', function (ok) {
        copy.textContent = ok ? 'Copied' : 'Could not copy';
        setTimeout(function () { copy.textContent = 'Copy'; }, 1500);
      });
    });
    bar.appendChild(copy);

    CHIPS.forEach(function (chip) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'mm-ait-chip';
      button.textContent = chip.label;
      button.addEventListener('click', function () { sendPrompt(chip.prompt); });
      bar.appendChild(button);
    });

    return bar;
  }

  function sync() {
    var messages = document.getElementById('ai-tutor-messages');
    var status = document.getElementById('ai-tutor-status');
    if (!messages) return;

    var rows = Array.prototype.filter.call(messages.children, function (el) {
      return el.classList.contains('miimiid-ai-tutor-message-row');
    });
    var last = rows[rows.length - 1];
    var existing = messages.querySelector('.mm-ait-actions');

    if (existing && last && last.contains(existing)) return;
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    if (!last || !last.classList.contains('assistant')) return;
    if (last.classList.contains('mm-typing-row')) return;

    var prev = rows[rows.length - 2];
    if (!prev || !prev.classList.contains('user')) return; // welcome message
    if (status && status.textContent.trim() !== '') return; // error or still thinking

    var wrap = last.querySelector('.miimiid-ai-tutor-bubble-wrap');
    var bubble = last.querySelector('.miimiid-ai-tutor-message');
    if (!wrap || !bubble) return;
    wrap.appendChild(buildBar(bubble));
  }

  function init() {
    var messages = document.getElementById('ai-tutor-messages');
    if (messages) {
      new MutationObserver(sync).observe(messages, { childList: true });
      return;
    }
    // the tutor markup is built later by ai-tutor.js: wait for it
    var view = document.getElementById('miimiid-ai-tutor-view');
    if (!view) return;
    var waiter = new MutationObserver(function () {
      var m = document.getElementById('ai-tutor-messages');
      if (!m) return;
      waiter.disconnect();
      new MutationObserver(sync).observe(m, { childList: true });
    });
    waiter.observe(view, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
