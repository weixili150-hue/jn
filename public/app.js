/* ═══════════════════════════════════════
   Entropy Observer — Core SPA
   Shared infrastructure, router, and common views.
   Engines: engine-mystic.js, engine-silent.js, engine-neon.js
   ═══════════════════════════════════════ */

// ─── Shared Infrastructure ───

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

const S = {
  theme: 'mystic-void',
  optionA: '',
  optionB: '',
  questions: [],
  answers: {},
  currentQuestion: 0,
  result: null,
};

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
  if (window.Ambient && window.Ambient.setTheme) {
    window.Ambient.setTheme(theme);
  }
}

// ─── Loading Cleanup ───

let _loadingCleanup = null;

function clearLoadingCleanup() {
  if (_loadingCleanup) {
    _loadingCleanup();
    _loadingCleanup = null;
  }
}

// ─── Splash Phrase Pools ───

const MYSTIC_PHRASES = [
  '纠结的时候，不如换个方式找答案。',
  '让世界的偶然，替你做一次决定。',
  '命运并非随机，只是观测的角度不同。',
  '宇宙的熵在流动，你的答案正在生成。',
  '每一个犹豫，都是对可能性的尊重。',
];

const ZEN_PHRASES = [
  '静下来，答案自然会浮现。',
  '不急着选。看看世界怎么说。',
  '呼吸。然后让一切都慢下来。',
  '你不需要想太多。',
  '轻轻放下纠结。环境会告诉你方向。',
];

// ─── Share Helper ───

function shareResult(r) {
  const T = S.theme;
  let shareText;
  if (T === 'neon-entropy') {
    shareText = '// 环境熵观测报告\n\n世界偏向：' + r.bias + '\n"' + r.finalLine + '"\n\n—— 环境熵观测器';
  } else {
    shareText = '\u{1F52E} 环境熵观测\n\n世界偏向 ' + r.bias + '\n"' + r.finalLine + '"\n\n—— 环境熵观测器';
  }
  if (navigator.share) {
    navigator.share({ title: '环境熵观测', text: shareText }).catch(() => {});
  } else {
    navigator.clipboard.writeText(shareText).then(
      () => alert(T === 'neon-entropy' ? '已复制' : '已复制分享文案'),
      () => {}
    );
  }
}

// ═══════════════════════════════════════════
//  ROUTER
// ═══════════════════════════════════════════

function route() {
  const hash = location.hash.slice(1) || 'splash';
  if (S.theme === 'neon-entropy' && hash !== 'splash') {
    if (!window._terminalActive) startTerminal();
    return;
  }
  renderNav();

  const app = $('#app');
  app.classList.add('crossfading');

  setTimeout(() => {
    switch (hash) {
      case 'splash': renderSplash(); break;
      case 'theme': renderThemeSelect(); break;
      case 'decide': renderDecision(); break;
      case 'sample': renderSample(); break;
      case 'loading': renderLoading(); break;
      case 'result': renderResult(); break;
      default: location.hash = 'splash'; return;
    }
    requestAnimationFrame(() => {
      app.classList.remove('crossfading');
    });
  }, 350);
}

window.addEventListener('hashchange', () => {
  if (S.theme === 'neon-entropy' && location.hash.slice(1) !== 'splash') return;
  clearLoadingCleanup();
  route();
});

window.addEventListener('load', () => {
  const saved = localStorage.getItem('entropy-theme');
  if (saved) setTheme(saved);
  route();
});

// ═══════════════════════════════════════════
//  NAV — Theme Switcher Dots
// ═══════════════════════════════════════════

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
      onclick: () => {
        const prevTheme = S.theme;
        setTheme(t);

        if (t === 'neon-entropy') {
          clearLoadingCleanup();
          destroyTerminal();
          startTerminal();
        } else if (prevTheme === 'neon-entropy' && window._terminalActive) {
          destroyTerminal();
          location.hash = 'splash';
        } else {
          clearLoadingCleanup();
          route();
        }
        renderNav();
      },
    }));
  }
  document.body.appendChild(dots);
}

// ═══════════════════════════════════════════
//  SHARED VIEWS
//  Engine-specific logic delegated to modules
// ═══════════════════════════════════════════

// ─── ① Splash ───

