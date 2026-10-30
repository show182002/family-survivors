/** 一家倖存 · 轉職共用：選卡、套用、工具 */
'use strict';

// ================= v0.0200：轉職分支 =================
function hasB(p, id) { return !!(p && p.branch) && Object.values(p.branch).includes(id); }
function bfx(id) { return { skill: 'br' + id }; }
function brScale() { return 1 + 0.09 * Math.max(0, run.level - 5); }
function firstOpenTier(p, upTo) {
  for (let t = 0; t <= upTo; t++) if (!p.branch[t]) return t;
  return -1;
}
function ultLabel(p) {
  if (p.charId === 'dad' && p.branch[0] === '2.1') return p.carry ? '擲人' : '托人';
  if (p.charId === 'dad' && p.branch[0] === '2.2') return '擺陣地';
  return '大招';
}
function branchPath(p) {
  const ids = [0, 1, 2].map((t) => p.branch[t]).filter(Boolean);
  if (!ids.length) return '未轉職';
  return '轉職：' + ids.map((id) => { const b = getBranch(id); return b.icon + b.name.replace(/^[\d.]+ /, ''); }).join(' › ');
}

function openBranchPick(p) {
  pendingChoices = branchOptions(p, currentPick.tier);
  upgradeFocus = 0;
  mode = 'levelup';
  el.levelup.classList.remove('hidden');
  const who = (p.slot === 0 ? '1P' : '2P') + ' ' + p.name;
  if (el.levelupTitle) el.levelupTitle.textContent = '⭐ ' + who + '　Lv' + BRANCH_LEVELS[currentPick.tier] + ' 轉職！';
  if (el.levelupSub) el.levelupSub.textContent = pendingChoices.length > 1 ? '二揀一 · 揀咗就改變玩法（滑鼠停喺卡上面睇詳情）' : '確認轉職（撳卡或 Space）';
  renderBranchCards(p);
}
function renderBranchCards(p) {
  el.upgrades.innerHTML = '';
  pendingChoices.forEach((b, i) => {
    const div = document.createElement('div');
    div.className = 'upgrade-card branch-card' + (i === upgradeFocus ? ' focused' : '');
    div.title = b.desc;
    div.innerHTML = `<div class="b-icon">${b.icon}</div><div class="u-name">${b.name}</div>` +
      `<div class="b-move">新招：${b.move}</div><div class="u-desc b-desc">${b.desc}</div><div class="b-key">按 ${i + 1}</div>`;
    div.addEventListener('click', () => chooseUpgrade(i));
    el.upgrades.appendChild(div);
  });
  if (el.activeTags) el.activeTags.textContent = branchPath(p);
}
function applyBranch(p, b) {
  p.branch[b.tier] = b.id;
  if (b.id === '1.1') { p.mount = 'horse'; p.bSpeed = 1.6; }
  if (b.id === '1.2') { p.mount = 'dragon'; p.bSpeed = 1.35; p.bDmg = 1.35; }
  if (b.id === '2.1') { p.ultCd = 0; p.ultMax = 10; }
  if (b.id === '2.2') { p.ultCd = 0; p.ultMax = 4; }
  banner((p.slot === 0 ? '1P ' : '2P ') + p.name + ' 轉職：' + b.icon + ' ' + b.name, p.color, 2.6);
  addFx(p.x, p.y, 'burst', 140, p.color);
  addFx(p.x, p.y, 'ring', 180, '#ffe566');
  addFx(p.x, p.y, 'icon', 72, '#fff', { icon: b.icon, life: 1.2 });
  run.magnetPulse = 0.6;
}

function coneDamage(p, x, y, ang, half, r, dmg, opts) {
  for (const e of run.enemies) {
    if (e.hp <= 0) continue;
    const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy);
    if (d > r + e.r) continue;
    let da = Math.atan2(dy, dx) - ang;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    if (Math.abs(da) <= half || d < 30) hurtEnemy(e, dmg, p, Object.assign({ fx: x, fy: y }, opts));
  }
}
function nearestN(x, y, maxD, n) {
  const out = [];
  for (const e of run.enemies) {
    if (e.hp <= 0) continue;
    const d = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d < maxD * maxD) out.push([d, e]);
  }
  out.sort((a, b) => a[0] - b[0]);
  return out.slice(0, n).map((o) => o[1]);
}
function onScreen(e) {
  const c = run.cams;
  return e.x > c.x - 60 && e.x < c.x + STAGE_W + 60 && e.y > c.y - 60 && e.y < c.y + STAGE_H + 60;
}

function updateBranches(dt) {
  for (const p of run.players) {
    if (p.dead || !p.branch[0]) continue;
    const tick = (k, cd) => {
      p.bt[k] = (p.bt[k] == null ? cd * 0.3 : p.bt[k]) - dt;
      if (p.bt[k] > 0) return false;
      p.bt[k] = cd * (sm(p).cooldown || 1);
      return true;
    };
    const L = brScale();
    if (p.charId === 'daughter') updateDaughterBr(p, dt, tick, L);
    else if (p.charId === 'dad') updateDadBr(p, dt, tick, L);
  }
  updateMinis(dt);
  updateTrails(dt);
  updateStructures(dt);
  updateBalls(dt);
}
