// 问题采样引擎 — 按 slot 1→2→3→4 各取1题，近期去重
const fs = require('fs');
const path = require('path');

const BANK_PATH = path.join(__dirname, 'questions-bank.json');

function loadBank() {
  return JSON.parse(fs.readFileSync(BANK_PATH, 'utf-8'));
}

// 最近 N 次采样的题目 ID 记录（FIFO），避免连续出现相同题
const recentIds = [];
const MAX_RECENT = 15;

const SLOT_NAMES = {
  1: '手机确定信号',
  2: '身体几何/穿戴信号',
  3: '空间坐标信号',
  4: '今日痕迹/社交/消费信号',
};

// 参数 n 保留但不使用，始终返回4题（每个slot各1题）
function sampleQuestions(n = 4) {
  const bank = loadBank();
  const questions = bank.questions;

  // 按 slot 分组
  const bySlot = { 1: [], 2: [], 3: [], 4: [] };
  for (const q of questions) {
    if (bySlot[q.slot]) bySlot[q.slot].push(q);
  }

  // 近期用过的 ID 集合
  const excludeSet = new Set();
  const recentWindow = recentIds.slice(-10).flat();
  for (const id of recentWindow) excludeSet.add(id);

  // 如果排除集太大（超过某个slot的80%），缩小窗口
  let effectiveExclude = excludeSet;
  for (let s = 1; s <= 4; s++) {
    const available = bySlot[s].filter(q => !excludeSet.has(q.id));
    if (available.length < bySlot[s].length * 0.2) {
      // 去重太激进，只用最近3轮
      effectiveExclude = new Set(recentIds.slice(-3).flat());
      break;
    }
  }

  // 每个 slot 随机选1题
  const selected = [];
  for (let s = 1; s <= 4; s++) {
    const pool = bySlot[s];
    const available = pool.filter(q => !effectiveExclude.has(q.id));
    const pickFrom = available.length > 0 ? available : pool;
    const picked = pickFrom[Math.floor(Math.random() * pickFrom.length)];

    // 转换为前端兼容格式
    selected.push({
      id: picked.id,
      slot: picked.slot,
      text: picked.question,
      inputType: 'text',
      placeholder: getPlaceholder(picked.slot, picked.question),
    });

    effectiveExclude.add(picked.id);
  }

  // 记录去重窗口
  recentIds.push(selected.map(q => q.id));
  if (recentIds.length > MAX_RECENT) {
    recentIds.shift();
  }

  return selected;
}

function getPlaceholder(slot, question) {
  const defaults = {
    1: '比如 37',
    2: '比如 15',
    3: '比如 2',
    4: '比如 微信',
  };
  return defaults[slot] || '';
}

module.exports = { sampleQuestions };
