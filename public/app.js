/* ═══════════════════════════════════════
   Entropy Observer — Frontend SPA
   Hash router, 6 view states, vanilla JS
   Three worlds: theme-branched interactions,
   timing, and DOM structure
   ═══════════════════════════════════════ */

// ─── Theme Configuration ───
const THEME = {
  timing: {
    splash: { 'mystic-void': 4000, 'neon-entropy': 2500, 'silent-signal': 5000 },
    questionEnter: { 'mystic-void': 800, 'neon-entropy': 300, 'silent-signal': 1500 },
    questionExit: { 'mystic-void': 500, 'neon-entropy': 150, 'silent-signal': 1200 },
    phraseCycle: { 'mystic-void': 3500, 'neon-entropy': 1500, 'silent-signal': 5000 },
    themeTransition: { 'mystic-void': 600, 'neon-entropy': 200, 'silent-signal': 1000 },
    questionNext: { 'mystic-void': 500, 'neon-entropy': 200, 'silent-signal': 800 },
  },
  inputAnimation: {
    'mystic-void': 'voidUnblur',
    'neon-entropy': 'neonGlitchIn',
    'silent-signal': 'zenReveal',
  },
  exitAnimation: {
    'mystic-void': 'voidFadeOut',
    'neon-entropy': 'neonGlitchOut',
    'silent-signal': 'zenFadeOut',
  },
  splashPhrases: {
    'mystic-void': [
      '纠结的时候，不如换个方式找答案。',
      '让世界的偶然，替你做一次决定。',
      '命运并非随机，只是观测的角度不同。',
      '宇宙的熵在流动，你的答案正在生成。',
      '每一个犹豫，都是对可能性的尊重。',
    ],
    'neon-entropy': [
      '系统就绪。现实数据流已接入。',
      '熵值扫描启动。世界偏差即将揭示。',
      '信号已同步。等待不是选项。',
      '数据不会犹豫。让环境替你决策。',
      '初始化完成。按下按钮，接受真相。',
    ],
    'silent-signal': [
      '静下来，答案自然会浮现。',
      '不急着选。看看世界怎么说。',
      '呼吸。然后让一切都慢下来。',
      '你不需要想太多。',
      '轻轻放下纠结。环境会告诉你方向。',
    ],
  },
  loadingPhrases: {
    'mystic-void': [
      '正在同步环境熵...',
      '外部信号聚集中...',
      '世界偏向正在收敛...',
    ],
    'neon-entropy': [
      'SCANNING_ENV...',
      'ENTROPY_CALC...',
      'REALITY_BIAS_DETECTED...',
      'WORLD_CONVERGING...',
    ],
    'silent-signal': [
      '...',
      '......',
      '.........',
    ],
  },
};

// ─── API ───
const API = {
  async post(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },
  getQuestions(theme, optionA, optionB) {
    return this.post('/api/questions', { theme, optionA, optionB });
  },
  decide(theme, optionA, optionB, answers) {
    return this.post('/api/decide', { theme, optionA, optionB, answers });
  },
};

// ─── State ───
const S = {
  theme: 'mystic-void',
  optionA: '',
  optionB: '',
  questions: [],
  answers: {},
  currentQuestion: 0,
  result: null,
};

// ─── Helpers ───
const $ = (sel) => document.querySelector(sel);
const el = (tag, attrs, ...children) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'className') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style') Object.assign(e.style, v);
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else if (c instanceof Node) e.appendChild(c);
  }
  return e;
};

function setTheme(theme) {
  S.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('entropy-theme', theme);
}

// ─── Loading Cleanup ───
let _loadingCleanup = null;

function clearLoadingCleanup() {
  if (_loadingCleanup) {
    _loadingCleanup();
    _loadingCleanup = null;
  }
}

// ─── Router ───
function route() {
  const hash = location.hash.slice(1) || 'splash';
  renderNav();
  switch (hash) {
    case 'splash': renderSplash(); break;
    case 'theme': renderThemeSelect(); break;
    case 'decide': renderDecision(); break;
    case 'sample': renderSample(); break;
    case 'loading': renderLoading(); break;
    case 'result': renderResult(); break;
    default: location.hash = 'splash';
  }
}
window.addEventListener('hashchange', () => {
  clearLoadingCleanup();
  route();
});
window.addEventListener('load', () => {
  const saved = localStorage.getItem('entropy-theme');
  if (saved) setTheme(saved);
  route();
});

