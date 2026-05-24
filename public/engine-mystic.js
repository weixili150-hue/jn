/* ═══════════════════════════════════════
   Engine: Mystic Void — Cosmic Whisper System
   向宇宙提交犹豫。Deep space, gold accents, dissolve transitions.
   ═══════════════════════════════════════ */

window.Engine_Mystic = {

  sample: function () {
    if (S.currentQuestion >= S.questions.length) {
      location.hash = 'loading';
      return;
    }

    const q = S.questions[S.currentQuestion];
    const view = el('div', { className: 'sample-view' });

    const entryAnim = 'anim-voidUnblur';
    const cardCls = 'question-card ' + entryAnim;
    const card = el('div', { className: cardCls });

    card.appendChild(el('div', { className: 'question-text' }, q.text));

    function answer(value) {
      S.answers[q.id] = value;

      card.classList.remove(entryAnim);
      card.classList.add('void-dissolve');
      setTimeout(() => {
        if (card.parentNode) card.remove();
        setTimeout(() => {
          S.currentQuestion++;
          window.Engine_Mystic.sample();
        }, 1500);
      }, 600);
    }

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

    /* Progress — 4 faint stars */
    const progress = el('div', { className: 'void-star-progress' });
    for (let i = 0; i < S.questions.length; i++) {
      const starCls = i < S.currentQuestion ? 'void-star-lit' : 'void-star';
      progress.appendChild(el('div', { className: starCls }));
    }
    view.appendChild(progress);

    view.appendChild(card);
    $('#app').appendChild(view);
  },

  result: function () {
    const r = S.result;
    const view = el('div', { className: 'result-view' });
    const card = el('div', { className: 'result-card-void' });

    card.appendChild(el('div', { className: 'result-label' }, '环境熵观测报告'));
    card.appendChild(el('div', { className: 'result-bias-void' }, '世界偏向 ' + r.bias));

    if (r.observation) {
      card.appendChild(el('div', { className: 'result-observation' }, r.observation));
    }
    card.appendChild(el('div', { className: 'result-verdict' }, r.verdict));
    if (r.interpretation) {
      card.appendChild(el('div', { className: 'result-interpretation' }, r.interpretation));
    }
    if (r.detail) {
      card.appendChild(el('div', { className: 'result-detail' }, r.detail));
    }
    card.appendChild(el('div', { className: 'result-final-void' }, r.finalLine));

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
  },

};
