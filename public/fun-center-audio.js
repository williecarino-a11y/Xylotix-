/* Miimiid Mart audio: upgrades the plain SFX object with a mixed signal chain
 * (compressor, reverb, echo), adaptive layered music and nicer sound effects.
 * Tune by ear: the MOODS table (tempo, brightness) and the volume numbers below. */
(function () {
  'use strict';
  window.MiimiidMart = window.MiimiidMart || {};

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  const MOODS = {
    calm:   { bpm: 92,  key: 'major', drums: 0, arp: 1, mel: 0.55, lp: 2800 },
    groove: { bpm: 106, key: 'major', drums: 1, arp: 1, mel: 0.7,  lp: 5200 },
    tense:  { bpm: 128, key: 'minor', drums: 2, arp: 2, mel: 0.35, lp: 4200 }
  };
  const KEYS = {
    major: {
      pads: [[60, 64, 67], [59, 62, 67], [60, 64, 69], [60, 65, 69]],
      bass: [48, 43, 45, 41],
      pent: [72, 74, 76, 79, 81, 84]
    },
    minor: {
      pads: [[57, 60, 64], [57, 60, 65], [55, 60, 64], [55, 59, 62]],
      bass: [45, 41, 48, 43],
      pent: [69, 72, 74, 76, 79, 81]
    }
  };

  function makeImpulse(ctx, sec, decay) {
    const len = Math.floor(ctx.sampleRate * sec);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function buildChain(S) {
    const ctx = S.ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 18;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.2;
    try { S.master.disconnect(); } catch (e) { /* ignore */ }
    S.master.connect(comp);
    comp.connect(ctx.destination);

    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(ctx, 2.4, 2.6);
    const revOut = ctx.createGain();
    revOut.gain.value = 0.55;
    reverb.connect(revOut);
    revOut.connect(S.master);

    const musicBus = ctx.createGain();
    musicBus.gain.value = 0.55;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 2800;
    filt.Q.value = 0.5;
    const musicOut = ctx.createGain();
    musicBus.connect(filt);
    filt.connect(musicOut);
    musicOut.connect(S.master);
    const musicRev = ctx.createGain();
    musicRev.gain.value = 0.4;
    filt.connect(musicRev);
    musicRev.connect(reverb);

    // tempo-synced echo for the plucks
    const arpBus = ctx.createGain();
    arpBus.connect(musicBus);
    const echo = ctx.createDelay(1);
    echo.delayTime.value = 0.33;
    const fb = ctx.createGain();
    fb.gain.value = 0.33;
    const echoOut = ctx.createGain();
    echoOut.gain.value = 0.45;
    const echoLp = ctx.createBiquadFilter();
    echoLp.type = 'lowpass';
    echoLp.frequency.value = 2400;
    arpBus.connect(echo);
    echo.connect(echoLp);
    echoLp.connect(fb);
    fb.connect(echo);
    echoLp.connect(echoOut);
    echoOut.connect(musicBus);

    const sfxBus = ctx.createGain();
    sfxBus.connect(S.master);
    const sfxRev = ctx.createGain();
    sfxRev.gain.value = 0.28;
    sfxBus.connect(sfxRev);
    sfxRev.connect(reverb);

    const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    S.fx = { comp, reverb, musicBus, filt, musicOut, arpBus, echo, sfxBus, noise: nb };
  }

  // One note: oscillator -> envelope -> destination.
  function voice(S, o) {
    const ctx = S.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, o.t);
    if (o.detune) osc.detune.value = o.detune;
    const att = o.att || 0.01;
    g.gain.setValueAtTime(0.0001, o.t);
    g.gain.linearRampToValueAtTime(o.vol, o.t + att);
    if (o.hold) {
      g.gain.setValueAtTime(o.vol, o.t + Math.max(att, o.dur));
      g.gain.exponentialRampToValueAtTime(0.0001, o.t + o.dur + (o.rel || 0.4));
    } else {
      g.gain.exponentialRampToValueAtTime(0.0001, o.t + o.dur);
    }
    osc.connect(g);
    g.connect(o.dest);
    osc.start(o.t);
    osc.stop(o.t + o.dur + (o.hold ? (o.rel || 0.4) : 0) + 0.05);
  }

  function bell(S, f, t, vol, dest) {
    voice(S, { type: 'sine', f, t, dur: 1.2, vol, att: 0.004, dest });
    voice(S, { type: 'sine', f: f * 2.76, t, dur: 0.45, vol: vol * 0.28, att: 0.004, dest });
    voice(S, { type: 'sine', f: f * 5.4, t, dur: 0.18, vol: vol * 0.1, att: 0.003, dest });
  }

  function noiseHit(S, o) {
    const ctx = S.ctx;
    const src = ctx.createBufferSource();
    src.buffer = S.fx.noise;
    const flt = ctx.createBiquadFilter();
    flt.type = o.type || 'bandpass';
    flt.frequency.setValueAtTime(o.f, o.t);
    if (o.to) flt.frequency.exponentialRampToValueAtTime(o.to, o.t + o.dur);
    flt.Q.value = o.q || 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol, o.t);
    g.gain.exponentialRampToValueAtTime(0.0001, o.t + o.dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(o.dest);
    src.start(o.t, Math.random() * 0.4);
    src.stop(o.t + o.dur + 0.02);
  }

  function kick(S, t, vol) {
    const ctx = S.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.11);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    o.connect(g);
    g.connect(S.fx.musicBus);
    o.start(t);
    o.stop(t + 0.26);
  }

  function duck(S, sec, level) {
    if (!S.fx) return;
    const g = S.fx.musicOut.gain;
    const now = S.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(level, now, 0.05);
    g.setTargetAtTime(1, now + sec, 0.4);
  }

  // One sixteenth of the song.
  function playStep(S, t) {
    const st = S.mus;
    const m = MOODS[st.mood];
    const K = KEYS[m.key];
    const fx = S.fx;
    const step = st.step;
    const bi = st.bar % 4;
    const beat = 60 / m.bpm;
    const bar = beat * 4;
    const jitter = () => (Math.random() - 0.5) * 0.008;

    if (step === 0) {
      fx.filt.frequency.setTargetAtTime(m.lp, t, 0.6);
      fx.echo.delayTime.setTargetAtTime(beat * 0.75, t, 0.1);
      K.pads[bi].forEach((n, i) => {
        [-7, 7].forEach(d => voice(S, {
          type: i === 0 ? 'triangle' : 'sine', f: mtof(n), t, dur: bar * 0.92,
          vol: 0.016, att: 0.45, hold: true, rel: 0.7, dest: fx.musicBus, detune: d
        }));
      });
    }

    const bassSteps = m.drums >= 2 ? [0, 6, 8, 14] : m.drums === 1 ? [0, 8, 10] : [0, 8];
    if (bassSteps.includes(step)) {
      const f = mtof(K.bass[bi]);
      voice(S, { type: 'triangle', f, t, dur: beat * 1.4, vol: 0.12, att: 0.012, dest: fx.musicBus });
      voice(S, { type: 'sine', f: f * 2, t, dur: beat * 0.8, vol: 0.03, att: 0.012, dest: fx.musicBus });
    }

    const tones = K.pads[bi].concat([K.pads[bi][0] + 12]);
    const pat = [0, 1, 2, 3, 2, 1, 2, 3];
    const arpOn = m.arp === 2 ? true : step % 2 === 0;
    if (arpOn) {
      const idx = pat[(m.arp === 2 ? step : step / 2) % 8];
      const n = tones[idx] + 12;
      const vel = (step % 4 === 0 ? 1 : 0.7) * (0.9 + Math.random() * 0.2);
      voice(S, { type: 'triangle', f: mtof(n), t: t + jitter(), dur: 0.2, vol: 0.04 * vel, att: 0.004, dest: fx.arpBus });
      voice(S, { type: 'sine', f: mtof(n + 12), t: t + jitter(), dur: 0.1, vol: 0.012 * vel, att: 0.003, dest: fx.arpBus });
    }

    if ([0, 6, 10].includes(step) && Math.random() < m.mel * (step === 0 ? 0.9 : 0.5)) {
      let i = st.melIdx + [-1, 0, 1, 2, -2][Math.floor(Math.random() * 5)];
      i = Math.max(0, Math.min(K.pent.length - 1, i));
      if (i === st.lastMel && Math.random() < 0.6) i = Math.min(K.pent.length - 1, i + 1);
      st.melIdx = i;
      st.lastMel = i;
      bell(S, mtof(K.pent[i]), t + jitter(), 0.05, fx.musicBus);
    }

    if (m.drums >= 1) {
      if (step === 0 || step === 8 || (m.drums >= 2 && step === 10)) kick(S, t, 0.28);
      if (step === 4 || step === 12) {
        noiseHit(S, { t, dur: 0.12, vol: 0.07, type: 'bandpass', f: 1500, q: 0.8, dest: fx.musicBus });
      }
      if (m.drums >= 2 || step % 4 === 2) {
        noiseHit(S, { t, dur: 0.04, vol: m.drums >= 2 ? 0.014 : 0.022, type: 'highpass', f: 7000, q: 0.7, dest: fx.musicBus });
      }
    }
  }

  function schedule(S) {
    const ctx = S.ctx;
    const st = S.mus;
    if (!ctx || !st || !S.fx) return;
    if (ctx.state !== 'running') { st.next = ctx.currentTime + 0.05; return; }
    if (st.next < ctx.currentTime) st.next = ctx.currentTime + 0.05;
    while (st.next < ctx.currentTime + 0.14) {
      playStep(S, st.next);
      st.next += 60 / MOODS[st.mood].bpm / 4;
      st.step++;
      if (st.step >= 16) { st.step = 0; st.bar++; st.mood = st.want; }
    }
  }

  function upgrade(SFX) {
    try {
      const baseInit = SFX.init.bind(SFX);
      SFX.init = function () {
        baseInit();
        if (this.ctx && !this.fx) {
          try { buildChain(this); } catch (e) {
            console.error('audio chain failed:', e);
            this.fx = null;
            try { this.master.connect(this.ctx.destination); } catch (e2) { /* ignore */ }
          }
        }
      };

      SFX.tone = function (f, dur, type, vol, delay) {
        if (!this.ctx || this.ctx.state !== 'running') return;
        const t = this.ctx.currentTime + (delay || 0);
        voice(this, { type: type || 'sine', f, t, dur, vol, att: 0.008, dest: this.fx ? this.fx.sfxBus : this.master });
      };

      SFX.noise = function (dur, vol, freq) {
        if (!this.ctx || this.ctx.state !== 'running' || !this.fx) return;
        noiseHit(this, { t: this.ctx.currentTime, dur, vol, type: 'bandpass', f: freq || 1200, q: 0.9, dest: this.fx.sfxBus });
      };

      SFX.step = function () {
        if (!this.ctx || this.ctx.state !== 'running' || !this.fx) return;
        noiseHit(this, { t: this.ctx.currentTime, dur: 0.06, vol: 0.05, type: 'lowpass', f: 320 + Math.random() * 140, q: 0.7, dest: this.fx.sfxBus });
      };

      SFX.reach = function () {
        if (!this.ctx || this.ctx.state !== 'running' || !this.fx) return;
        noiseHit(this, { t: this.ctx.currentTime, dur: 0.18, vol: 0.05, type: 'bandpass', f: 600, to: 2600, q: 1.1, dest: this.fx.sfxBus });
      };

      SFX.pickup = function () {
        if (!this.ctx || this.ctx.state !== 'running' || !this.fx) return;
        const t = this.ctx.currentTime;
        bell(this, 880, t, 0.09, this.fx.sfxBus);
        bell(this, 1318.5, t + 0.07, 0.09, this.fx.sfxBus);
      };

      SFX.coin = function () {
        if (!this.ctx || this.ctx.state !== 'running' || !this.fx) return;
        const t = this.ctx.currentTime;
        [1046.5, 1318.5, 1568, 2093].forEach((f, i) => bell(this, f, t + i * 0.06, 0.07, this.fx.sfxBus));
        noiseHit(this, { t, dur: 0.18, vol: 0.04, type: 'highpass', f: 6000, q: 0.7, dest: this.fx.sfxBus });
      };

      SFX.stinger = function (kind) {
        if (!this.ctx || this.ctx.state !== 'running' || !this.fx) return;
        const t = this.ctx.currentTime + 0.05;
        const d = this.fx.sfxBus;
        if (kind === 'win') {
          duck(this, 2.2, 0.3);
          [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => bell(this, f, t + i * 0.09, 0.1, d));
          [523.25, 659.25, 783.99].forEach(f => voice(this, { type: 'triangle', f, t: t + 0.5, dur: 1.2, vol: 0.05, att: 0.08, hold: true, rel: 0.8, dest: d }));
        } else if (kind === 'ok') {
          duck(this, 1.2, 0.4);
          bell(this, 783.99, t, 0.1, d);
          bell(this, 1046.5, t + 0.14, 0.1, d);
        } else if (kind === 'bad') {
          duck(this, 2, 0.25);
          [329.63, 277.18, 220].forEach((f, i) => voice(this, { type: 'triangle', f, t: t + i * 0.2, dur: 0.5, vol: 0.11, att: 0.02, dest: d }));
        } else if (kind === 'alert') {
          bell(this, 987.77, t, 0.09, d);
          bell(this, 987.77, t + 0.16, 0.09, d);
        }
      };

      SFX.setMood = function (name) {
        if (!MOODS[name]) return;
        this.wantMood = name;
        if (this.mus) this.mus.want = name;
      };

      SFX.startMusic = function () {
        if (this.timer || !this.ctx || !this.fx) return;
        const start = this.wantMood || 'calm';
        this.mus = { mood: start, want: start, step: 0, bar: 0, next: this.ctx.currentTime + 0.1, melIdx: 2, lastMel: -1 };
        const g = this.fx.musicOut.gain;
        g.cancelScheduledValues(this.ctx.currentTime);
        g.setTargetAtTime(1, this.ctx.currentTime, 0.1);
        this.timer = setInterval(() => schedule(this), 25);
      };

      SFX.stopMusic = function () {
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
        this.mus = null;
        if (this.fx && this.ctx) {
          const g = this.fx.musicOut.gain;
          g.cancelScheduledValues(this.ctx.currentTime);
          g.setTargetAtTime(0, this.ctx.currentTime, 0.15);
        }
      };
    } catch (error) {
      console.error('audio upgrade failed, using the basic sounds:', error);
    }
  }

  window.MiimiidMart.audio = { upgrade };
})();