// ─── Theme Switcher Dots ───
function renderNav() {
  const existing = $('#theme-switcher');
  if (existing) existing.remove();
  const hash = location.hash.slice(1);
  if (hash === 'splash' || hash === 'loading') return;

  const dots = el('div', { id: 'theme-switcher', className: 'theme-switcher' });
  const themes = ['mystic-void', 'neon-entropy', 'silent-signal'];
  for (const t of themes) {
    dots.appendChild(el('div', {
      className: 'theme-dot' + (S.theme === t ? ' active' : ''),
      'data-t': t,
      onclick: () => { setTheme(t); renderNav(); },
    }));
  }
  document.body.appendChild(dots);
}

// ═══════════════════════════════════════════
// ① Oracle Splash
// ═══════════════════════════════════════════
function renderSplash() {
  $('#app').innerHTML = '';
  const T = S.theme;
  const phrases = THEME.splashPhrases[T];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];

  let splashCls = 'splash';
  if (T === 'silent-signal') splashCls += ' splash-zen';

  const splash = el('div', { className: splashCls });

  /* --- phrase --- */
  if (T === 'neon-entropy') {
    const h1 = el('h1', { className: 'neonGlitchText' });
    h1.appendChild(el('span', { className: 'neon-prefix' }, '> _ '));
    h1.appendChild(document.createTextNode(phrase));
    splash.appendChild(h1);
  } else {
    splash.appendChild(el('h1', {}, phrase));
  }

  /* --- subtitle --- */
  if (T === 'mystic-void') {
    splash.appendChild(el('p', { className: 'splash-sub' }, '观测世界的环境熵，让它替你做一次选择'));
  } else if (T === 'neon-entropy') {
    splash.appendChild(el('p', { className: 'splash-sub' }, '// reality.stream.observe()'));
  } else {
    splash.appendChild(el('p', { className: 'splash-sub splash-sub-zen' }, '轻轻点一下。'));
  }

  /* --- dot --- */
  if (T === 'silent-signal') {
    splash.appendChild(el('div', { className: 'ink-dot' }));
  } else {
    splash.appendChild(el('div', { className: 'glow-dot' }));
  }

  $('#app').appendChild(splash);

  const delay = THEME.timing.splash[T];
  setTimeout(() => { location.hash = 'theme'; }, delay);
}

// ═══════════════════════════════════════════
// ② Theme Select
// ═══════════════════════════════════════════
function renderThemeSelect() {
  $('#app').innerHTML = '';
  const T = S.theme;

  const hour = new Date().getHours();
  const defaultTheme = hour >= 22 || hour < 6 ? 'mystic-void'
    : hour >= 18 ? 'neon-entropy'
    : 'silent-signal';

  const themes = [
    { id: 'mystic-void', name: 'Mystic Void', desc: '深夜、情感、宿命感', hint: defaultTheme === 'mystic-void' ? '当前时段推荐' : '' },
    { id: 'neon-entropy', name: 'Neon Entropy', desc: '冲动、高能量、想听狠话', hint: defaultTheme === 'neon-entropy' ? '当前时段推荐' : '' },
    { id: 'silent-signal', name: 'Silent Signal', desc: '冷静、日常、想慢慢想', hint: defaultTheme === 'silent-signal' ? '当前时段推荐' : '' },
  ];

  let viewCls = 'theme-select';
  if (T === 'silent-signal') viewCls += ' theme-select-zen';
  const view = el('div', { className: viewCls });

  const transitionDelay = THEME.timing.themeTransition[T];

  for (const t of themes) {
    let cardCls = 'theme-card';
    if (defaultTheme === t.id) cardCls += ' selected';

    /* theme-specific selected styling */
    if (defaultTheme === t.id) {
      if (T === 'neon-entropy') cardCls += ' pulse-border';
      else if (T === 'silent-signal') cardCls += ' subtle-selected';
    }

    const card = el('div', {
      className: cardCls,
      onclick: () => {
        setTheme(t.id);
        setTimeout(() => { location.hash = 'decide'; }, transitionDelay);
      },
    });
    card.appendChild(el('h3', {}, t.name));
    card.appendChild(el('p', {}, t.desc));

    if (t.hint) {
      const hintCls = T === 'silent-signal' ? 'hint hint-zen' : 'hint';
      const hintEl = el('span', { className: hintCls }, t.hint);
      /* Neon Entropy: hint appears instantly */
      if (T === 'neon-entropy') hintEl.style.opacity = '1';
      card.appendChild(hintEl);
    }
    view.appendChild(card);
  }

  $('#app').appendChild(view);
}

