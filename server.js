require('dotenv').config();
const express = require('express');
const { buildResultPrompt } = require('./prompts/entropy');
const { sampleQuestions, tweakQuestions } = require('./questions-engine');

const app = express();
const PORT = process.env.PORT || 3459;

app.use(express.json({ limit: '10kb' }));
app.use(express.static('public'));

// 结尾句黑名单（内存，重启清空）
const finalLineBlacklist = [];
const MAX_BLACKLIST = 50;

// POST /api/questions — 本地题库随机采样（可选 AI 微调）
app.post('/api/questions', async (req, res) => {
  const { theme, optionA, optionB } = req.body;

  if (!theme || !optionA || !optionB) {
    return res.status(400).json({ error: 'theme, optionA, and optionB are required' });
  }

  const validThemes = ['mystic-void', 'neon-entropy', 'silent-signal'];
  if (!validThemes.includes(theme)) {
    return res.status(400).json({ error: 'Invalid theme' });
  }

  try {
    let questions = sampleQuestions(4);

    // 可选：AI 微调
    if (process.env.ENABLE_AI_TWEAK === 'true') {
      questions = await tweakQuestions(questions);
    }

    return res.json({ questions });
  } catch (e) {
    console.error('Question sampling failed:', e.message);
    return res.status(500).json({ error: 'Signal sampling failed. Please try again.' });
  }
});

// POST /api/decide — AI 判词（带黑名单）
app.post('/api/decide', async (req, res) => {
  const { theme, optionA, optionB, answers, questions } = req.body;

  if (!theme || !optionA || !optionB || !answers) {
    return res.status(400).json({ error: 'theme, optionA, optionB, and answers are required' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI API key not configured' });
  }

  try {
    const prompt = buildResultPrompt(
      theme,
      optionA,
      optionB,
      answers,
      questions || [],
      [...finalLineBlacklist]
    );

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: prompt },
        ],
        max_tokens: 4000,
        temperature: 0.7,
        thinking: { type: 'enabled' },
        output_config: { effort: 'max' },
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

    // 记录结尾句到黑名单
    if (result.finalLine) {
      finalLineBlacklist.push(result.finalLine);
      if (finalLineBlacklist.length > MAX_BLACKLIST) {
        finalLineBlacklist.shift();
      }
    }

    return res.json(result);
  } catch (e) {
    console.error('Result generation failed:', e.message);
    return res.status(500).json({ error: 'Signal interpretation failed. The noise was too loud.' });
  }
});

app.listen(PORT, () => {
  console.log(`Entropy Observer running on http://localhost:${PORT}`);
});
