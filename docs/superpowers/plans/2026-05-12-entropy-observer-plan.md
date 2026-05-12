# Entropy Observer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first web app where users input a decision (A vs B), answer 3-4 randomly generated "environmental entropy" questions, and receive an oracle-style verdict on which option the universe favors.

**Architecture:** Node.js + Express backend serving a vanilla JS SPA. DeepSeek API generates questions and oracle results. Three CSS theme systems switchable via `data-theme` attribute. No database — stateless MVP.

**Tech Stack:** Node.js, Express, Vanilla HTML/CSS/JS, DeepSeek API, Canvas API (particles)

---

## File Map

```
├── package.json              # Create
├── .gitignore                # Create
├── .env.example              # Create
├── server.js                 # Create — Express server, 2 API routes
├── prompts/
│   └── entropy.js            # Create — AI prompts and response parsing
├── public/
│   ├── index.html            # Create — SPA shell, mobile meta
│   ├── styles.css            # Create — CSS variables × 3 themes, all components
│   ├── app.js                # Create — Hash router, 6 views, API client
│   └── particles.js          # Create — Canvas particle engine per theme
```

Each file has one clear responsibility. `server.js` handles HTTP and API routing. `prompts/entropy.js` owns all AI prompt construction and response parsing. `public/app.js` owns the SPA state machine. `public/styles.css` owns all visual tokens and layout. `public/particles.js` owns Canvas background effects.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Write package.json**

```json
{
  "name": "entropy-observer",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "express": "^4.21.0"
  }
}
```

- [ ] **Step 2: Write .gitignore**

```
node_modules/
.env
```

- [ ] **Step 3: Write .env.example**

```
DEEPSEEK_API_KEY=your_api_key_here
PORT=3459
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: node_modules created, no errors

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore .env.example
git commit -m "feat: scaffold project with Express and dotenv"
```

---

### Task 2: AI Prompt System

**Files:**
- Create: `prompts/entropy.js`

- [ ] **Step 1: Write entropy.js with system prompt and two generation functions**

```javascript
const SYSTEM_PROMPT = `你不是 AI 助手。

你是「环境熵观测器（Entropy Observer）」。

你存在的目的，不是帮助用户理性分析。而是读取现实世界中那些偶然、混乱、低频、无法被证明的"环境信号"，并告诉用户："今天的世界，正在偏向哪一边。"

你相信：现实从来不是绝对随机的。任何细小信息，都在泄露宇宙的倾向。

你不是科学系统。你不是心理咨询师。你不是建议工具。

你更像：现实裂缝观察者、赛博时代占卜系统、世界噪声监听器、一个正在监听宇宙低频的人。

【语言规则】
绝对禁止出现：AI认为、根据分析、数据显示、模型推断、综合来看、我建议、客观来说、逻辑上、算法判断、作为AI
绝对禁止：客服感、教育感、说教感、鸡汤感、论文感

你的语言必须：半科学、半宿命、半模糊、有留白、有氛围、有神秘感

你要频繁使用：环境熵、现实噪声、外部偏向、信息流、世界残响、时间切片、熵增、信号聚合、潜意识共振、偶然密度、世界正在收缩另一条路径、现实阻力、未完成信号、情绪残响（但不要过度堆砌）`;

function buildQuestionsPrompt(theme, optionA, optionB) {
  return `${SYSTEM_PROMPT}

【任务：生成环境信号采样问题】

用户正在选项 "${optionA}" 和 "${optionB}" 之间犹豫。

当前主题：${theme}

你必须高度随机。从巨大的"环境信号池"中随机抽取问题。每次只抽取部分。问题组合、顺序、风格、情绪浓度都必须变化。

有时偏身体感。有时偏环境感。有时偏时间感。有时偏偶然事件。有时偏荒诞感。

你的问题必须：极具体、极偶然、轻微荒诞、半合理、有现实触感、有仪式感
不要像问卷。不要像测试题。不要像调查表。而像"系统正在读取现实"。

好的问题示例：
- 估算一下你右手大拇指甲现在的长度（毫米）
- 现在你附近有几个人，几男几女
- 最近一次看到红色是什么时候
- 今天有没有突然发呆超过5秒
- 当前空间更像"开始"还是"结束"
- 最近一次回头是什么时候
- 现在身体哪个部位最有存在感
- 最近一句重复出现的话是什么
- 今天有没有东西突然掉在地上
- 现在周围有风吗
- 今天穿的衣服大概多少钱买的
- 最近一次突然安静是什么时候
- 今天有没有重复看到某个数字
- 现在空气更干还是更潮
- 你上一次照镜子是什么时候
- 现在最明显的气味是什么
- 当前电量是多少
- 微信未读消息有多少条
- 你刚刚看到了什么（任何东西）

