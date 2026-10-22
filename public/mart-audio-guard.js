/*
 * MIIMIID AUDIO GUARD
 * Game sound must respect boundaries:
 *   - the app is minimised, the screen locks, or you switch to another app  ->  everything goes silent
 *   - you leave the Mart for another section of the app                     ->  everything the Mart was playing goes silent
 *   - you come back to a running Mart                                       ->  its sound picks up again
 * It watches every AudioContext and Audio element on the page, so it works without editing the game files.
 * IMPORTANT: load this file BEFORE the other game scripts in index.html, so it sees every sound they create.
 */
(function () {
  'use strict';
  if (window.__miimiidAudioGuard) return;
  window.__miimiidAudioGuard = true;

  var contexts = [];        // every AudioContext created on the page
  var audios = [];          // every new Audio() created on the page
  var pausedCtx = [];       // contexts this guard suspended (so it only resumes those)
  var pausedAudio = [];     // audio elements this guard paused
  var wasOpen = false;

  function martOpen() {
    try {
      if (document.hidden) return false;
      var h = document.querySelector('.mw-holder');
      return !!(h && h.isConnected && h.getClientRects().length > 0);
    } catch (e) { return false; }
  }

  // ---------- watch every AudioContext that gets created ----------
  function wrapContext(name) {
    var Orig = window[name];
    if (!Orig || Orig.__miimiidWrapped) return;
    var W = function (opts) {
      var c = (opts === undefined) ? new Orig() : new Orig(opts);
      try {
        c.__mart = martOpen() || !!document.querySelector('.mw-holder');   // made while the Mart is on screen = the Mart's sound
        contexts.push(c);
      } catch (e) {}
      return c;
    };
    W.prototype = Orig.prototype;
    W.__miimiidWrapped = true;
    try { window[name] = W; } catch (e) {}
  }
  wrapContext('AudioContext');
  wrapContext('webkitAudioContext');

  // ---------- watch every new Audio() ----------
  (function () {
    var OrigAudio = window.Audio;
    if (!OrigAudio || OrigAudio.__miimiidWrapped) return;
    var A = function (src) {
      var a = (src === undefined) ? new OrigAudio() : new OrigAudio(src);
      audios.push(a);
      return a;
    };
    A.prototype = OrigAudio.prototype;
    A.__miimiidWrapped = true;
    try { window.Audio = A; } catch (e) {}
  })();

  function allMediaElements() {
    var list = audios.slice();
    try {
      var found = document.querySelectorAll('audio, video');
      for (var i = 0; i < found.length; i++) if (list.indexOf(found[i]) < 0) list.push(found[i]);
    } catch (e) {}
    return list;
  }

  // ---------- silence / restore ----------
  function silenceAll() {
    contexts.forEach(function (c) {
      try {
        if (c.state === 'running') {
          if (pausedCtx.indexOf(c) < 0) pausedCtx.push(c);
          var p = c.suspend();
          if (p && p.catch) p.catch(function () {});
        }
      } catch (e) {}
    });
    allMediaElements().forEach(function (a) {
      try {
        if (!a.paused) {
          if (pausedAudio.indexOf(a) < 0) pausedAudio.push(a);
          a.pause();
        }
      } catch (e) {}
    });
  }

  function restoreIfMartOpen() {
    if (!martOpen()) { pausedCtx = []; pausedAudio = []; return; }   // not in the Mart: stay quiet (the games wake their own sound when needed)
    pausedCtx.forEach(function (c) {
      try {
        if (c.state === 'suspended') { var p = c.resume(); if (p && p.catch) p.catch(function () {}); }
      } catch (e) {}
    });
    pausedAudio.forEach(function (a) {
      try { var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    });
    pausedCtx = [];
    pausedAudio = [];
  }

  // ---------- 1. the app goes to the background, the screen locks, or the page is hidden ----------
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) silenceAll();
    else restoreIfMartOpen();
  });
  window.addEventListener('pagehide', silenceAll);
  document.addEventListener('freeze', silenceAll);

  // ---------- 2. you leave the Mart for another section ----------
  setInterval(function () {
    try {
      var open = martOpen();
      if (wasOpen && !open && !document.hidden) {
        silenceAll();                       // just left: everything the Mart was playing stops now
        pausedCtx = []; pausedAudio = [];   // and is not brought back by accident
      }
      if (!open && !document.hidden) {
        // while away, nothing that belongs to the Mart may stay running
        contexts.forEach(function (c) {
          if (c.__mart && c.state === 'running') { try { c.suspend(); } catch (e) {} }
        });
      }
      wasOpen = open;
    } catch (e) {}
  }, 300);
})();
