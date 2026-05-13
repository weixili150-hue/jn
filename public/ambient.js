/* ═══════════════════════════════════════════
   Ambient Sound Engine — Web Audio API
   Three procedural soundscapes, one per world.
   ═══════════════════════════════════════════ */

(function () {
  let ctx = null;
  let masterGain = null;
  let activeTheme = null;
  let nodes = []; /* all active oscillator/gain/buffer nodes */
  let stopped = false;

  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.08; /* very subtle, ~8% */
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function stopAll() {
    for (const n of nodes) {
      try { n.stop(); } catch (_) {}
      try { n.disconnect(); } catch (_) {}
    }
    nodes = [];
    activeTheme = null;
  }

  function createOsc(type, freq, gain) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = gain;
    o.connect(g);
    g.connect(masterGain);
    o.start();
    nodes.push(o, g);
    return { osc: o, gain: g };
  }

  function createNoise(duration, gainVal, filterType, filterFreq) {
    const bufferSize = ctx.sampleRate * (duration || 2);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType || 'lowpass';
    filter.frequency.value = filterFreq || 300;

    const gain = ctx.createGain();
    gain.gain.value = gainVal || 0.02;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    src.start();

    nodes.push(src, filter, gain);
    return { src, filter, gain };
  }

  /* ═══ Mystic Void — cosmic drone, deep hum ═══ */

  function startMysticVoid() {
    /* fundamental drone ~55Hz (low A), rich in harmonics */
    const d1 = createOsc('sine', 55, 0.15);
    const d2 = createOsc('sine', 82.5, 0.06); /* fifth harmonic */
    const d3 = createOsc('triangle', 27.5, 0.08); /* sub octave */

    /* slow LFO modulating drone pitch — cosmic breathing */
    const lfo1 = ctx.createOscillator();
    lfo1.type = 'sine';
    lfo1.frequency.value = 0.07; /* ~14 second cycle */
    const lfoGain1 = ctx.createGain();
    lfoGain1.gain.value = 2;
    lfo1.connect(lfoGain1);
    lfoGain1.connect(d1.osc.frequency);
    lfoGain1.connect(d2.osc.frequency);
    lfo1.start();
    nodes.push(lfo1, lfoGain1);

    /* amplitude LFO — very slow swell */
    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 0.04; /* ~25 second cycle */
    const lfoGain2 = ctx.createGain();
    lfoGain2.gain.value = 0.04;
    lfo2.connect(lfoGain2);
    lfoGain2.connect(d1.gain.gain);
    lfo2.start();
    nodes.push(lfo2, lfoGain2);

    /* subtle noise bed — cosmic background radiation */
    createNoise(4, 0.015, 'lowpass', 200);

    /* occasional shimmer — very high freq, barely audible */
    const shimmer = createOsc('sine', 12000, 0.005);
    const lfo3 = ctx.createOscillator();
    lfo3.type = 'sine';
    lfo3.frequency.value = 0.03;
    const lfoGain3 = ctx.createGain();
    lfoGain3.gain.value = 0.003;
    lfo3.connect(lfoGain3);
    lfoGain3.connect(shimmer.gain.gain);
    lfo3.start();
    nodes.push(lfo3, lfoGain3);
  }

  /* ═══ Neon Entropy — data crackle, high electronic hum ═══ */

  function startNeonEntropy() {
    /* high frequency carrier ~440Hz + detune */
    const d1 = createOsc('sawtooth', 220, 0.025);
    const d2 = createOsc('square', 880, 0.008);

    /* glitch LFO — fast, irregular modulation */
    const lfo1 = ctx.createOscillator();
    lfo1.type = 'square';
    lfo1.frequency.value = 4;
    const lfoGain1 = ctx.createGain();
    lfoGain1.gain.value = 30;
    lfo1.connect(lfoGain1);
    lfoGain1.connect(d1.osc.frequency);
    lfoGain1.connect(d2.osc.frequency);
    lfo1.start();
    nodes.push(lfo1, lfoGain1);

    /* data-like noise — high-pass filtered for crispness */
    createNoise(1, 0.02, 'highpass', 2000);

    /* occasional low pulse — like a machine heartbeat */
    const pulse = createOsc('sine', 30, 0);
    const pulseLFO = ctx.createOscillator();
    pulseLFO.type = 'square';
    pulseLFO.frequency.value = 0.8;
    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0.03;
    pulseLFO.connect(pulseGain);
    pulseGain.connect(pulse.gain.gain);
    pulseLFO.start();
    nodes.push(pulseLFO, pulseGain);
  }

  /* ═══ Silent Signal — filtered wind, near-silence ═══ */

  function startSilentSignal() {
    /* brown-ish noise — very low, filtered, like distant wind */
    createNoise(3, 0.04, 'lowpass', 150);

    /* very slow LFO on noise filter — wind swell */
    const noise2 = createNoise(2, 0.02, 'lowpass', 300);
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 50;
    lfo.connect(lfoGain);
    lfoGain.connect(noise2.filter.frequency);
    lfo.start();
    nodes.push(lfo, lfoGain);

    /* occasional gentle chime — pentatonic, every 18-22 seconds */
    function scheduleChime() {
      if (activeTheme !== 'silent-signal' || stopped) return;
      const freq = [261.6, 293.7, 329.6, 392, 440][Math.floor(Math.random() * 5)]; /* C, D, E, G, A pentatonic */
      const tone = ctx.createOscillator();
      tone.type = 'sine';
      tone.frequency.value = freq;
      const toneGain = ctx.createGain();
      toneGain.gain.setValueAtTime(0, ctx.currentTime);
      toneGain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.1);
      toneGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
      tone.connect(toneGain);
      toneGain.connect(masterGain);
      tone.start();
      tone.stop(ctx.currentTime + 3);
      nodes.push(tone, toneGain);

      const delay = 18000 + Math.random() * 4000;
      setTimeout(scheduleChime, delay);
    }
    scheduleChime();
  }

  /* ═══ Public API ═══ */

  window.Ambient = {
    setTheme: function (theme) {
      if (theme === activeTheme) return;
      if (stopped) return;
      ensureCtx();
      stopAll();
      activeTheme = theme;
      if (theme === 'mystic-void') startMysticVoid();
      else if (theme === 'neon-entropy') startNeonEntropy();
      else if (theme === 'silent-signal') startSilentSignal();
    },

    start: function () {
      stopped = false;
      ensureCtx();
      if (activeTheme) {
        stopAll();
        const t = activeTheme;
        activeTheme = null;
        this.setTheme(t);
      }
    },

    stop: function () {
      stopped = true;
      stopAll();
    },

    toggle: function () {
      if (stopped) this.start();
      else this.stop();
    },

    setVolume: function (v) {
      if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v));
    },
  };

  /* auto-init on first user touch (browser autoplay policy) */
  function onFirstTouch() {
    ensureCtx();
    document.removeEventListener('click', onFirstTouch);
    document.removeEventListener('touchstart', onFirstTouch);
    document.removeEventListener('keydown', onFirstTouch);
  }
  document.addEventListener('click', onFirstTouch, { once: true });
  document.addEventListener('touchstart', onFirstTouch, { once: true });
  document.addEventListener('keydown', onFirstTouch, { once: true });
})();