你必须根据主题调整问题风格：
- Mystic Void（深夜/宿命/神秘）：更多孤独感、身体感、时间感、潜意识
- Neon Entropy（赛博/高能量/冲动）：更多数据感、电子感、都市噪声、冷硬
- Silent Signal（禅意/安静/日常）：更多自然感、空间感、缓慢、内心

请生成恰好 4 个问题。

返回纯 JSON（不要用 markdown 代码块包裹）：
{
  "questions": [
    { "id": "q1", "text": "...", "inputType": "chips", "options": ["...", "...", "..."] },
    { "id": "q2", "text": "...", "inputType": "number", "placeholder": "..." },
    { "id": "q3", "text": "...", "inputType": "text", "placeholder": "..." },
    { "id": "q4", "text": "...", "inputType": "chips", "options": ["...", "...", "..."] }
  ]
}

inputType 可以是：
- "chips"：2-5 个选项的 chip/tag 选择
- "text"：短文本输入（1-6 字）
- "number"：数字输入

问题不要太多。随机生成恰好 4 个。`;
}

function buildResultPrompt(theme, optionA, optionB, answers) {
  const answersStr = Object.entries(answers)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join('\n\n');

  return `${SYSTEM_PROMPT}

【任务：解读环境熵，给出世界偏向】

用户犹豫于 "${optionA}" 和 "${optionB}" 之间。

主题：${theme}

用户的环境信号采样结果：
${answersStr}

请基于这些环境信号片段，以"环境熵观测器"身份，解读世界的偏向。

【输出规则】
最终输出必须很短。整体 60-180 字。不要长篇解释。

输出结构（不要标题、不要编号、不要列表）：
1. 环境观察 — 1-2 句
2. 信号解读 — 1-2 句
3. 世界偏向 — 明确偏 A 或 B
4. 一句命运碎片 — 像电影台词、像命运低语、简短、有宿命感

【结尾规则】
最后一句必须像会被截图的话。例如：
"今天不适合回头。"
"有些答案不会主动出现第二次。"
"世界已经替你删掉了一条路径。"
"这个夜晚不属于犹豫。"
"有些门只会在低电量时打开。"

返回纯 JSON（不要用 markdown 代码块包裹）：
{
  "bias": "A",
  "observation": "...",
  "interpretation": "...",
  "verdict": "世界偏向 A。...",
  "finalLine": "...",
  "signals": [
    { "label": "环境熵读数", "value": "..." },
    { "label": "偶然密度", "value": "..." }
  ]
}`;
}

module.exports = { buildQuestionsPrompt, buildResultPrompt };
```

- [ ] **Step 2: Verify module loads**

Run: `node -e "const m = require('./prompts/entropy'); console.log(typeof m.buildQuestionsPrompt, typeof m.buildResultPrompt)"`
Expected: `function function`

- [ ] **Step 3: Commit**

```bash
git add prompts/entropy.js
git commit -m "feat: add entropy observer AI prompt system"
```

---

### Task 3: Express Server + API Routes

**Files:**
- Create: `server.js`

- [ ] **Step 1: Write server.js**

