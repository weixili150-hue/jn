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

    const isBridge = q.kind === 'bridge';
    const isReality = q.kind === 'reality';
    const at = q.answerType || 'short-text';

    // Bridge: show previous 3 answers
    if (isBridge) {
      const prevAnswers = [];
      for (let i = 0; i < S.currentQuestion; i++) {
        const pq = S.questions[i];
        if (pq && S.answers[pq.id]) prevAnswers.push(S.answers[pq.id]);
      }
      if (prevAnswers.length > 0) {
        const prevBox = el('div', { className: 'bridge-prev-answers' });
        prevBox.style.cssText = 'font-size:0.8125rem;color:var(--fg-muted);opacity:0.5;margin-bottom:16px;text-align:center;line-height:1.8;';
        prevBox.innerHTML = '前三个答案：<br>' + prevAnswers.map((a, i) => '<span style="margin:0 4px;color:var(--accent);">' + (i + 1) + '. ' + a + '</span>').join('  ');
        card.appendChild(prevBox);
      }
    }

    // Input based on answerType
    const input = el('input', {
      className: 'void-input-line',
      type: (at === 'integer' || at === 'short-number') ? 'number' : 'text',
      inputMode: (at === 'integer' || at === 'short-number') ? 'numeric' : 'text',
      placeholder: q.placeholder || '输入...',
      maxLength: q.maxLength || (at === 'single-character' ? 1 : 50),
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
    }, '记录'));

    // "换一题" only for reality
    if (isReality) {
      card.appendChild(el('button', {
        className: 'btn btn-link',
        style: { marginTop: '12px', fontSize: '0.75rem', opacity: 0.4 },
        onclick: async () => {
          // Request new question from server
          try {
            const data = await API.getQuestions(S.theme, S.optionA, S.optionB);
            const newQ = data.questions[S.currentQuestion];
            if (newQ && newQ.id !== q.id) {
              S.questions[S.currentQuestion] = newQ;
            }
          } catch(e) {}
          // Re-render
          S.answers[q.id] = undefined;
          window.Engine_Mystic.sample();
        },
      }, '无法查看，换一题'));
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