function renderSplash() {
  clearLoadingCleanup();
  $('#app').innerHTML = '';
  const T = S.theme;

  const pool = T === 'silent-signal' ? ZEN_PHRASES : MYSTIC_PHRASES;
  const phrase = pool[Math.floor(Math.random() * pool.length)];

  const splashCls = T === 'silent-signal' ? 'splash splash-zen' : 'splash';
  const splash = el('div', { className: splashCls });

  splash.appendChild(el('h1', {}, phrase));

  if (T === 'silent-signal') {
    splash.appendChild(el('p', { className: 'splash-sub splash-sub-zen' }, '轻轻点一下。'));
    splash.appendChild(el('div', { className: 'ink-dot' }));
  } else {
    splash.appendChild(el('p', { className: 'splash-sub' }, '观测世界的环境熵，让它替你做一次选择'));
    splash.appendChild(el('div', { className: 'glow-dot' }));
  }

  $('#app').appendChild(splash);

  const delay = T === 'silent-signal' ? 5000 : 4000;
  setTimeout(() => { location.hash = 'theme'; }, delay);
}

// ─── ② Theme Select ───

function renderThemeSelect() {
  clearLoadingCleanup();
  $('#app').innerHTML = '';

  /* Silent Signal skips this view */
  if (S.theme === 'silent-signal') {
    location.hash = 'decide';
    return;
  }

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

  const viewCls = T === 'silent-signal' ? 'theme-select theme-select-zen' : 'theme-select';
  const view = el('div', { className: viewCls });

  for (const t of themes) {
    let cardCls = 'theme-card';
    if (defaultTheme === t.id) cardCls += ' selected';

    if (defaultTheme === t.id) {
      if (T === 'neon-entropy') cardCls += ' pulse-border';
      else if (T === 'silent-signal') cardCls += ' subtle-selected';
    }

    const card = el('div', {
      className: cardCls,
      onclick: () => {
        setTheme(t.id);
        clearLoadingCleanup();
        if (t.id === 'neon-entropy') {
          destroyTerminal();
          startTerminal();
        } else {
          location.hash = 'decide';
        }
      },
    });
    card.appendChild(el('h3', {}, t.name));
    card.appendChild(el('p', {}, t.desc));

    if (t.hint) {
      const hintCls = T === 'silent-signal' ? 'hint hint-zen' : 'hint';
      const hintEl = el('span', { className: hintCls }, t.hint);
      if (T === 'neon-entropy') hintEl.style.opacity = '1';
      card.appendChild(hintEl);
    }
    view.appendChild(card);
  }

  $('#app').appendChild(view);
}

// ─── ③ Decision Input ───

function renderDecision() {
  clearLoadingCleanup();
  $('#app').innerHTML = '';
  const T = S.theme;

  const view = el('div', { className: 'decision-view' });

  if (T === 'silent-signal') {
    view.appendChild(el('p', { className: 'decision-prompt decision-prompt-zen' }, '你在犹豫什么？'));
    view.appendChild(el('p', { className: 'decision-subtitle-zen' }, '轻轻写下两个选择'));
  } else {
    view.appendChild(el('p', { className: 'decision-prompt' }, '在黑暗中写下你的犹豫'));
  }

  const pair = el('div', { className: 'decision-pair' });

  const inputCls = T === 'silent-signal' ? 'zen-input-line' : 'void-input-line';
  const placeholderA = T === 'silent-signal' ? '选项一' : '比如：辞职';
  const placeholderB = T === 'silent-signal' ? '选项二' : '比如：留下';

  const inputA = el('input', {
    className: inputCls,
    type: 'text',
    placeholder: placeholderA,
    value: S.optionA,
    oninput: (e) => { S.optionA = e.target.value; },
  });

  const sep = el('div', { className: 'decision-separator' });
  if (T === 'silent-signal') {
    sep.textContent = '·';
    sep.style.opacity = '0.15';
  } else {
    sep.textContent = '│';
  }

  const inputB = el('input', {
    className: inputCls,
    type: 'text',
    placeholder: placeholderB,
    value: S.optionB,
    oninput: (e) => { S.optionB = e.target.value; },
  });

  pair.appendChild(inputA);
  pair.appendChild(sep);
  pair.appendChild(inputB);
  view.appendChild(pair);

  const btnText = T === 'silent-signal' ? '开始' : '提交给宇宙';
  const btnLoadingText = T === 'silent-signal' ? '...' : '提交中...';
  const btnCls = T === 'silent-signal' ? 'btn-zen-text' : 'btn btn-primary btn-block';

  view.appendChild(el('button', {
    className: btnCls,
    id: 'decide-btn',
    onclick: async function () {
      if (!S.optionA.trim() || !S.optionB.trim()) return;
      const btn = this;
      const originalText = btn.textContent;
      btn.textContent = btnLoadingText;
      btn.disabled = true;
      if (T !== 'silent-signal') btn.classList.add('gold-pulse');
      S.questions = [];
      S.answers = {};
      S.currentQuestion = 0;
      S.result = null;
      S._zenAnswered = new Set();
      try {
        const data = await API.getQuestions(S.theme, S.optionA.trim(), S.optionB.trim());
        S.questions = data.questions;
        S.currentQuestion = 0;
        location.hash = 'sample';
      } catch (e) {
        btn.textContent = originalText;
        btn.disabled = false;
        if (T !== 'silent-signal') btn.classList.remove('gold-pulse');
        alert(e.message);
      }
    },
  }, btnText));

  $('#app').appendChild(view);
}

