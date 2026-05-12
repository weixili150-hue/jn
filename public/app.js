/* ═══════════════════════════════════════
   Entropy Observer — Frontend SPA
   Hash router, 6 view states, vanilla JS
   ═══════════════════════════════════════ */

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
window.addEventListener('hashchange', route);
window.addEventListener('load', () => {
  const saved = localStorage.getItem('entropy-theme');
  if (saved) setTheme(saved);
  route();
});

// ─── Theme Switcher ───
function renderNav() {
  const existing = $('#theme-switcher');
  if (existing) existing.remove();
  if (location.hash.slice(1) === 'splash') return;
  if (location.hash.slice(1) === 'loading') return;

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

// ─── ① Oracle Splash ───
function renderSplash() {
  $('#app').innerHTML = '';
  const phrases = [
    '纠结的时候，不如换个方式找答案。',
    '让世界的偶然，替你做一次决定。',
    '有时候，你只需要一个理由去选。',
    '现实中有很多你看不到的偏向。',
    '环境熵正在流动。你的选择正在靠近。',
  ];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];

  const splash = el('div', { className: 'splash' });
  splash.appendChild(el('h1', {}, phrase));
  splash.appendChild(el('p', { className: 'splash-sub' }, '通过随机环境信号，观测世界正偏向哪一边'));
  splash.appendChild(el('div', { className: 'glow-dot' }));

  $('#app').appendChild(splash);

  setTimeout(() => { location.hash = 'theme'; }, 4000);
}

// ─── ② Theme Select ───
function renderThemeSelect() {
  $('#app').innerHTML = '';

  const hour = new Date().getHours();
  const defaultTheme = hour >= 22 || hour < 6 ? 'mystic-void'
    : hour >= 18 ? 'neon-entropy'
    : 'silent-signal';

  const themes = [
    { id: 'mystic-void', name: 'Mystic Void', desc: '深夜、情感、宿命感', hint: defaultTheme === 'mystic-void' ? '当前时段推荐' : '' },
    { id: 'neon-entropy', name: 'Neon Entropy', desc: '冲动、高能量、想听狠话', hint: defaultTheme === 'neon-entropy' ? '当前时段推荐' : '' },
    { id: 'silent-signal', name: 'Silent Signal', desc: '冷静、日常、想慢慢想', hint: defaultTheme === 'silent-signal' ? '当前时段推荐' : '' },
  ];

  const view = el('div', { className: 'theme-select' });

  for (const t of themes) {
    const card = el('div', {
      className: 'theme-card' + (defaultTheme === t.id ? ' selected' : ''),
      onclick: () => {
        setTheme(t.id);
        setTimeout(() => { location.hash = 'decide'; }, 500);
      },
    });
    card.appendChild(el('h3', {}, t.name));
    card.appendChild(el('p', {}, t.desc));
    if (t.hint) card.appendChild(el('span', { className: 'hint' }, t.hint));
    view.appendChild(card);
  }

  $('#app').appendChild(view);
}

// ─── ③ A/B Decision Input ───
function renderDecision() {
  $('#app').innerHTML = '';
  const view = el('div', { className: 'decision-view' });

  view.appendChild(el('p', { className: 'decision-prompt' }, '输入你正在犹豫的两个选择'));

  const pair = el('div', { className: 'decision-pair' });

  const inputA = el('input', {
    className: 'option-input',
    type: 'text',
    placeholder: '比如：辞职',
    value: S.optionA,
    oninput: (e) => { S.optionA = e.target.value; },
  });

  const sep = el('div', { className: 'decision-separator' });
  if (S.theme === 'mystic-void') sep.textContent = '│';
  else if (S.theme === 'neon-entropy') sep.textContent = '>';
  else sep.textContent = '·';

  const inputB = el('input', {
    className: 'option-input',
    type: 'text',
    placeholder: '比如：留下',
    value: S.optionB,
    oninput: (e) => { S.optionB = e.target.value; },
  });

  pair.appendChild(inputA);
  pair.appendChild(sep);
  pair.appendChild(inputB);
  view.appendChild(pair);

  view.appendChild(el('button', {
    className: 'btn btn-primary btn-block',
    id: 'decide-btn',
    onclick: async function () {
      if (!S.optionA.trim() || !S.optionB.trim()) return;
      const btn = this;
      btn.textContent = '正在生成信号采样...';
      btn.disabled = true;
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
        btn.textContent = '开始采样';
        btn.disabled = false;
        location.hash = 'decide';
        alert(e.message);
      }
    },
  }, '开始采样'));

  $('#app').appendChild(view);
}

