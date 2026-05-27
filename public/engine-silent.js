/* ═══════════════════════════════════════
   Engine: Silent Signal — Eastern Time Philosophy
   答案自己浮现。One question at a time, ink spreading, deliberate pauses.
   ═══════════════════════════════════════ */

window.Engine_Silent = {

  sample: function () {
    if (!S.questions || S.questions.length === 0) {
      location.hash = 'loading';
      return;
    }

    const view = el('div', { className: 'sample-view-zen' });
    $('#app').appendChild(view);

    _showNextZenQuestion(view, 0);
  },

  result: function () {
    const r = S.result;
    const view = el('div', { className: 'result-view-zen' });

    view.appendChild(el('div', { className: 'result-label-zen' }, '观测报告'));

    view.appendChild(el('div', {
      className: 'result-bias-zen zen-emerge',
      style: { animationDelay: '0s' },
    }, '偏向 ' + r.bias));

    if (r.observation) {
      view.appendChild(el('div', {
        className: 'result-observation-zen zen-emerge',
        style: { animationDelay: '1s' },
      }, r.observation));
    }

    view.appendChild(el('div', {
      className: 'result-verdict-zen zen-emerge',
      style: { animationDelay: '2.5s' },
    }, r.verdict));

    if (r.interpretation) {
      view.appendChild(el('div', {
        className: 'result-interpretation-zen zen-emerge',
        style: { animationDelay: '3.5s' },
      }, r.interpretation));
    }

    if (r.detail) {
      view.appendChild(el('div', {
        className: 'result-detail-zen zen-emerge',
        style: { animationDelay: '4.5s' },
      }, r.detail));
    }

    if (r.signals) {
      const signals = el('div', { className: 'result-signals-zen zen-emerge', style: { animationDelay: '5.5s' } });
      for (const s of r.signals) {
        signals.appendChild(el('div', { className: 'result-signal-entry-zen' },
          el('div', { className: 'result-signal-label' }, s.label),
          el('div', { className: 'result-signal-value' }, s.value),
        ));
      }
      view.appendChild(signals);
    }

    view.appendChild(el('div', {
      className: 'result-final-zen zen-emerge',
      style: { animationDelay: '7s', fontStyle: 'italic' },
    }, r.finalLine));

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

    $('#app').appendChild(view);
  },

};

/* ─── Internal: show one question, then the next ─── */

function _showNextZenQuestion(view, idx) {
  if (idx >= S.questions.length) {
    view.style.transition = 'opacity 2s ease';
    view.style.opacity = '0';
    setTimeout(() => { location.hash = 'loading'; }, 2500);
    return;
  }

  const q = S.questions[idx];

  /* Remove previous question */
  const oldContent = view.querySelector('.zen-moment');
  if (oldContent) {
    oldContent.style.transition = 'opacity 1.2s ease, transform 1.2s ease';
    oldContent.style.opacity = '0';
    oldContent.style.transform = 'translateY(-12px)';
    setTimeout(() => oldContent.remove(), 1200);
  }

  /* New moment */
  const moment = el('div', { className: 'zen-moment' });

  const questionText = el('div', { className: 'zen-question-emerge' }, q.text);
  moment.appendChild(questionText);

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

  /* Emerge animation */
  requestAnimationFrame(() => {
    moment.style.opacity = '1';
    moment.style.transform = 'translateY(0)';
    setTimeout(() => input.focus(), 400);
  });

  function submit(value) {
    if (!value.trim()) return;

    S.answers[q.id] = value.trim();

    const rect = input.getBoundingClientRect();
    if (window.Particles && window.Particles.inkRipple) {
      window.Particles.inkRipple(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    input.disabled = true;
    doneHint.style.transition = 'opacity 0.6s ease';
    doneHint.style.opacity = '0';

    setTimeout(() => { _showNextZenQuestion(view, idx + 1); }, 2000);
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit(input.value);
  });

  questionText.addEventListener('click', () => input.focus());
}