// ─── ④ Sample — dispatches to engine ───

function renderSample() {
  clearLoadingCleanup();
  $('#app').innerHTML = '';

  if (S.theme === 'silent-signal') {
    Engine_Silent.sample();
  } else {
    Engine_Mystic.sample();
  }
}

// ─── ⑤ Loading Ritual ───

function renderLoading() {
  clearLoadingCleanup();
  $('#app').innerHTML = '';
  const T = S.theme;
  const cleanupFns = [];

  if (T === 'silent-signal') {
    const overlay = el('div', { className: 'loading-overlay loading-overlay-zen' });

    const animContainer = el('div', { className: 'loading-animation loading-animation-zen' });
    animContainer.appendChild(el('div', { className: 'ink-dot loading-center-dot' }));
    overlay.appendChild(animContainer);

    const phrases = ['......', '............', '..................'];
    const phraseEl = el('div', { className: 'loading-phrase loading-phrase-zen' }, phrases[0]);
    overlay.appendChild(phraseEl);
    let phraseIdx = 0;
    const cycle = setInterval(() => {
      phraseIdx = (phraseIdx + 1) % phrases.length;
      phraseEl.textContent = phrases[phraseIdx];
    }, 8000);
    cleanupFns.push(() => clearInterval(cycle));

    $('#app').appendChild(overlay);

    if (window.Particles && window.Particles.breathMode) {
      window.Particles.breathMode(0.6);
    }
  } else {
    const overlay = el('div', { className: 'loading-overlay' });

    overlay.appendChild(el('div', { className: 'loading-radial-glow' }));

    const animContainer = el('div', { className: 'loading-animation' });
    animContainer.appendChild(el('div', { className: 'glow-dot loading-center-dot' }));
    overlay.appendChild(animContainer);

    const phrases = [
      '正在同步环境熵...',
      '外部信号聚集中...',
      '世界偏向正在收敛...',
    ];
    const phraseEl = el('div', { className: 'loading-phrase' }, phrases[0]);
    overlay.appendChild(phraseEl);
    let phraseIdx = 0;
    const cycle = setInterval(() => {
      phraseIdx = (phraseIdx + 1) % phrases.length;
      phraseEl.textContent = phrases[phraseIdx];
    }, 4000);
    cleanupFns.push(() => clearInterval(cycle));

    $('#app').appendChild(overlay);

    if (window.Particles && window.Particles.convergeParticles) {
      window.Particles.convergeParticles();
    }
  }

  _loadingCleanup = () => {
    for (const fn of cleanupFns) fn();
  };

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

// ─── ⑥ Result — dispatches to engine ───

function renderResult() {
  clearLoadingCleanup();
  $('#app').innerHTML = '';
  if (!S.result) { location.hash = 'decide'; return; }

  if (S.theme === 'silent-signal') {
    Engine_Silent.result();
  } else {
    Engine_Mystic.result();
  }
}