// ═══════════════════════════════════════════
// ③ A/B Decision Input
// ═══════════════════════════════════════════
function renderDecision() {
  $('#app').innerHTML = '';
  const T = S.theme;
  const view = el('div', { className: 'decision-view' });

  /* --- prompt --- */
  if (T === 'mystic-void') {
    view.appendChild(el('p', { className: 'decision-prompt' }, '在黑暗中写下你的两个选择'));
  } else if (T === 'neon-entropy') {
    view.appendChild(el('p', { className: 'decision-prompt decision-prompt-neon' }, '> INPUT DECISION PARAMETERS'));
  } else {
    view.appendChild(el('p', { className: 'decision-prompt decision-prompt-zen' }, '你在犹豫什么？'));
  }

  /* --- input pair --- */
  const pair = el('div', { className: 'decision-pair' });

  /* input A */
  let inputACls = 'option-input';
  if (T === 'neon-entropy') inputACls += ' option-input-neon';
  else if (T === 'silent-signal') inputACls += ' option-input-zen';
  const inputA = el('input', {
    className: inputACls,
    type: 'text',
    placeholder: T === 'neon-entropy' ? 'OPTION_A' : (T === 'silent-signal' ? '选项一' : '比如：辞职'),
    value: S.optionA,
    oninput: (e) => { S.optionA = e.target.value; },
  });

  /* separator */
  const sep = el('div', { className: 'decision-separator' });
  if (T === 'mystic-void') {
    sep.textContent = '│';
  } else if (T === 'neon-entropy') {
    sep.textContent = '>';
    sep.style.color = 'var(--accent-2)';
    sep.style.fontFamily = 'var(--font-mono)';
  } else {
    sep.textContent = '·';
    sep.style.opacity = '0.25';
    sep.style.fontSize = '1.5rem';
    sep.style.margin = '8px 0';
  }

  /* input B */
  let inputBCls = 'option-input';
  if (T === 'neon-entropy') inputBCls += ' option-input-neon';
  else if (T === 'silent-signal') inputBCls += ' option-input-zen';
  const inputB = el('input', {
    className: inputBCls,
    type: 'text',
    placeholder: T === 'neon-entropy' ? 'OPTION_B' : (T === 'silent-signal' ? '选项二' : '比如：留下'),
    value: S.optionB,
    oninput: (e) => { S.optionB = e.target.value; },
  });

  pair.appendChild(inputA);
  pair.appendChild(sep);
  pair.appendChild(inputB);
  view.appendChild(pair);

  /* --- button --- */
  let btnText = '开始观测';
  let btnLoadingText = '正在生成信号采样...';
  let btnLoadingClass = 'gold-pulse';
  if (T === 'neon-entropy') {
    btnText = 'INITIATE SCAN';
    btnLoadingText = 'SCANNING...';
    btnLoadingClass = 'glitch-button';
  } else if (T === 'silent-signal') {
    btnText = '开始';
    btnLoadingText = '...';
    btnLoadingClass = 'btn-zen-loading';
  }

  view.appendChild(el('button', {
    className: 'btn btn-primary btn-block',
    id: 'decide-btn',
    onclick: async function () {
      if (!S.optionA.trim() || !S.optionB.trim()) return;
      const btn = this;
      btn.textContent = btnLoadingText;
      btn.disabled = true;
      btn.classList.add(btnLoadingClass);
      S.questions = [];
      S.answers = {};
      S.currentQuestion = 0;
      S.result = null;
      try {
        const data = await API.getQuestions(S.theme, S.optionA.trim(), S.optionB.trim());
        S.questions = data.questions;
        S.currentQuestion = 0;
        location.hash = 'sample';
      } catch (e) {
        btn.textContent = btnText;
        btn.disabled = false;
        btn.classList.remove(btnLoadingClass);
        alert(e.message);
      }
    },
  }, btnText));

  $('#app').appendChild(view);
}

