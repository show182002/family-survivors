/** v0.02212 · 籠隊友＝塔防（×10 血、微回血、籠內可射） */
'use strict';

const CAGE_SPAWN_TIME = 60;
const CAGE_HP = 620;
const AI_HP_FRAC = 0.1;
const CAGE_TOWER_HP_MUL = 10;
const CAGE_REGEN_FRAC = 0.015; // ~1.5% maxHp / 秒（好少）

function missingRosterChars() {
  const roster = ['dad', 'mom', 'daughter'];
  const have = new Set((run.players || []).map((p) => p.charId));
  return roster.filter((id) => !have.has(id));
}

function livingCages() {
  return (run && run.cages) ? run.cages.filter((c) => c.hp > 0) : [];
}

function cagedAllies() {
  return (run && run.players) ? run.players.filter((p) => p.caged && !p.dead) : [];
}

function spawnCageAlly() {
  if (!run || run.cageAllySpawned) return;
  run.cageAllySpawned = true;
  const missing = missingRosterChars();
  if (!missing.length) return;
  const id = missing[Math.floor(Math.random() * missing.length)];
  const slot = run.players.length;
  const p = makePlayer(id, slot);
  p.ai = true;
  p.caged = true;
  p.auto = true;
  p.baseMaxHp = p.maxHp;
  p.maxHp = Math.max(1, Math.floor(p.baseMaxHp * CAGE_TOWER_HP_MUL));
  p.hp = p.maxHp;
  const f = typeof cameraFocus === 'function' ? cameraFocus() : { x: MAP_W / 2, y: MAP_H / 2 };
  const ang = Math.random() * Math.PI * 2;
  p.x = clamp(f.x + Math.cos(ang) * 160, 80, MAP_W - 80);
  p.y = clamp(f.y + Math.sin(ang) * 100, 80, MAP_H - 80);
  run.players.push(p);
  run.cages = run.cages || [];
  run.cages.push({
    x: p.x, y: p.y, hp: CAGE_HP, maxHp: CAGE_HP, r: 58, allySlot: slot, t: 0,
  });
  if (typeof banner === 'function') banner('家人變咗塔！守住／打爆籠', '#ffe566', 3.4);
  addFx(p.x, p.y, 'ring', 120, '#ffe566');
  addFx(p.x, p.y, 'burst', 90, '#88aaff');
  addFloat(p.x, p.y - 70, getChar(id).name + '＝塔！', '#ffe566', true);
  if (typeof buildAutoButtons === 'function') buildAutoButtons();
  if (el && el.hpP3) el.hpP3.classList.remove('hidden');
}

function freeCageAlly(cage) {
  const p = run.players[cage.allySlot];
  if (!p) return;
  p.caged = false;
  p._towerFire = 1;
  // 出籠後脆弱 AI：血量變正常 1/10（滿血嗰池）
  const base = p.baseMaxHp || (typeof getChar === 'function' ? getChar(p.charId).maxHp : p.maxHp);
  p.baseMaxHp = base;
  p.maxHp = Math.max(1, Math.floor(base * AI_HP_FRAC));
  p.hp = p.maxHp;
  p.invuln = Math.max(p.invuln || 0, 1.2);
  addFx(cage.x, cage.y, 'burst', 140, '#ffe566');
  addFx(cage.x, cage.y, 'slam', 160, '#88ccff');
  addFx(cage.x, cage.y, 'icon', 72, '#fff', { icon: '🔓', life: 1.2 });
  if (typeof banner === 'function') banner(p.name + ' 出籠！自動幫手', p.color, 2.4);
  addFloat(p.x, p.y - 80, '得救！', '#88ffaa', true);
  shake(18);
  if (typeof sfxUlt === 'function') sfxUlt();
}

function damageCagesInRadius(x, y, r, dmg, source) {
  if (!run || !run.cages || !run.cages.length) return;
  const r2 = r * r;
  for (const c of run.cages) {
    if (c.hp <= 0) continue;
    const dx = c.x - x, dy = c.y - y;
    if (dx * dx + dy * dy > r2) continue;
    const dealt = Math.max(1, dmg * 0.85);
    c.hp -= dealt;
    c.hitFlash = 0.15;
    addFloat(c.x, c.y - 40, String(Math.round(dealt)), '#cceeff', false);
    addFx(c.x, c.y, 'spark', 18, '#ffe566');
    if (c.hp <= 0) {
      c.hp = 0;
      freeCageAlly(c);
    }
  }
  run.cages = run.cages.filter((c) => c.hp > 0);
}