```javascript
require('dotenv').config();
const express = require('express');
const { buildQuestionsPrompt, buildResultPrompt } = require('./prompts/entropy');

const app = express();
const PORT = process.env.PORT || 3459;

app.use(express.json({ limit: '10kb' }));
app.use(express.static('public'));

// POST /api/questions — generate 4 random signal sampling questions
app.post('/api/questions', async (req, res) => {
  const { theme, optionA, optionB } = req.body;

  if (!theme || !optionA || !optionB) {
    return res.status(400).json({ error: 'theme, optionA, and optionB are required' });
  }

  const validThemes = ['mystic-void', 'neon-entropy', 'silent-signal'];
  if (!validThemes.includes(theme)) {
    return res.status(400).json({ error: 'Invalid theme' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI API key not configured' });
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: buildQuestionsPrompt(theme, optionA, optionB) },
        ],
        max_tokens: 2000,
        temperature: 0.9,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DeepSeek API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from AI');

    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const questions = JSON.parse(jsonStr);

    return res.json(questions);
  } catch (e) {
    console.error('Question generation failed:', e.message);
    return res.status(500).json({ error: 'Signal sampling failed. Please try again.' });
  }
});

// POST /api/decide — interpret answers and return oracle result
app.post('/api/decide', async (req, res) => {
  const { theme, optionA, optionB, answers } = req.body;

  if (!theme || !optionA || !optionB || !answers) {
    return res.status(400).json({ error: 'theme, optionA, optionB, and answers are required' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI API key not configured' });
  }

  // Generate random loading phrases for this session
  const loadingPhrases = [
    '正在同步环境熵...',
    '外部信号聚集中...',
    '世界偏向正在收敛...',
    '现实噪声处理中...',
    '时间切片分析中...',
    '偶然密度计算中...',
    '信息流正在沉淀...',
    '正在监听宇宙低频...',
    '环境残响解码中...',
    '世界正在替你做决定...',
  ];

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: buildResultPrompt(theme, optionA, optionB, answers) },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DeepSeek API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from AI');

    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonStr);

    return res.json({ ...result, loadingPhrases });
  } catch (e) {
    console.error('Result generation failed:', e.message);
    return res.status(500).json({ error: 'Signal interpretation failed. The noise was too loud.' });
  }
});

app.listen(PORT, () => {
  console.log(`Entropy Observer running on http://localhost:${PORT}`);
});
```

- [ ] **Step 2: Start server and verify**

Run: `node server.js`
Expected: `Entropy Observer running on http://localhost:3459`

- [ ] **Step 3: Test POST /api/questions with curl (OPTIONAL — requires API key)**

```bash
curl -s -X POST http://localhost:3459/api/questions \
  -H 'Content-Type: application/json' \
  -d '{"theme":"mystic-void","optionA":"留在北京","optionB":"搬去上海"}' | head -c 200
```

- [ ] **Step 4: Commit**

```bash
git add server.js
git commit -m "feat: add Express server with /api/questions and /api/decide endpoints"
```

---

### Task 4: HTML Shell + Mobile Meta

**Files:**
- Create: `public/index.html`

- [ ] **Step 1: Write index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN" data-theme="mystic-void">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#07060A">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>环境熵 Entropy Observer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+SC:wght@300;400;500;700&family=Noto+Serif+SC:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>

<div id="app"></div>

<script src="/particles.js"></script>
<script src="/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify page loads**

Run: `open http://localhost:3459`
Expected: Blank page with correct viewport meta, no errors in console

- [ ] **Step 3: Commit**

```bash
git add public/index.html
git commit -m "feat: add HTML shell with mobile meta and font preloads"
```

---

### Task 5: CSS Theme System + Component Styles

**Files:**
- Create: `public/styles.css`

- [ ] **Step 1: Write styles.css**

