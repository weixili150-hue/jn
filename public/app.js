/* ═══════════════════════════════════════
   Entropy Observer — Frontend SPA
   Three engines: Mystic Void, Silent Signal, Neon Entropy
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

  /* Smooth crossfade transition between views */
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
//  ENGINE 1 & 2: MYSTIC VOID + SILENT SIGNAL
//  (shared function signatures, branched internally)
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

  /* Silent Signal skips this view entirely */
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

  /* prompt */
  if (T === 'silent-signal') {
    view.appendChild(el('p', { className: 'decision-prompt decision-prompt-zen' }, '你在犹豫什么？'));
    view.appendChild(el('p', { className: 'decision-subtitle-zen' }, '轻轻写下两个选择'));
  } else {
    view.appendChild(el('p', { className: 'decision-prompt' }, '在黑暗中写下你的犹豫'));
  }

  /* input pair */
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

  /* button */
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

// ─── ④ Sample (Question Flow) ───

function renderSample() {
  clearLoadingCleanup();
  $('#app').innerHTML = '';
  const T = S.theme;

  /* ── Silent Signal: Drift Engine ── */
  if (T === 'silent-signal') {
    renderSampleZen();
    return;
  }

  /* ── Mystic Void: sequential questions ── */

  if (S.currentQuestion >= S.questions.length) {
    location.hash = 'loading';
    return;
  }

  const q = S.questions[S.currentQuestion];
  const view = el('div', { className: 'sample-view' });

  /* question card */
  const entryAnim = 'anim-voidUnblur';
  const cardCls = 'question-card ' + entryAnim;
  const card = el('div', { className: cardCls });

  const textCls = 'question-text';
  card.appendChild(el('div', { className: textCls }, q.text));

  /* answer handler */
  function answer(value) {
    S.answers[q.id] = value;

    /* Mystic Void: dissolve exit, then 1500ms darkness */
    card.classList.remove(entryAnim);
    card.classList.add('void-dissolve');
    setTimeout(() => {
      if (card.parentNode) card.remove();
      setTimeout(() => {
        S.currentQuestion++;
        renderSample();
      }, 1500);
    }, 600); /* dissolve animation duration */
  }

  /* input area */
  /* Mystic Void: chips for chip questions, void-input-line for text */
  if (q.inputType === 'chips' && q.options) {
    const group = el('div', { className: 'void-choice-group' });
    for (const opt of q.options) {
      group.appendChild(el('button', {
        className: 'void-floating-choice',
        onclick: () => answer(opt),
      }, opt));
    }
    card.appendChild(group);
  } else {
    const input = el('input', {
      className: 'void-input-line',
      type: q.inputType === 'number' ? 'number' : 'text',
      inputMode: q.inputType === 'number' ? 'numeric' : undefined,
      placeholder: q.placeholder || '输入...',
    });
    const inputWrap = el('div', { className: 'sample-input-wrap' }, input);
    card.appendChild(inputWrap);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) answer(input.value.trim());
    });

    card.appendChild(el('button', {
      className: 'btn btn-primary',
      style: { marginTop: '20px' },
      onclick: () => { if (input.value.trim()) answer(input.value.trim()); },
    }, '确认'));
  }

  /* progress — Mystic Void only (star dots) */
  const progress = el('div', { className: 'void-star-progress' });
  for (let i = 0; i < S.questions.length; i++) {
    const starCls = i < S.currentQuestion ? 'void-star-lit' : 'void-star';
    progress.appendChild(el('div', { className: starCls }));
  }
  view.appendChild(progress);

  view.appendChild(card);
  $('#app').appendChild(view);
}

/* ─── Silent Signal Engine: renderSampleZen ───
   Questions arrive one at a time — like ink blooming, like time passing.
   No choice of order. No skipping. Just presence. */

function renderSampleZen() {
  if (!S.questions || S.questions.length === 0) {
    location.hash = 'loading';
    return;
  }

  const view = el('div', { className: 'sample-view-zen' });
  $('#app').appendChild(view);

  /* Show the first question */
  showNextZenQuestion(view, 0);
}