function updateCageAlly(dt) {
  if (!run) return;
  if (!run.cageAllySpawned && run.time >= CAGE_SPAWN_TIME) spawnCageAlly();
  if (!run.cages) return;
  for (const c of run.cages) {
    c.t = (c.t || 0) + dt;
    if (c.hitFlash > 0) c.hitFlash -= dt;
    const p = run.players[c.allySlot];
    if (!p) continue;
    if (p.caged) {
      p.x = c.x; p.y = c.y;
      // 塔微回血
      if (!p.dead) {
        p.hp = Math.min(p.maxHp, p.hp + p.maxHp * CAGE_REGEN_FRAC * dt);
        // BBQ／帳篷近 → 射速 buff
        p._towerFire = 1;
        if (run.structs && run.structs.length) {
          for (const s of run.structs) {
            if ((s.kind !== 'bbq' && s.kind !== 'tent') || s.hp <= 0) continue;
            if ((s.x - p.x) ** 2 + (s.y - p.y) ** 2 < 180 * 180) {
              p._towerFire = 0.82;
              break;
            }
          }
        }
        // 面向近怪（射擊用）
        const foe = typeof nearestEnemyTo === 'function' ? nearestEnemyTo(p.x, p.y, 520) : null;
        if (foe) p.facing = foe.x >= p.x ? 1 : -1;
      } else {
        // 塔死咗：拆籠
        c.hp = 0;
      }
    }
  }
  run.cages = run.cages.filter((c) => c.hp > 0);
}

function aiMoveAxis(p) {
  // 追最近怪；冇就靠黨中心；近身太多就側移／後退
  const mid = typeof cameraFocus === 'function' ? cameraFocus() : { x: p.x, y: p.y };
  let tx = mid.x, ty = mid.y;
  const foe = typeof nearestEnemyTo === 'function' ? nearestEnemyTo(p.x, p.y, 520) : null;
  if (foe) { tx = foe.x; ty = foe.y; }
  let mx = tx - p.x, my = ty - p.y;
  const d = Math.hypot(mx, my) || 1;
  let near = 0;
  for (const e of run.enemies) {
    if (e.hp <= 0) continue;
    if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < 90 * 90) near++;
  }
  if (near >= 3 && foe) {
    const bx = -(foe.x - p.x) / d, by = -(foe.y - p.y) / d;
    const sx = -by, sy = bx;
    mx = bx * 0.55 + sx * 0.85;
    my = by * 0.55 + sy * 0.85;
  } else if (foe && d < 70) {
    mx = -mx; my = -my;
  } else if (!foe && d < 40) {
    return { dx: 0, dy: 0 };
  }
  const len = Math.hypot(mx, my) || 1;
  return { dx: mx / len, dy: my / len };
}

function updateAiUlt(dt) {
  if (!run) return;
  for (const p of run.players) {
    if (!p.ai || p.dead || p.caged) continue;
    p._aiUltT = (p._aiUltT || 0) - dt;
    if (p._aiUltT > 0) continue;
    if (p.ultCd > 0) continue;
    const e = nearestEnemyTo(p.x, p.y, 300);
    if (!e) continue;
    p._aiUltT = 0.8;
    tryUlt(p.slot);
  }
}

function drawCages(cam) {
  if (!run || !run.cages) return;
  for (const c of run.cages) {
    const sx = c.x - cam.x, sy = c.y - cam.y;
    const pulse = 0.75 + 0.25 * Math.sin((c.t || 0) * 6);
    ctx.save();
    ctx.globalAlpha = 0.35 * pulse;
    ctx.strokeStyle = '#ffe566';
    ctx.lineWidth = 5;
    ctx.strokeRect(sx - c.r, sy - c.r - 20, c.r * 2, c.r * 2 + 10);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#c8e0ff';
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(sx + i * 18, sy - c.r - 20);
      ctx.lineTo(sx + i * 18, sy + c.r - 10);
      ctx.stroke();
    }
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(sx - c.r, sy - 10 + i * 16);
      ctx.lineTo(sx + c.r, sy - 10 + i * 16);
      ctx.stroke();
    }
    if (c.hitFlash > 0) {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#fff';
      ctx.fillRect(sx - c.r, sy - c.r - 20, c.r * 2, c.r * 2 + 10);
    }
    ctx.globalAlpha = 1;
    // 籠條（鎖）
    ctx.fillStyle = '#000';
    ctx.fillRect(sx - 28, sy + c.r - 4, 56, 7);
    ctx.fillStyle = '#88ccff';
    ctx.fillRect(sx - 28, sy + c.r - 4, 56 * Math.max(0, c.hp / c.maxHp), 7);
    // 塔血（家人）
    const p = run.players[c.allySlot];
    if (p && !p.dead) {
      ctx.fillStyle = '#000';
      ctx.fillRect(sx - 32, sy - c.r - 36, 64, 8);
      ctx.fillStyle = p.color || '#ffe566';
      ctx.fillRect(sx - 32, sy - c.r - 36, 64 * Math.max(0, p.hp / p.maxHp), 8);
    }
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe566';
    ctx.fillText('🗼塔·打爆', sx, sy - c.r - 48);
    ctx.restore();
  }
}