// ═══════════════════════════════════════════
// ④ Signal Sampling (question flow)
// ═══════════════════════════════════════════
function renderSample() {
  $('#app').innerHTML = '';
  const T = S.theme;

  if (S.currentQuestion >= S.questions.length) {
    location.hash = 'loading';
    return;
  }

  const q = S.questions[S.currentQuestion];
  const entryAnimClass = 'anim-' + THEME.inputAnimation[T];
  const exitAnimClass = 'anim-' + THEME.exitAnimation[T];
  const exitDuration = THEME.timing.questionExit[T];
  const nextDelay = THEME.timing.questionNext[T];

  const view = el('div', { className: 'sample-view' });

  /* --- progress dots --- */
  let dotsCls = 'progress-dots';
  if (T === 'neon-entropy') dotsCls += ' progress-dots-neon';
  else if (T === 'silent-signal') dotsCls += ' progress-dots-zen';
  const dots = el('div', { className: dotsCls });
  for (let i = 0; i < S.questions.length; i++) {
    let cls = 'progress-dot';
    if (T === 'neon-entropy') cls += ' progress-dot-square';
    else if (T === 'silent-signal') cls += ' progress-dot-zen';
    if (i < S.currentQuestion) cls += ' done';
    else if (i === S.currentQuestion) cls += ' current';
    dots.appendChild(el('div', { className: cls }));
  }

  /* --- question card --- */
  let cardCls = 'question-card ' + entryAnimClass;
  if (T === 'neon-entropy') cardCls += ' question-card-neon';
  else if (T === 'silent-signal') cardCls += ' question-card-zen';
  const card = el('div', { className: cardCls });

  let textCls = 'question-text';
  if (T === 'neon-entropy') textCls += ' question-text-neon';
  else if (T === 'silent-signal') textCls += ' question-text-zen';
  card.appendChild(el('div', { className: textCls }, q.text));

  /* --- answer handler --- */
  function answer(value) {
    S.answers[q.id] = value;
    card.classList.remove(entryAnimClass);
    card.classList.add(exitAnimClass);
    setTimeout(() => {
      S.currentQuestion++;
      renderSample();
    }, exitDuration + nextDelay);
  }

  /* --- input per type --- */
  if (q.inputType === 'chips' && q.options) {
    let groupCls = 'chip-group';
    if (T === 'neon-entropy') groupCls += ' chip-group-neon';
    else if (T === 'silent-signal') groupCls += ' chip-group-zen';
    const group = el('div', { className: groupCls });
    for (const opt of q.options) {
      let chipCls = 'chip';
      if (T === 'neon-entropy') chipCls += ' chip-neon';
      else if (T === 'silent-signal') chipCls += ' chip-zen';
      group.appendChild(el('button', {
        className: chipCls,
        onclick: () => answer(opt),
      }, opt));
    }
    card.appendChild(group);
  } else if (q.inputType === 'number') {
    let inputCls = 'sample-input';
    if (T === 'neon-entropy') inputCls += ' sample-input-neon';
    else if (T === 'silent-signal') inputCls += ' sample-input-zen';
    const input = el('input', {
      className: inputCls,
      type: 'number',
      inputMode: 'numeric',
      placeholder: q.placeholder || (T === 'neon-entropy' ? 'ENTER_NUMBER...' : '输入数字...'),
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value) answer(input.value);
    });
    card.appendChild(input);

    let confirmText = '确认';
    if (T === 'neon-entropy') confirmText = 'CONFIRM';
    card.appendChild(el('button', {
      className: 'btn btn-primary' + (T === 'neon-entropy' ? ' btn-neon' : ''),
      style: { marginTop: '20px' },
      onclick: () => { if (input.value) answer(input.value); },
    }, confirmText));
  } else {
    /* text input */
    let inputCls = 'sample-input';
    if (T === 'neon-entropy') inputCls += ' sample-input-neon';
    else if (T === 'silent-signal') inputCls += ' sample-input-zen';
    const input = el('input', {
      className: inputCls,
      type: 'text',
      placeholder: q.placeholder || (T === 'neon-entropy' ? 'ENTER_TEXT...' : '输入...'),
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value) answer(input.value);
    });
    card.appendChild(input);

    let confirmText = '确认';
    if (T === 'neon-entropy') confirmText = 'CONFIRM';
    card.appendChild(el('button', {
      className: 'btn btn-primary' + (T === 'neon-entropy' ? ' btn-neon' : ''),
      style: { marginTop: '20px' },
      onclick: () => { if (input.value) answer(input.value); },
    }, confirmText));
  }

  view.appendChild(card);
  view.appendChild(dots);
  $('#app').appendChild(view);
}

