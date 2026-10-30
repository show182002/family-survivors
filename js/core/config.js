/** 一家倖存 · 常數、特效設定、玩家偏好（localStorage） */
'use strict';

const STAGE_W = 1920;
const STAGE_H = 1080;
const MAP_W = 4200;
const MAP_H = 4200;
const WIN_TIME = 300;
const SPRITE_SCALE = 4;
const POINTS_PER_LEVEL = 2;
const MAX_ENEMIES = 320;
const XP_BASE = 9.5;
const XP_GROW = 1.325;
const FX_KEY = 'family-survivors-fx';

// ——— FX settings (Full / Simple / Off) ———
let fxMode = localStorage.getItem(FX_KEY) || 'full';
function setFxMode(mode) {
  fxMode = mode;
  localStorage.setItem(FX_KEY, mode);
  refreshFxButtons();
}
function fxOn() { return fxMode !== 'off'; }
// 每技能特效開關 / 自動升級 / 技能次序（localStorage）
const SKILLFX_KEY = 'family-survivors-skillfx';
const PREF_KEY = 'family-survivors-prefs';
let skillFx = {};
let prefs = {};
try { skillFx = JSON.parse(localStorage.getItem(SKILLFX_KEY) || '{}'); } catch (e) { skillFx = {}; }
try { prefs = JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch (e) { prefs = {}; }
function skillFxOn(id) { return !id || skillFx[id] !== false; }
function saveSkillFx() { localStorage.setItem(SKILLFX_KEY, JSON.stringify(skillFx)); }
function savePrefs() { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); }
function charPref(charId) {
  if (!prefs[charId]) prefs[charId] = {};
  const cp = prefs[charId];
  const ids = getCharSkillPool(charId).map((s) => s.id);
  if (!Array.isArray(cp.order)) cp.order = ids.slice();
  cp.order = cp.order.filter((id) => ids.includes(id));
  ids.forEach((id) => { if (!cp.order.includes(id)) cp.order.push(id); });
  if (cp.v !== 2) { cp.auto = true; cp.v = 2; } // v0.0200：預設自動選技
  if (typeof cp.auto !== 'boolean') cp.auto = true;
  return cp;
}
function fxFull() { return fxMode === 'full'; }
