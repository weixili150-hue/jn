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