// ═══════════════════════════════════════════
// ⑤ Loading Ritual → Result
// ═══════════════════════════════════════════
function renderLoading() {
  $('#app').innerHTML = '';
  clearLoadingCleanup();
  const T = S.theme;
  const cleanupFns = [];

  const overlay = el('div', { className: 'loading-overlay' });

  /* ─── Mystic Void: gold pulse dot + particles + radial glow ─── */
  if (T === 'mystic-void') {
    /* radial glow background */
    overlay.appendChild(el('div', { className: 'loading-radial-glow' }));

    /* particle canvas */
    const canvas = el('canvas', { className: 'loading-particles' });
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const particles = [];
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * Math.max(canvas.width, canvas.height) * 0.6 + 80;
      particles.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        size: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.35 + 0.05,
        speed: Math.random() * 0.4 + 0.2,
        angle: angle,
        dist: dist,
      });
    }
    let animId;
    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.dist -= p.speed;
        if (p.dist < 4) {
          p.dist = Math.max(canvas.width, canvas.height) * 0.55 + Math.random() * 100;
          p.angle = Math.random() * Math.PI * 2;
        }
        p.x = centerX + Math.cos(p.angle) * p.dist;
        p.y = centerY + Math.sin(p.angle) * p.dist;
        const fadeIn = Math.min(1, (Math.max(canvas.width, canvas.height) * 0.55 - p.dist + 100) / 160);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(196,163,90,' + (p.alpha * fadeIn) + ')';
        ctx.fill();
      }
      animId = requestAnimationFrame(animateParticles);
    }
    animateParticles();
    cleanupFns.push(() => cancelAnimationFrame(animId));

    /* glow dot */
    const animContainer = el('div', { className: 'loading-animation' });
    animContainer.appendChild(el('div', { className: 'glow-dot loading-center-dot' }));
    overlay.appendChild(animContainer);

    /* phrase cycling */
    const phrases = THEME.loadingPhrases[T];
    const phraseEl = el('div', { className: 'loading-phrase' }, phrases[0]);
    overlay.appendChild(phraseEl);
    let phraseIdx = 0;
    const cycle = setInterval(() => {
      phraseIdx = (phraseIdx + 1) % phrases.length;
      phraseEl.textContent = phrases[phraseIdx];
    }, THEME.timing.phraseCycle[T]);
    cleanupFns.push(() => clearInterval(cycle));
  }

  /* ─── Neon Entropy: grid bg + progress bar + scanline + fast status cycling ─── */
  else if (T === 'neon-entropy') {
    /* grid background */
    overlay.appendChild(el('div', { className: 'loading-grid-bg' }));

    /* scanline */
    overlay.appendChild(el('div', { className: 'loading-scanline' }));

    /* animated gradient progress bar */
    const progressContainer = el('div', { className: 'loading-progress-container' });
    const progressBar = el('div', { className: 'loading-progress-bar' });
    const progressGlow = el('div', { className: 'loading-progress-glow' });
    progressContainer.appendChild(progressGlow);
    progressContainer.appendChild(progressBar);
    overlay.appendChild(progressContainer);

    /* status text cycling */
    const statuses = THEME.loadingPhrases[T];
    let statusIdx = 0;
    const statusEl = el('div', { className: 'loading-status' }, statuses[0]);
    overlay.appendChild(statusEl);
    const cycle = setInterval(() => {
      statusIdx = (statusIdx + 1) % statuses.length;
      statusEl.textContent = statuses[statusIdx];
    }, THEME.timing.phraseCycle[T]);
    cleanupFns.push(() => clearInterval(cycle));
  }

  /* ─── Silent Signal: ink dot + very slow phrase ─── */
  else {
    /* ink dot */
    const animContainer = el('div', { className: 'loading-animation loading-animation-zen' });
    animContainer.appendChild(el('div', { className: 'ink-dot loading-center-dot' }));
    overlay.appendChild(animContainer);

    /* phrase cycling (very slow) */
    const phrases = THEME.loadingPhrases[T];
    const phraseEl = el('div', { className: 'loading-phrase loading-phrase-zen' }, phrases[0]);
    overlay.appendChild(phraseEl);
    let phraseIdx = 0;
    const cycle = setInterval(() => {
      phraseIdx = (phraseIdx + 1) % phrases.length;
      phraseEl.textContent = phrases[phraseIdx];
    }, THEME.timing.phraseCycle[T]);
    cleanupFns.push(() => clearInterval(cycle));
  }

  $('#app').appendChild(overlay);

  _loadingCleanup = () => {
    for (const fn of cleanupFns) fn();
  };

  /* call decide API */
  API.decide(S.theme, S.optionA, S.optionB, S.answers)
    .then((data) => {
      clearLoadingCleanup();
      S.result = data;
      location.hash = 'result';
    })
    .catch((e) => {
      clearLoadingCleanup();
      alert(e.message);
      location.hash = 'decide';
    });
}

