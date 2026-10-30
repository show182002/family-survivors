/** 一家倖存 · 常數、特效設定、玩家偏好（localStorage） */
'use strict';

const STAGE_W = 1920;
const STAGE_H = 817; // v0.02207：2.35:1 ultrawide（1920×817）
const MAP_W = 4200;
const MAP_H = 4200;
const WIN_TIME = 300;
const SPRITE_SCALE = 4;
const POINTS_PER_LEVEL = 2;
const MAX_ENEMIES = 1000; // v0.02207：相對 02205 再 ×2
// v0.02209：雙人限距 = 而家鏡頭視野（唔出畫），唔係固定短 leash。
// 鏡頭跟 party 中點 → 兩人 |dx|≤viewW−2m、|dy|≤viewH−2m 就兩邊都喺畫面內。
// 每幀跟 viewW()/viewH()（zoom ×1/1½/2/3）重算；軸對齊所以 ultrawide 可以左右散開約一屏闊。
const PARTY_ONSCREEN_MARGIN = 36; // ~chibi／半身唔被裁
function partySepMaxX() {
  const vw = typeof viewW === 'function' ? viewW() : STAGE_W;
  return Math.max(80, vw - 2 * PARTY_ONSCREEN_MARGIN);
}
function partySepMaxY() {
  const vh = typeof viewH === 'function' ? viewH() : STAGE_H;
  return Math.max(80, vh - 2 * PARTY_ONSCREEN_MARGIN);
}
const XP_BASE = 9.5;
const XP_GROW = 1.325;
const FX_KEY = 'family-survivors-fx';
const ZOOM_KEY = 'family-survivors-zoom';
const ZOOM_STEPS = [1, 1.5, 2, 3];

// ——— FX settings (Full / Simple / Off) ———
let fxMode = localStorage.getItem(FX_KEY) || 'full';
function setFxMode(mode) {
  fxMode = mode;
  localStorage.setItem(FX_KEY, mode);
  refreshFxButtons();
}

// ——— v0.02205 畫面倍率（1／1.5／2／3）———
// 有存檔用存檔；冇存檔時選角用 touch → ×3、keyboard／mouse → ×1（輸入模態優先過 pointer:coarse）
function softDeviceZoomGuess() {
  try {
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return 3;
  } catch (_) {}
  return 1;
}
function parseZoom(v) {
  const n = parseFloat(v);
  if (n === 1.5 || n === 2 || n === 3 || n === 1) return n;
  return NaN;
}
function hasSavedZoom() {
  const raw = localStorage.getItem(ZOOM_KEY);
  if (raw == null || raw === '') return false;
  return !Number.isNaN(parseZoom(raw));
}
function initViewZoom() {
  if (hasSavedZoom()) return parseZoom(localStorage.getItem(ZOOM_KEY));
  return softDeviceZoomGuess(); // 未有選角輸入前嘅暫估；選角會用模態覆寫
}
let viewZoom = initViewZoom();
let zoomModalityLocked = hasSavedZoom(); // 已有存檔／玩家撳過倍率掣就唔再跟模態改
function getViewZoom() { return viewZoom || 1; }
function viewW() { return STAGE_W / getViewZoom(); }
function viewH() { return STAGE_H / getViewZoom(); }
function zoomLabel(z) {
  z = z || getViewZoom();
  if (z === 1.5) return '1½';
  if (z === 2) return '2';
  if (z === 3) return '3';
  return '1';
}
function setViewZoom(z) {
  const p = parseZoom(z);
  viewZoom = Number.isNaN(p) ? 1 : p;
  localStorage.setItem(ZOOM_KEY, String(viewZoom));
  if (typeof refreshZoomButton === 'function') refreshZoomButton();
}
function cycleViewZoom() {
  zoomModalityLocked = true;
  const i = ZOOM_STEPS.indexOf(getViewZoom());
  setViewZoom(ZOOM_STEPS[(i < 0 ? 0 : i + 1) % ZOOM_STEPS.length]);
}
/** 選角時：touch → ×3；keyboard／mouse → ×1。只喺未存檔／未手動改倍率時生效 */
function applySelectZoomModality(kind) {
  if (zoomModalityLocked || hasSavedZoom()) {
    zoomModalityLocked = true;
    return;
  }
  zoomModalityLocked = true;
  setViewZoom(kind === 'touch' ? 3 : 1);
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