// ─── ④ Signal Sampling ───
function renderSample() {
  $('#app').innerHTML = '';
  const view = el('div', { className: 'sample-view' });

  if (S.currentQuestion >= S.questions.length) {
    location.hash = 'loading';
    return;
  }

  const q = S.questions[S.currentQuestion];

  // Progress dots
  const dots = el('div', { className: 'progress-dots' });
  for (let i = 0; i < S.questions.length; i++) {
    let cls = 'progress-dot';
    if (i < S.currentQuestion) cls += ' done';
    else if (i === S.currentQuestion) cls += ' current';
    dots.appendChild(el('div', { className: cls }));
  }

  const card = el('div', { className: 'question-card' });
  card.appendChild(el('div', { className: 'question-text' }, q.text));

  function answer(value) {
    S.answers[q.id] = value;
    card.classList.add('exiting');
    setTimeout(() => {
      S.currentQuestion++;
      renderSample();
    }, 400);
  }

  if (q.inputType === 'chips' && q.options) {
    const group = el('div', { className: 'chip-group' });
    for (const opt of q.options) {
      group.appendChild(el('button', {
        className: 'chip',
        onclick: () => answer(opt),
      }, opt));
    }
    card.appendChild(group);
  } else if (q.inputType === 'number') {
    const input = el('input', {
      className: 'sample-input',
      type: 'number',
      inputMode: 'numeric',
      placeholder: q.placeholder || '输入数字...',
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value) answer(input.value);
    });
    card.appendChild(input);
    card.appendChild(el('button', {
      className: 'btn btn-primary',
      style: { marginTop: '20px' },
      onclick: () => { if (input.value) answer(input.value); },
    }, '确认'));
  } else {
    // text input
    const input = el('input', {
      className: 'sample-input',
      type: 'text',
      placeholder: q.placeholder || '输入...',
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value) answer(input.value);
    });
    card.appendChild(input);
    card.appendChild(el('button', {
      className: 'btn btn-primary',
      style: { marginTop: '20px' },
      onclick: () => { if (input.value) answer(input.value); },
    }, '确认'));
  }

  view.appendChild(card);
  view.appendChild(dots);
  $('#app').appendChild(view);
}

// ─── ⑤ Loading Ritual → ⑥ Result ───
let loadingTimer = null;

function renderLoading() {
  $('#app').innerHTML = '';

  const overlay = el('div', { className: 'loading-overlay' });
  const anim = el('div', { className: 'loading-animation' });
  // Use the glow-dot as a simple loading indicator
  anim.appendChild(el('div', { className: 'glow-dot', style: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '12px', height: '12px' } }));
  overlay.appendChild(anim);

  const phrases = S.result?.loadingPhrases || [
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
  }, 3000);

  $('#app').appendChild(overlay);

  // Call decide API
  API.decide(S.theme, S.optionA, S.optionB, S.answers)
    .then((data) => {
      clearInterval(cycle);
      S.result = data;
      location.hash = 'result';
    })
    .catch((e) => {
      clearInterval(cycle);
      alert(e.message);
      location.hash = 'decide';
    });
}

// ─── ⑥ Result ───
function renderResult() {
  $('#app').innerHTML = '';
  if (!S.result) { location.hash = 'decide'; return; }

  const r = S.result;
  const view = el('div', { className: 'result-view' });

  const card = el('div', { className: 'result-card' });
  card.appendChild(el('div', { className: 'result-label' }, '环境熵观测报告'));
  card.appendChild(el('div', { className: 'result-bias' }, `世界偏向 ${r.bias}`));
  card.appendChild(el('div', { className: 'result-verdict' }, r.verdict));
  card.appendChild(el('div', { className: 'result-interpretation' }, r.interpretation));
  card.appendChild(el('div', { className: 'result-final' }, r.finalLine));

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
      S.optionA = '';
      S.optionB = '';
      S.questions = [];
      S.answers = {};
      S.currentQuestion = 0;
      S.result = null;
      location.hash = 'decide';
    },
  }, '重新决策'));

  view.appendChild(el('button', {
    className: 'btn btn-link',
    style: { marginTop: '8px' },
    onclick: () => {
      const shareText = `🔮 环境熵观测\n\n世界偏向 ${r.bias}\n"${r.finalLine}"\n\n—— 环境熵观测器`;
      if (navigator.share) {
        navigator.share({ title: '环境熵观测', text: shareText });
      } else {
        navigator.clipboard.writeText(shareText).then(() => alert('已复制分享文案'));
      }
    },
  }, '分享结果'));

  $('#app').appendChild(view);
}

// ─── Cleanup on hash change ───
window.addEventListener('hashchange', () => {
  if (loadingTimer) { clearInterval(loadingTimer); loadingTimer = null; }
});
