/**
 * 问题采样引擎 v2 — 新500题库
 * 3现实切片 + 1轻抽象承接，按 category 去重
 */
const fs = require('fs');
const path = require('path');

const BANK_DIR = path.join(__dirname, 'data', 'questions');
const QUESTION_BANK_VERSION = 'v2-new-500';

function loadJSON(filename) {
  const p = path.join(BANK_DIR, filename);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

// 缓存
let _realityActive = null, _realityBackup = null, _bridgeActive = null, _bridgeBackup = null;
function getPool(type) {
  if (type === 'reality-active') { if (!_realityActive) _realityActive = loadJSON('reality-active.json'); return _realityActive; }
  if (type === 'reality-backup') { if (!_realityBackup) _realityBackup = loadJSON('reality-backup.json'); return _realityBackup; }
  if (type === 'bridge-active') { if (!_bridgeActive) _bridgeActive = loadJSON('bridge-active.json'); return _bridgeActive; }
  if (type === 'bridge-backup') { if (!_bridgeBackup) _bridgeBackup = loadJSON('bridge-backup.json'); return _bridgeBackup; }
  return [];
}

// 去重窗口
const recentRealityIds = [];
const recentBridgeIds = [];
const MAX_RECENT = 15;

function pick(arr, excludeIds, excludeCategories, maxLookupCost) {
  let pool = arr;
  if (excludeIds && excludeIds.length > 0) {
    const s = new Set(excludeIds);
    pool = pool.filter(q => !s.has(q.id));
  }
  if (excludeCategories && excludeCategories.length > 0) {
    const s = new Set(excludeCategories);
    pool = pool.filter(q => !s.has(q.category));
  }
  if (maxLookupCost !== undefined) {
    pool = pool.filter(q => (q.lookupCost || 2) <= maxLookupCost);
  }
  if (pool.length === 0) pool = arr.filter(q => !(new Set(excludeCategories || [])).has(q.category));
  if (pool.length === 0) pool = arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

function sampleQuestions(n = 4) {
  const rActive = getPool('reality-active');
  const rBackup = getPool('reality-backup');
  const bActive = getPool('bridge-active');
  const bBackup = getPool('bridge-backup');

  const allReality = [...rActive, ...rBackup];
  const allBridge = [...bActive, ...bBackup];

  const excludeR = new Set(recentRealityIds.slice(-10).flat());
  const excludeB = new Set(recentBridgeIds.slice(-5).flat());
  const usedCategories = [];
  const selected = [];
  let highCostCount = 0;

  // 3 reality questions
  for (let i = 0; i < 3; i++) {
    // 第3题如果前两题都低lookupCost，可以允许一道高cost
    const maxLC = (i < 2 || highCostCount >= 1) ? 2 : 5;

    const pool = allReality.filter(q => {
      if (usedCategories.includes(q.category)) return false;
      if (excludeR.has(q.id)) return false;
      if (q.status === 'rejected') return false;
      if ((q.lookupCost || 2) > maxLC) return false;
      return true;
    });

    let pickFrom = pool.length > 0 ? pool
      : allReality.filter(q => !usedCategories.includes(q.category) && q.status !== 'rejected');

    if (pickFrom.length === 0) pickFrom = allReality.filter(q => q.status !== 'rejected');
    const picked = pickFrom[Math.floor(Math.random() * pickFrom.length)];

    if ((picked.lookupCost || 2) > 2) highCostCount++;

    selected.push({
      id: picked.id, kind: 'reality', category: picked.category,
      text: picked.prompt,
      answerType: picked.answerType || 'short-text',
      maxLength: picked.maxLength || 4,
      placeholder: picked.answerType === 'single-character' ? '一个字' : (picked.answerType === 'integer' ? '输入数字' : '输入答案'),
      fallbackText: picked.fallbackText || '',
      requiresLeavingPage: picked.requiresLeavingPage !== false,
    });

    usedCategories.push(picked.category);
    excludeR.add(picked.id);
  }

  // 1 bridge question
  const bridgePool = allBridge.filter(q => !excludeB.has(q.id) && q.status !== 'rejected');
  const bpick = (bridgePool.length > 0 ? bridgePool : allBridge)[Math.floor(Math.random() * (bridgePool.length > 0 ? bridgePool : allBridge).length)];

  selected.push({
    id: bpick.id, kind: 'bridge', category: bpick.category,
    text: bpick.prompt,
    answerType: bpick.answerType || 'copy-previous-answer',
    maxLength: bpick.maxLength || 20,
    placeholder: '原样抄写前三个答案中的一个',
  });

  // 记录去重
  recentRealityIds.push(selected.slice(0, 3).map(q => q.id));
  recentBridgeIds.push(bpick.id);
  if (recentRealityIds.length > MAX_RECENT) recentRealityIds.shift();
  if (recentBridgeIds.length > MAX_RECENT) recentBridgeIds.shift();

  return selected;
}

// 暴露版本号供前端缓存升级
function getBankVersion() { return QUESTION_BANK_VERSION; }

module.exports = { sampleQuestions, getBankVersion };