// ═══════════════════════════════════════════
// ⑥ Result
// ═══════════════════════════════════════════
function renderResult() {
  $('#app').innerHTML = '';
  if (!S.result) { location.hash = 'decide'; return; }

  const T = S.theme;
  const r = S.result;

  /* ─── Mystic Void: gold-bordered card ─── */
  if (T === 'mystic-void') {
    const view = el('div', { className: 'result-view' });
    const card = el('div', { className: 'result-card result-card-void' });

    card.appendChild(el('div', { className: 'result-label' }, '环境熵观测报告'));
    card.appendChild(el('div', { className: 'result-bias result-bias-void' }, '世界偏向 ' + r.bias));
    card.appendChild(el('div', { className: 'result-verdict' }, r.verdict));
    card.appendChild(el('div', { className: 'result-interpretation' }, r.interpretation));
    card.appendChild(el('div', { className: 'result-final result-final-void' }, r.finalLine));

    if (r.signals) {
      const signals = el('div', { className: 'result-signals' });
      for (const s of r.signals) {
        signals.appendChild(el('div', {},
          el('div', { className: 'result-signal-label' }, s.label),
          el('div', { className: 'result-signal-value' }, s.value),
        ));
      }
      card.appendChild(signals);
    }

    view.appendChild(card);

    view.appendChild(el('button', {
      className: 'btn btn-primary btn-block',
      onclick: () => {
        S.optionA = ''; S.optionB = ''; S.questions = [];
        S.answers = {}; S.currentQuestion = 0; S.result = null;
        location.hash = 'decide';
      },
    }, '重新决策'));

    view.appendChild(el('button', {
      className: 'btn btn-link',
      style: { marginTop: '8px' },
      onclick: () => shareResult(r),
    }, '分享结果'));

    $('#app').appendChild(view);
  }

  /* ─── Neon Entropy: terminal frame with brackets ─── */
  else if (T === 'neon-entropy') {
    const view = el('div', { className: 'result-view' });
    const frame = el('div', { className: 'result-card result-card-neon' });

    /* decorative corner brackets */
    const bracketTL = el('div', { className: 'corner-bracket corner-tl' }, '┌──');
    const bracketTR = el('div', { className: 'corner-bracket corner-tr' }, '──┐');
    const bracketBL = el('div', { className: 'corner-bracket corner-bl' }, '└──');
    const bracketBR = el('div', { className: 'corner-bracket corner-br' }, '──┘');
    frame.appendChild(bracketTL);
    frame.appendChild(bracketTR);
    frame.appendChild(bracketBL);
    frame.appendChild(bracketBR);

    frame.appendChild(el('div', { className: 'result-label result-label-neon' }, '// ENTROPY_OBSERVATION_REPORT'));
    frame.appendChild(el('div', { className: 'result-bias result-bias-neon' }, 'WORLD BIAS: ' + r.bias));
    frame.appendChild(el('div', { className: 'result-verdict result-verdict-neon' }, '> ' + r.verdict));
    frame.appendChild(el('div', { className: 'result-interpretation' }, r.interpretation));
    frame.appendChild(el('div', { className: 'result-final result-final-neon' }, r.finalLine));

    if (r.signals) {
      const signals = el('div', { className: 'result-signals result-signals-neon' });
      for (const s of r.signals) {
        const entry = el('div', { className: 'result-signal-entry-neon' });
        entry.appendChild(el('div', { className: 'result-signal-label result-signal-label-neon' }, s.label));
        entry.appendChild(el('div', { className: 'result-signal-value result-signal-value-neon' }, s.value));
        signals.appendChild(entry);
      }
      frame.appendChild(signals);
    }

    view.appendChild(frame);

    view.appendChild(el('button', {
      className: 'btn btn-primary btn-block btn-neon',
      onclick: () => {
        S.optionA = ''; S.optionB = ''; S.questions = [];
        S.answers = {}; S.currentQuestion = 0; S.result = null;
        location.hash = 'decide';
      },
    }, 'NEW SCAN'));

    view.appendChild(el('button', {
      className: 'btn btn-link btn-link-neon',
      style: { marginTop: '8px' },
      onclick: () => shareResult(r),
    }, 'SHARE'));

    $('#app').appendChild(view);
  }

  /* ─── Silent Signal: no card, just text in whitespace ─── */
  else {
    const view = el('div', { className: 'result-view result-view-zen' });

    view.appendChild(el('div', { className: 'result-label result-label-zen' }, '观测报告'));
    view.appendChild(el('div', { className: 'result-bias result-bias-zen' }, '偏向 ' + r.bias));
    view.appendChild(el('div', { className: 'result-verdict result-verdict-zen' }, r.verdict));
    view.appendChild(el('div', { className: 'result-interpretation result-interpretation-zen' }, r.interpretation));
    view.appendChild(el('div', { className: 'result-final result-final-zen' }, r.finalLine));

    if (r.signals) {
      const signals = el('div', { className: 'result-signals result-signals-zen' });
      for (const s of r.signals) {
        signals.appendChild(el('div', {},
          el('div', { className: 'result-signal-label' }, s.label),
          el('div', { className: 'result-signal-value' }, s.value),
        ));
      }
      view.appendChild(signals);
    }

    view.appendChild(el('button', {
      className: 'btn btn-block btn-zen',
      onclick: () => {
        S.optionA = ''; S.optionB = ''; S.questions = [];
        S.answers = {}; S.currentQuestion = 0; S.result = null;
        location.hash = 'decide';
      },
    }, '重新决策'));

    view.appendChild(el('button', {
      className: 'btn btn-link',
      style: { marginTop: '16px' },
      onclick: () => shareResult(r),
    }, '分享'));

    $('#app').appendChild(view);
  }
}

// ─── Share Helper ───
function shareResult(r) {
  const T = S.theme;
  let shareText;
  if (T === 'neon-entropy') {
    shareText = '// ENTROPY_OBSERVATION_REPORT\n\nWORLD BIAS: ' + r.bias + '\n"' + r.finalLine + '"\n\n—— Entropy Observer';
  } else {
    shareText = '\u{1F52E} 环境熵观测\n\n世界偏向 ' + r.bias + '\n"' + r.finalLine + '"\n\n—— 环境熵观测器';
  }
  if (navigator.share) {
    navigator.share({ title: '环境熵观测', text: shareText }).catch(() => {});
  } else {
    navigator.clipboard.writeText(shareText).then(
      () => alert(T === 'neon-entropy' ? 'COPIED' : '已复制分享文案'),
      () => {}
    );
  }
}
