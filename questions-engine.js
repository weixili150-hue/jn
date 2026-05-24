// 问题采样引擎 — 权重抖动 + 近期去重 + 可选 AI 微调
const fs = require('fs');
const path = require('path');

const BANK_PATH = path.join(__dirname, 'questions-bank.json');

function loadBank() {
  return JSON.parse(fs.readFileSync(BANK_PATH, 'utf-8'));
}

// 最近 N 次采样的问题 ID 记录（FIFO）
const recentIds = [];
const MAX_RECENT_ROUNDS = 20;
const FALLBACK_ROUNDS = 5;

// 类别权重 ±30% 随机抖动
function jitterWeights(categories) {
  const result = {};
  for (const [key, cat] of Object.entries(categories)) {
    const jitter = 0.7 + Math.random() * 0.6; // 0.7 ~ 1.3
    result[key] = cat.weight * jitter;
  }
  return result;
}

// 从指定类别中随机选取未在去重窗口内的题目
function pickFromCategory(pool, excludeSet, count) {
  const available = pool.filter(q => !excludeSet.has(q.id));
  if (available.length === 0) return [];
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function sampleQuestions(n = 4) {
  const bank = loadBank();
  const { categories, questions } = bank;

  // 按类别分组
  const byCategory = {};
  for (const cat of Object.keys(categories)) {
    byCategory[cat] = questions.filter(q => q.category === cat);
  }

  // 尝试用全窗口去重，不够则缩窗
  let excludeSet = new Set(recentIds.flat());
  if (excludeSet.size > questions.length * 0.85) {
    // 去重太激进，缩窗
    const fallback = recentIds.slice(-FALLBACK_ROUNDS);
    excludeSet = new Set(fallback.flat());
  }

  // 抖动后的权重
  const weights = jitterWeights(categories);

  // 归一化权重 → 每个类别的配额（保底 1 题/类别）
  const catKeys = Object.keys(categories);

  // 先给每个类别分配 1 题（如果可用）
  const selected = [];
  for (const cat of catKeys) {
    const pool = byCategory[cat];
    const picked = pickFromCategory(pool, excludeSet, 1);
    for (const q of picked) {
      selected.push(q);
      excludeSet.add(q.id);
    }
  }

  // 剩余名额按权重分配
  const remaining = n - selected.length;
  if (remaining > 0) {
    const alloc = catKeys.map(cat => ({
      cat,
      w: weights[cat],
    }));
    // 加权随机选取剩余题目
    for (let i = 0; i < remaining; i++) {
      const totalW = alloc.reduce((s, a) => s + a.w, 0);
      let r = Math.random() * totalW;
      for (const a of alloc) {
        r -= a.w;
        if (r <= 0) {
          const pool = byCategory[a.cat];
          const picked = pickFromCategory(pool, excludeSet, 1);
          if (picked.length > 0) {
            selected.push(picked[0]);
            excludeSet.add(picked[0].id);
          }
          break;
        }
      }
    }
  }

  // 洗牌
  const shuffled = selected.sort(() => Math.random() - 0.5).slice(0, n);

  // 记录去重窗口
  recentIds.push(shuffled.map(q => q.id));
  if (recentIds.length > MAX_RECENT_ROUNDS) {
    recentIds.shift();
  }

  return shuffled;
}

// AI 微调（可选）
async function tweakQuestions(questions) {
  if (process.env.ENABLE_AI_TWEAK !== 'true') return questions;

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return questions;

  const { buildQuestionsTweakPrompt } = require('./prompts/entropy');

  // 只微调 2 题
  const toTweak = questions.slice(0, 2);
  const toKeep = questions.slice(2);

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
          { role: 'user', content: buildQuestionsTweakPrompt(toTweak) },
        ],
        max_tokens: 1000,
        temperature: 0.8,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return questions;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return questions;

    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const tweaked = JSON.parse(jsonStr);

    if (Array.isArray(tweaked) && tweaked.length > 0) {
      return [...tweaked, ...toKeep].slice(0, questions.length);
    }
  } catch (e) {
    // 静默 fallback
  }

  return questions;
}

module.exports = { sampleQuestions, tweakQuestions };