function showNextZenQuestion(view, idx) {
  if (idx >= S.questions.length) {
    /* All answered — slow dissolve and navigate */
    view.style.transition = 'opacity 2s ease';
    view.style.opacity = '0';
    setTimeout(() => { location.hash = 'loading'; }, 2500);
    return;
  }

  const q = S.questions[idx];

  /* Clear previous question content */
  const oldContent = view.querySelector('.zen-moment');
  if (oldContent) {
    oldContent.style.transition = 'opacity 1.2s ease, transform 1.2s ease';
    oldContent.style.opacity = '0';
    oldContent.style.transform = 'translateY(-12px)';
    setTimeout(() => oldContent.remove(), 1200);
  }

  /* Create new moment container */
  const moment = el('div', { className: 'zen-moment' });

  /* Question text — emerges like ink spreading on paper */
  const questionText = el('div', { className: 'zen-question-emerge' }, q.text);
  moment.appendChild(questionText);

  /* Input area — thin, minimal, no chrome */
  const inputWrap = el('div', { className: 'zen-answer-area' });

  const input = el('input', {
    className: 'zen-input-line',
    type: 'text',
    placeholder: q.placeholder || '轻轻写下...',
  });

  const doneHint = el('div', { className: 'zen-done-hint' }, '按回车');

  inputWrap.appendChild(input);
  inputWrap.appendChild(doneHint);
  moment.appendChild(inputWrap);

  view.appendChild(moment);

  /* Trigger emergence animation after DOM insertion */
  requestAnimationFrame(() => {
    moment.style.opacity = '1';
    moment.style.transform = 'translateY(0)';
    setTimeout(() => input.focus(), 400);
  });

  /* Handle answer submission */
  function submit(value) {
    if (!value.trim()) return;

    S.answers[q.id] = value.trim();

    /* Ink ripple at input position */
    const rect = input.getBoundingClientRect();
    if (window.Particles && window.Particles.inkRipple) {
      window.Particles.inkRipple(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    /* Disable further input */
    input.disabled = true;
    doneHint.style.transition = 'opacity 0.6s ease';
    doneHint.style.opacity = '0';

    /* Gentle pause — time to breathe — then next question */
    setTimeout(() => { showNextZenQuestion(view, idx + 1); }, 2000);
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit(input.value);
  });

  /* Small touch: tapping the question text also focuses input */
  questionText.addEventListener('click', () => input.focus());
}

// ─── ⑤ Loading Ritual ───

function renderLoading() {
  clearLoadingCleanup();
  $('#app').innerHTML = '';
  const T = S.theme;
  const cleanupFns = [];

  if (T === 'silent-signal') {
    /* Silent Signal: white/cream overlay, ink-dot breathing slowly */
    const overlay = el('div', { className: 'loading-overlay loading-overlay-zen' });

    const animContainer = el('div', { className: 'loading-animation loading-animation-zen' });
    animContainer.appendChild(el('div', { className: 'ink-dot loading-center-dot' }));
    overlay.appendChild(animContainer);

    /* Phrase cycling every 8s — just ellipses of varying lengths */
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

    /* Subtle breathing on particles canvas */
    if (window.Particles && window.Particles.breathMode) {
      window.Particles.breathMode(0.6);
    }
  } else {
    /* Mystic Void: dark overlay, glow-dot breathing, radial glow, converging particles */
    const overlay = el('div', { className: 'loading-overlay' });

    /* radial glow */
    overlay.appendChild(el('div', { className: 'loading-radial-glow' }));

    /* glow dot breathing */
    const animContainer = el('div', { className: 'loading-animation' });
    animContainer.appendChild(el('div', { className: 'glow-dot loading-center-dot' }));
    overlay.appendChild(animContainer);

    /* phrase cycling every 4s */
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

    /* converge particles */
    if (window.Particles && window.Particles.convergeParticles) {
      window.Particles.convergeParticles();
    }
  }

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

// ─── ⑥ Result ───

function renderResult() {
  clearLoadingCleanup();
  $('#app').innerHTML = '';
  if (!S.result) { location.hash = 'decide'; return; }

  const T = S.theme;
  const r = S.result;

  if (T === 'silent-signal') {
    /* ── Silent Signal: no card, pure whitespace, timed reveals ── */
    const view = el('div', { className: 'result-view-zen' });

    /* "观测报告" in tiny text at top */
    view.appendChild(el('div', { className: 'result-label-zen' }, '观测报告'));

    /* Bias — large serif, zen-emerge animation */
    view.appendChild(el('div', {
      className: 'result-bias-zen zen-emerge',
      style: { animationDelay: '0s' },
    }, '偏向 ' + r.bias));

    /* Verdict — emerges after 2s pause */
    view.appendChild(el('div', {
      className: 'result-verdict-zen zen-emerge',
      style: { animationDelay: '2s' },
    }, r.verdict));

    /* Final line — emerges after 5s (3s after verdict), italic */
    view.appendChild(el('div', {
      className: 'result-final-zen zen-emerge',
      style: { animationDelay: '5s', fontStyle: 'italic' },
    }, r.finalLine));

    /* Signals — two simple lines with generous spacing */
    if (r.signals) {
      const signals = el('div', { className: 'result-signals-zen' });
      for (const s of r.signals) {
        signals.appendChild(el('div', { className: 'result-signal-entry-zen' },
          el('div', { className: 'result-signal-label' }, s.label),
          el('div', { className: 'result-signal-value' }, s.value),
        ));
      }
      view.appendChild(signals);
    }

    /* Button: "再问一次" — plain text, no chrome, generous space below everything */
    view.appendChild(el('button', {
      className: 'btn-zen-text',
      style: { marginTop: '64px' },
      onclick: () => {
        S.optionA = ''; S.optionB = ''; S.questions = [];
        S.answers = {}; S.currentQuestion = 0; S.result = null;
        S._zenAnswered = new Set();
        location.hash = 'decide';
      },
    }, '再问一次'));

    /* No share button for Silent Signal */

    $('#app').appendChild(view);
  } else {
    /* Mystic Void: gold-bordered card */
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
        signals.appendChild(el('div', { className: 'result-signal-entry' },
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
}

// ═══════════════════════════════════════════
//  ENGINE 3: NEON ENTROPY — Full Terminal
// ═══════════════════════════════════════════

window._terminalActive = false;

let _termState = 'boot';
let _termInputBuffer = '';
let _termAcceptingInput = false;
let _termHiddenInput = null;
let _termKeydownHandler = null;

function destroyTerminal() {
  if (!window._terminalActive) return;
  window._terminalActive = false;
  _termAcceptingInput = false;
  _termInputBuffer = '';
  if (_termHiddenInput) {
    _termHiddenInput.remove();
    _termHiddenInput = null;
  }
  if (_termKeydownHandler) {
    document.removeEventListener('keydown', _termKeydownHandler);
    _termKeydownHandler = null;
  }
  $('#app').innerHTML = '';
}

function typeOutput(text, speed) {
  speed = speed || 30;
  return new Promise(function (resolve) {
    var termOutput = $('#term-output');
    if (!termOutput) { resolve(); return; }
    var line = document.createElement('div');
    line.className = 'term-line';
    termOutput.appendChild(line);
    termOutput.scrollTop = termOutput.scrollHeight;
    var i = 0;
    function type() {
      if (i < text.length) {
        line.textContent += text[i];

        /* 2% glitch chance per character */
        if (Math.random() < 0.02) {
          var terminal = $('.terminal');
          if (terminal) {
            terminal.classList.add('terminal-glitch');
            setTimeout(function () { terminal.classList.remove('terminal-glitch'); }, 150);
          }
        }

        i++;
        termOutput.scrollTop = termOutput.scrollHeight;
        setTimeout(type, speed);
      } else {
        resolve();
      }
    }
    type();
  });
}

function terminalOutput(text) {
  var termOutput = $('#term-output');
  if (!termOutput) return;
  var line = document.createElement('div');
  line.className = 'term-line';
  line.textContent = text;
  termOutput.appendChild(line);
  termOutput.scrollTop = termOutput.scrollHeight;
}

function updateTerminalPrompt() {
  var prompt = $('#term-input-line .terminal-prompt');
  if (prompt) {
    prompt.textContent = '> ' + _termInputBuffer;
  }
}

function showTerminalInput() {
  var inputLine = $('#term-input-line');
  if (inputLine) inputLine.style.display = 'flex';
  if (_termHiddenInput) {
    _termHiddenInput.style.display = 'block';
    _termHiddenInput.value = '';
    setTimeout(function () { _termHiddenInput.focus(); }, 50);
  }
  updateTerminalPrompt();
}

function hideTerminalInput() {
  var inputLine = $('#term-input-line');
  if (inputLine) inputLine.style.display = 'none';
  if (_termHiddenInput) {
    _termHiddenInput.style.display = 'none';
    _termHiddenInput.value = '';
  }
}

function advanceTerminalState(newState) {
  _termState = newState;
  _termInputBuffer = '';
  handleTerminalState();
}

async function handleTerminalState() {
  if (!window._terminalActive) return;
  _termAcceptingInput = false;
  hideTerminalInput();

  switch (_termState) {
    case 'boot':
      await runBootSequence();
      break;
    case 'theme_select':
      await typeOutput('选择模式：[M]神秘虚空  [N]霓虹熵  [S]静默信号', 30);
      _termAcceptingInput = true;
      showTerminalInput();
      break;
    case 'option_a':
      terminalOutput('');
      await typeOutput('输入决策参数：', 30);
      await typeOutput('选项A：_', 30);
      _termAcceptingInput = true;
      showTerminalInput();
      break;
    case 'option_b':
      await typeOutput('选项B：_', 30);
      _termAcceptingInput = true;
      showTerminalInput();
      break;
    case 'fetching':
      await runFetching();
      break;
    case 'sample_1':
    case 'sample_2':
    case 'sample_3':
    case 'sample_4':
      await runSampleQuestion();
      break;
    case 'processing':
      await runProcessing();
      break;
    case 'result':
      await runTerminalResult();
      break;
  }
}

async function runBootSequence() {
  terminalOutput('');
  await typeOutput('环境熵观测器 v3.4.1', 25);
  await typeOutput('正在连接现实流...', 30);
  await typeOutput('连接已建立。', 20);
  await typeOutput('正在扫描本地环境...', 30);

  /* battery */
  var batteryLine = '电量：--%';
  try {
    var bat = await navigator.getBattery();
    batteryLine = '电量：' + Math.round(bat.level * 100) + '%';
  } catch (e) { /* ignore */ }
  await typeOutput(batteryLine, 30);

  var timeLine = '本地时间：' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  await typeOutput(timeLine, 30);

  var noiseLine = '噪声基准：' + (Math.random() * 0.8 + 0.1).toFixed(3);
  await typeOutput(noiseLine, 30);

  terminalOutput('');
  advanceTerminalState('theme_select');
}

function handleTerminalInput(key, enterValue) {
  if (!_termAcceptingInput) return;

  if (key === 'Enter') {
    var value = enterValue !== undefined ? enterValue : _termInputBuffer.trim();
    _termInputBuffer = '';
    updateTerminalPrompt();

    switch (_termState) {
      case 'theme_select':
        var upper = value.toUpperCase();
        if (upper === 'M' || upper === 'N' || upper === 'S') {
          var chosenTheme = upper === 'M' ? 'mystic-void'
            : upper === 'N' ? 'neon-entropy'
            : 'silent-signal';
          setTheme(chosenTheme);

          /* If they chose a non-neon theme, exit terminal and use hash router */
          if (chosenTheme !== 'neon-entropy') {
            terminalOutput('主题：' + (chosenTheme === 'mystic-void' ? '神秘虚空' : '静默信号'));
            terminalOutput('正在退出终端...');
            destroyTerminal();
            location.hash = 'decide';
            return;
          }

          terminalOutput('主题：霓虹熵');
          advanceTerminalState('option_a');
        } else {
          terminalOutput('无效选择。请按 [M]、[N] 或 [S]。');
          _termAcceptingInput = true;
          showTerminalInput();
        }
        break;

      case 'option_a':
        S.optionA = value;
        terminalOutput('选项A：' + value);
        advanceTerminalState('option_b');
        break;

      case 'option_b':
        S.optionB = value;
        terminalOutput('选项B：' + value);
        advanceTerminalState('fetching');
        break;

      case 'sample_1':
      case 'sample_2':
      case 'sample_3':
      case 'sample_4':
        var idx = parseInt(_termState.split('_')[1]) - 1;
        var q = S.questions[idx];
        S.answers[q.id] = value;
        terminalOutput('> ' + value);
        terminalOutput('正在处理...');
        /* advance to next sample or processing */
        if (idx + 1 >= S.questions.length) {
          advanceTerminalState('processing');
        } else {
          advanceTerminalState('sample_' + (idx + 2));
        }
        break;

      case 'result':
        if (value.toUpperCase() === 'R') {
          /* restart */
          S.optionA = ''; S.optionB = ''; S.questions = [];
          S.answers = {}; S.currentQuestion = 0; S.result = null;
          $('#term-output').innerHTML = '';
          advanceTerminalState('boot');
        } else if (value.toUpperCase() === 'T') {
          /* new theme */
          destroyTerminal();
          S.optionA = ''; S.optionB = ''; S.questions = [];
          S.answers = {}; S.currentQuestion = 0; S.result = null;
          location.hash = 'theme';
        }
        break;
    }
  }
}

async function runFetching() {
  terminalOutput('');
  await typeOutput('正在生成信号采样...', 30);
  terminalOutput('种子：0x' + Math.random().toString(16).slice(2, 10).toUpperCase());
  terminalOutput('正在处理...');

  S.questions = [];
  S.answers = {};
  S.currentQuestion = 0;
  S.result = null;

  try {
    var data = await API.getQuestions(S.theme, S.optionA.trim(), S.optionB.trim());
    S.questions = data.questions;
    S.currentQuestion = 0;
    advanceTerminalState('sample_1');
  } catch (e) {
    terminalOutput('错误：' + e.message);
    terminalOutput('正在重新连接到引导...');
    setTimeout(function () { advanceTerminalState('boot'); }, 2000);
  }
}

async function runSampleQuestion() {
  var idx = parseInt(_termState.split('_')[1]) - 1;
  var q = S.questions[idx];

  terminalOutput('');
  await typeOutput('采样 ' + (idx + 1) + '/4：', 25);
  await typeOutput(q.text, 30);

  _termAcceptingInput = true;
  showTerminalInput();
}

async function runProcessing() {
  terminalOutput('');
  await typeOutput('正在计算熵偏向...', 30);
  await typeOutput('正在坍缩概率波...', 30);
  await typeOutput('现实噪声已稳定。', 30);

  try {
    var data = await API.decide(S.theme, S.optionA, S.optionB, S.answers);
    S.result = data;
    advanceTerminalState('result');
  } catch (e) {
    terminalOutput('错误：' + e.message);
    terminalOutput('正在返回引导...');
    setTimeout(function () {
      S.optionA = ''; S.optionB = ''; S.questions = [];
      S.answers = {}; S.currentQuestion = 0; S.result = null;
      $('#term-output').innerHTML = '';
      advanceTerminalState('boot');
    }, 2000);
  }
}

async function runTerminalResult() {
  var r = S.result;

  /* Build centered bias line */
  var biasText = '检测到世界偏向：' + r.bias;
  var innerWidth = 34;
  var padTotal = Math.max(0, innerWidth - biasText.length);
  var padLeft = Math.floor(padTotal / 2);
  var padRight = padTotal - padLeft;
  var biasLine = '║' + ' '.repeat(padLeft) + biasText + ' '.repeat(padRight) + '║';

  terminalOutput('');
  await typeOutput('╔' + '═'.repeat(34) + '╗', 15);
  await typeOutput(biasLine, 15);
  await typeOutput('╚' + '═'.repeat(34) + '╝', 15);
  terminalOutput('');
  terminalOutput(r.verdict);
  terminalOutput('');
  terminalOutput('"' + r.finalLine + '"');
  terminalOutput('');
  terminalOutput('─'.repeat(26));
  await typeOutput('按 [R] 重来  [T] 换主题', 25);

  _termAcceptingInput = true;
  showTerminalInput();
}

function startTerminal() {
  if (window._terminalActive) return;

  /* If coming from hash routing, update hash to something non-splash
     so the router doesn't interfere */
  if (location.hash.slice(1) !== 'splash') {
    /* already not splash, terminal keeps control */
  }

  destroyTerminal();
  window._terminalActive = true;

  /* build terminal DOM */
  var app = $('#app');
  app.innerHTML = '';

  var terminalApp = el('div', { id: 'terminal-app' });
  var terminal = el('div', { className: 'terminal' });

  var termOutput = el('div', { className: 'terminal-output', id: 'term-output' });
  terminal.appendChild(termOutput);

  var inputLine = el('div', { className: 'terminal-input-line', id: 'term-input-line' });
  inputLine.appendChild(el('span', { className: 'terminal-prompt' }, '> _'));
  inputLine.appendChild(el('span', { className: 'terminal-cursor' }));
  inputLine.style.display = 'none';
  terminal.appendChild(inputLine);

  terminalApp.appendChild(terminal);
  app.appendChild(terminalApp);

  /* hidden input — native IME works perfectly in real input fields */
  _termHiddenInput = el('input', {
    type: 'text',
    className: 'terminal-hidden-input',
    autocomplete: 'off',
    autocorrect: 'off',
    autocapitalize: 'off',
    spellcheck: false,
  });
  _termHiddenInput.style.display = 'none';
  terminalApp.appendChild(_termHiddenInput);

  /* Listen to input event for full text (IME-compatible) */
  _termHiddenInput.addEventListener('input', function () {
    if (!window._terminalActive || !_termAcceptingInput) return;
    /* Sync the hidden input value to our buffer */
    var val = _termHiddenInput.value;
    _termInputBuffer = val;
    updateTerminalPrompt();
  });

  /* Keydown only for Enter — handle special keys */
  _termKeydownHandler = function (e) {
    if (!window._terminalActive || !_termAcceptingInput) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      var value = _termHiddenInput.value.trim();
      _termHiddenInput.value = '';
      _termInputBuffer = '';
      updateTerminalPrompt();
      handleTerminalInput('Enter', value);
    }
  };
  document.addEventListener('keydown', _termKeydownHandler);

  /* start boot sequence */
  _termState = 'boot';
  _termInputBuffer = '';
  handleTerminalState();
}