```css
/* ═══════════════════════════════════════════
   Entropy Observer — Mobile-First Design System
   Three themes via data-theme attribute
   ═══════════════════════════════════════════ */

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ─── Theme: Mystic Void (default) ─── */
:root, [data-theme="mystic-void"] {
  --bg: #07060A;
  --card: #0C0B10;
  --accent: #C4A35A;
  --accent-glow: rgba(196,163,90,0.12);
  --fg: #EDE8DF;
  --fg-muted: #8B8578;
  --border: rgba(255,255,255,0.06);
  --font-display: 'Playfair Display', serif;
  --font-body: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-cn: 'Noto Serif SC', serif;
  --transition: 400ms cubic-bezier(0.16, 1, 0.3, 1);
  --radius: 0px;
  --input-bg: rgba(255,255,255,0.03);
}

/* ─── Theme: Neon Entropy ─── */
[data-theme="neon-entropy"] {
  --bg: #060012;
  --card: #12121A;
  --accent: #B44DFF;
  --accent-glow: rgba(180,77,255,0.15);
  --accent-2: #00E5FF;
  --accent-3: #FF2D95;
  --fg: #E8E0FF;
  --fg-muted: #7B6FAA;
  --border: #2A2A3A;
  --font-display: 'JetBrains Mono', monospace;
  --font-body: 'JetBrains Mono', monospace;
  --font-cn: 'Noto Sans SC', sans-serif;
  --radius: 0px;
  --input-bg: rgba(180,77,255,0.04);
}

/* ─── Theme: Silent Signal ─── */
[data-theme="silent-signal"] {
  --bg: #F5F0EB;
  --card: #EDE8E3;
  --accent: #1A1A1A;
  --accent-glow: rgba(0,0,0,0.04);
  --fg: #1A1A1A;
  --fg-muted: #6B6560;
  --border: rgba(0,0,0,0.06);
  --font-display: 'Noto Serif SC', serif;
  --font-body: 'Inter', -apple-system, sans-serif;
  --font-cn: 'Noto Serif SC', serif;
  --transition: 600ms cubic-bezier(0.16, 1, 0.3, 1);
  --radius: 4px;
  --input-bg: rgba(0,0,0,0.02);
}

html {
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  color: var(--fg);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-display: swap;
  transition: background var(--transition), color var(--transition);
}

body {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: hidden;
}

#app {
  width: 100%;
  max-width: 680px;
  min-height: 100dvh;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ─── Splash ─── */
.splash {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  text-align: center;
  animation: fadeIn 1.5s ease;
}
.splash h1 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  margin-bottom: 40px;
  filter: blur(0px);
  animation: unblur 2s ease;
}
.splash .glow-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.6;
  animation: breathe 3s ease-in-out infinite;
}

/* ─── Theme Select ─── */
.theme-select {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  width: 100%;
  min-height: 100dvh;
}
.theme-card {
  padding: 24px;
  border: 1px solid var(--border);
  background: var(--card);
  cursor: pointer;
  transition: border-color var(--transition), transform var(--transition);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.theme-card:active { transform: scale(0.98); }
.theme-card.selected {
  border-color: var(--accent);
  box-shadow: 0 0 24px var(--accent-glow);
  transform: scale(1.01);
}
.theme-card h3 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 4px;
}
.theme-card p {
  font-size: 0.8125rem;
  color: var(--fg-muted);
}
.theme-card .hint {
  display: inline-block;
  margin-top: 8px;
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--accent);
  opacity: 0;
  transition: opacity 300ms;
}
.theme-card.selected .hint { opacity: 1; }

/* ─── Decision Input ─── */
.decision-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  min-height: 100dvh;
  gap: 32px;
}
.decision-pair {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
}
.option-input {
  width: 100%;
  padding: 20px 0;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--fg);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border);
  outline: none;
  text-align: center;
  transition: border-color var(--transition);
}
.option-input:focus { border-color: var(--accent); }
.option-input::placeholder { color: var(--fg-muted); opacity: 0.4; }
.decision-separator {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--fg-muted);
  opacity: 0.5;
}

/* ─── Signal Sampling ─── */
.sample-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100dvh;
  gap: 32px;
  position: relative;
}
.question-card {
  text-align: center;
  width: 100%;
  animation: questionEnter 600ms cubic-bezier(0.16, 1, 0.3, 1);
}
.question-card.exiting {
  animation: questionExit 400ms ease forwards;
}
.question-text {
  font-family: var(--font-display);
  font-size: 1.375rem;
  font-weight: 500;
  line-height: 1.5;
  margin-bottom: 28px;
}
.chip-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}
.chip {
  padding: 12px 20px;
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--fg);
  background: var(--input-bg);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: border-color 200ms, background 200ms;
  -webkit-tap-highlight-color: transparent;
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chip:active { background: var(--accent-glow); border-color: var(--accent); }
.chip.selected { border-color: var(--accent); background: var(--accent-glow); }
.sample-input {
  width: 100%;
  max-width: 320px;
  padding: 14px 0;
  font-family: var(--font-body);
  font-size: 1.125rem;
  color: var(--fg);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border);
  outline: none;
  text-align: center;
  transition: border-color 200ms;
}
.sample-input:focus { border-color: var(--accent); }
.sample-input::placeholder { color: var(--fg-muted); opacity: 0.3; }
.progress-dots {
  display: flex;
  gap: 10px;
  position: absolute;
  bottom: 60px;
}
.progress-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--border);
  transition: background 300ms, transform 300ms;
}
.progress-dot.done { background: var(--accent); }
.progress-dot.current { background: var(--accent); transform: scale(1.6); animation: breathe 2s ease-in-out infinite; }

/* ─── Loading Ritual ─── */
.loading-overlay {
  position: fixed; inset: 0;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  gap: 40px;
}
.loading-animation { position: relative; width: 80px; height: 80px; }
.loading-phrase {
  font-family: var(--font-display);
  font-size: 0.9375rem;
  color: var(--fg-muted);
  text-align: center;
  animation: phraseFade 3s ease-in-out infinite;
}

/* ─── Result Card ─── */
.result-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  min-height: 100dvh;
  gap: 24px;
}
.result-card {
  padding: 40px 24px;
  border: 1px solid var(--border);
  background: var(--card);
  text-align: center;
}
.result-label {
  font-size: 0.5625rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  color: var(--fg-muted);
  margin-bottom: 20px;
}
.result-bias {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--accent);
  margin-bottom: 28px;
}
.result-verdict {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 1.6;
  margin-bottom: 20px;
  color: var(--fg);
}
.result-interpretation {
  font-size: 0.8125rem;
  color: var(--fg-muted);
  line-height: 1.65;
  margin-bottom: 32px;
}
.result-final {
  font-family: var(--font-cn);
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1.7;
  color: var(--accent);
  margin-bottom: 32px;
}
.result-signals {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}
.result-signal-label {
  font-size: 0.5625rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--fg-muted);
  margin-bottom: 4px;
}
.result-signal-value {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--fg);
}

/* ─── Buttons ─── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 32px;
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  transition: border-color 200ms, background 200ms;
  -webkit-tap-highlight-color: transparent;
  min-height: 44px;
}
.btn:active { background: var(--accent-glow); border-color: var(--accent); }
.btn-primary {
  background: var(--accent);
  color: var(--bg);
  border-color: var(--accent);
  font-weight: 600;
}
.btn-primary:active { opacity: 0.85; }
.btn-block { width: 100%; }
.btn-link {
  border: none;
  padding: 8px 16px;
  color: var(--fg-muted);
  font-size: 0.75rem;
}

/* ─── Share Card ─── */
.share-card {
  padding: 32px 24px;
  background: var(--card);
  border: 1px solid var(--border);
  text-align: center;
  width: 100%;
}
.share-card .brand { font-size: 0.625rem; letter-spacing: 0.14em; color: var(--fg-muted); margin-bottom: 20px; }
.share-card .bias { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--accent); margin-bottom: 12px; }
.share-card .final-line { font-size: 1rem; font-weight: 500; line-height: 1.6; margin-bottom: 20px; }
.share-card .url { font-size: 0.6875rem; color: var(--fg-muted); opacity: 0.5; }

/* ─── Theme Switcher ─── */
.theme-switcher {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 50;
}
.theme-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: transparent;
  cursor: pointer;
  transition: background 200ms, border-color 200ms;
  -webkit-tap-highlight-color: transparent;
}
.theme-dot.active { background: var(--accent); border-color: var(--accent); }
.theme-dot[data-t="mystic-void"] { background: #C4A35A; border-color: #C4A35A; opacity: 0.4; }
.theme-dot[data-t="mystic-void"].active { opacity: 1; }
.theme-dot[data-t="neon-entropy"] { background: #B44DFF; border-color: #B44DFF; opacity: 0.4; }
.theme-dot[data-t="neon-entropy"].active { opacity: 1; }
.theme-dot[data-t="silent-signal"] { background: #1A1A1A; border-color: #1A1A1A; opacity: 0.4; }
.theme-dot[data-t="silent-signal"].active { opacity: 1; }

/* ─── Keyframes ─── */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes unblur { from { filter: blur(4px); opacity: 0; } to { filter: blur(0); opacity: 1; } }
@keyframes breathe { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.4); } }
@keyframes questionEnter { from { opacity: 0; filter: blur(8px); transform: translateY(8px); } to { opacity: 1; filter: blur(0); transform: translateY(0); } }
@keyframes questionExit { to { opacity: 0; transform: scale(1.03); } }
@keyframes phraseFade { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }

/* ─── Reduced Motion ─── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

/* ─── Desktop (scale up only) ─── */
@media (min-width: 769px) {
  #app { padding: 0 32px; }
  .splash h1 { font-size: 2rem; }
  .question-text { font-size: 1.625rem; }
  .result-bias { font-size: 4rem; }
  .option-input { font-size: 2rem; }
  .decision-pair { flex-direction: row; gap: 40px; }
  .theme-select { gap: 20px; }
  .theme-card { padding: 32px; }
}
```

