/* ═══════════════════════════════════════
   Engine: Neon Entropy — Illegal Terminal
   非法读取命运数据。All Chinese. No hash routing. One continuous session.
   ═══════════════════════════════════════ */

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
        S.answers[S.questions[idx].id] = value;
        terminalOutput('> ' + value);
        terminalOutput('正在处理...');

        if (idx + 1 >= S.questions.length) {
          advanceTerminalState('processing');
        } else {
          advanceTerminalState('sample_' + (idx + 2));
        }
        break;

      case 'result':
        if (value.toUpperCase() === 'R') {
          S.optionA = ''; S.optionB = ''; S.questions = [];
          S.answers = {}; S.currentQuestion = 0; S.result = null;
          $('#term-output').innerHTML = '';
          advanceTerminalState('boot');
        } else if (value.toUpperCase() === 'T') {
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

  if (r.observation) {
    terminalOutput(r.observation);
    terminalOutput('');
  }

  terminalOutput(r.verdict);

  if (r.interpretation) {
    terminalOutput('');
    terminalOutput(r.interpretation);
  }

  if (r.detail) {
    terminalOutput('');
    terminalOutput(r.detail);
  }

  terminalOutput('');
  terminalOutput('"' + r.finalLine + '"');

  if (r.signals && r.signals.length > 0) {
    terminalOutput('');
    terminalOutput('─'.repeat(26));
    for (var i = 0; i < r.signals.length; i++) {
      var s = r.signals[i];
      terminalOutput(s.label + '：' + s.value);
    }
  }

  terminalOutput('');
  terminalOutput('─'.repeat(26));
  await typeOutput('按 [R] 重来  [T] 换主题', 25);

  _termAcceptingInput = true;
  showTerminalInput();
}

function startTerminal() {
  if (window._terminalActive) return;

  destroyTerminal();
  window._terminalActive = true;

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

  /* Hidden input for native IME support */
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

  _termHiddenInput.addEventListener('input', function () {
    if (!window._terminalActive || !_termAcceptingInput) return;
    var val = _termHiddenInput.value;
    _termInputBuffer = val;
    updateTerminalPrompt();
  });

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

  _termState = 'boot';
  _termInputBuffer = '';
  handleTerminalState();
}
