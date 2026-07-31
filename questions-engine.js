// 问题采样引擎 — 3现实(不同来源) + 1抽象
const fs = require('fs');
const path = require('path');

const BANK_PATH = path.join(__dirname, 'questions-bank.json');
const ABSTRACT_PATH = path.join(__dirname, 'question-bank', 'abstract-active.json');

let _abstractCache = null;
function loadAbstract() {
  if (!_abstractCache) {
    _abstractCache = JSON.parse(fs.readFileSync(ABSTRACT_PATH, 'utf-8'));
  }
  return _abstractCache;
}

function loadBank() {
  return JSON.parse(fs.readFileSync(BANK_PATH, 'utf-8'));
}

const recentRealityIds = [];
const recentAbstractIds = [];
const MAX_RECENT = 15;

function sampleQuestions(n = 4) {
  const bank = loadBank();
  const realityQuestions = bank.questions;
  const abstractQuestions = loadAbstract();

  // 按来源分组现实题
  const bySource = {};
  for (const q of realityQuestions) {
    if (!bySource[q.category]) bySource[q.category] = [];
    bySource[q.category].push(q);
  }

  // 近期去重
  const excludeR = new Set(recentRealityIds.slice(-10).flat());
  const excludeA = new Set(recentAbstractIds.slice(-5).flat());

  // 选3道现实题，来源不同
  const selected = [];
  const usedSources = [];

  for (let i = 0; i < 3; i++) {
    const available = realityQuestions.filter(q => {
      if (usedSources.includes(q.category)) return false;
      if (excludeR.has(q.id)) return false;
      return true;
    });

    let pickFrom = available.length > 0 ? available
      : realityQuestions.filter(q => !usedSources.includes(q.category));

    if (pickFrom.length === 0) pickFrom = realityQuestions;
    const picked = pickFrom[Math.floor(Math.random() * pickFrom.length)];

    selected.push({
      id: picked.id,
      category: picked.category,
      text: picked.text,
      inputType: picked.inputType || 'text',
      placeholder: picked.placeholder || '输入答案',
      maxLength: picked.maxLength || 4,
    });

    usedSources.push(picked.category);
    excludeR.add(picked.id);
  }

  // 选1道抽象题
  const availA = abstractQuestions.filter(q => !excludeA.has(q.id));
  const pickA = availA.length > 0 ? availA : abstractQuestions;
  const apicked = pickA[Math.floor(Math.random() * pickA.length)];

  selected.push({
    id: apicked.id,
    category: 'abstract',
    text: apicked.prompt,
    inputType: apicked.answerType === 'single-character' ? 'text' : (apicked.answerType === 'short-number' ? 'number' : 'text'),
    placeholder: apicked.placeholder || '输入答案',
    maxLength: apicked.maxLength || 4,
  });

  // 记录去重
  recentRealityIds.push(selected.slice(0, 3).map(q => q.id));
  recentAbstractIds.push(apicked.id);
  if (recentRealityIds.length > MAX_RECENT) recentRealityIds.shift();
  if (recentAbstractIds.length > MAX_RECENT) recentAbstractIds.shift();

  return selected;
}

module.exports = { sampleQuestions };