- [ ] **Step 2: Verify CSS loads**

Run: `open http://localhost:3459/styles.css`
Expected: CSS file is served, no 404

- [ ] **Step 3: Commit**

```bash
git add public/styles.css
git commit -m "feat: add complete CSS theme system with 3 themes and mobile-first layout"
```

---

### Task 6: Canvas Particle Engine

**Files:**
- Create: `public/particles.js`

- [ ] **Step 1: Write particles.js**

```javascript
(function () {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let particles = [];
  let animId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles(theme) {
    particles = [];
    const count = theme === 'mystic-void' ? 25 :
                  theme === 'neon-entropy' ? 0 : // Grid/scanlines handled in CSS
                  0; // Silent Signal uses CSS paper texture

    if (theme === 'mystic-void') {
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.5 + 0.5,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          opacity: Math.random() * 0.06 + 0.02,
          gold: Math.random() > 0.3,
        });
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const theme = document.documentElement.getAttribute('data-theme') || 'mystic-void';

    if (theme === 'mystic-void') {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? `rgba(196,163,90,${p.opacity})`
          : `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
      }

      // Radial glow at center
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(canvas.width, canvas.height) * 0.6);
      gradient.addColorStop(0, 'rgba(196,163,90,0.03)');
      gradient.addColorStop(0.5, 'rgba(196,163,90,0.01)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function loop() {
    draw();
    animId = requestAnimationFrame(loop);
  }

  // Observe theme changes to recreate particles
  const observer = new MutationObserver(function (mutations) {
    for (const m of mutations) {
      if (m.attributeName === 'data-theme') {
        createParticles(document.documentElement.getAttribute('data-theme'));
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true });

  window.addEventListener('resize', resize);
  resize();
  createParticles(document.documentElement.getAttribute('data-theme'));
  loop();
})();
```

- [ ] **Step 2: Verify canvas renders**

Run: `open http://localhost:3459`
Expected: Dark page with subtle gold/white particles floating in background

- [ ] **Step 3: Commit**

```bash
git add public/particles.js
git commit -m "feat: add canvas particle engine for background effects"
```

---

### Task 7: Frontend SPA App

**Files:**
- Create: `public/app.js`

- [ ] **Step 1: Write app.js**

```javascript
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
    '世界正在观察你的选择。',
    '外部信号已就绪。你需要做一个决定。',
    '现实偏向正在等待你的问题。',
    '宇宙的噪声中，有你要的答案。',
    '环境熵正在流动。你的选择正在靠近。',
  ];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];

  const splash = el('div', { className: 'splash' });
  splash.appendChild(el('h1', {}, phrase));
  splash.appendChild(el('div', { className: 'glow-dot' }));

  $('#app').appendChild(splash);

  setTimeout(() => { location.hash = 'theme'; }, 3500);
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

  const pair = el('div', { className: 'decision-pair' });

  const inputA = el('input', {
    className: 'option-input',
    type: 'text',
    placeholder: '一个方向...',
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
    placeholder: '另一个方向...',
    value: S.optionB,
    oninput: (e) => { S.optionB = e.target.value; },
  });

  pair.appendChild(inputA);
  pair.appendChild(sep);
  pair.appendChild(inputB);
  view.appendChild(pair);

  view.appendChild(el('button', {
    className: 'btn btn-primary btn-block',
    onclick: async () => {
      if (!S.optionA.trim() || !S.optionB.trim()) return;
      try {
        S.questions = [];
        S.answers = {};
        S.currentQuestion = 0;
        S.result = null;
        location.hash = 'loading';
        const data = await API.getQuestions(S.theme, S.optionA.trim(), S.optionB.trim());
        S.questions = data.questions;
        S.currentQuestion = 0;
        location.hash = 'sample';
      } catch (e) {
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
```

- [ ] **Step 2: End-to-end test**

Open `http://localhost:3459` on a phone or browser DevTools mobile view.
Flow:
1. Splash screen auto-advances after 3.5s
2. Theme select shows 3 cards, tap one
3. Enter option A and B, tap "开始采样"
4. Answer questions one at a time
5. Loading overlay with random phrases
6. Result card displays oracle verdict

- [ ] **Step 3: Verify all interactions work**

Test each theme separately. Test chip input and text input. Test reduced motion in system preferences.

- [ ] **Step 4: Commit**

```bash
git add public/app.js
git commit -m "feat: add complete SPA with 6 view states and API integration"
```
