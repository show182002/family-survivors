/** 一家倖存 · 爸爸轉職：膊頭馬／起陣地 */
'use strict';

// ——— 爸爸 ———
function dadUlt(p) {
  if (p.branch[0] === '2.1') {
    if (p.carry) { throwCarried(p); return; }
    if (p.ultCd > 0) return;
    const ally = run.players.find((a) => a !== p && !a.dead && !a.ball);
    if (ally) {
      if (Math.hypot(ally.x - p.x, ally.y - p.y) > 200) { addFloat(p.x, p.y - 60, '行近隊友先托到！', '#ffcc66', true); return; }
      p.carry = { who: ally };
      ally.carriedBy = p;
    } else {
      if (run.balls.some((b) => b.owner === p.slot)) return;
      p.carry = { doll: true };
    }
    p.flash = 0.3;
    addFx(p.x, p.y, 'ring', 80, '#ffe566', bfx('2.1'));
    addFloat(p.x, p.y - 90, '托起！', '#ffe566', true);
  } else {
    if (p.ultCd > 0) return;
    placeStructure(p);
    p.ultCd = 4; p.ultMax = 4;
  }
}
function throwCarried(p) {
  const c = p.carry;
  p.carry = null;
  const t = nearestEnemyTo(p.x, p.y, 700);
  let ang = t ? Math.atan2(t.y - p.y, t.x - p.x) : (p.facing > 0 ? -0.4 : Math.PI + 0.4);
  const cam = run.cams;
  const ball = { owner: p.slot, who: c.who || null, x: p.x, y: p.y - 40, vx: Math.cos(ang) * 1100, vy: Math.sin(ang) * 1100,
    t: 0, life: 3, rect: { x0: cam.x + 30, y0: cam.y + 30, x1: cam.x + STAGE_W - 30, y1: cam.y + STAGE_H - 30 }, back: false };
  if (c.who) { c.who.carriedBy = null; c.who.ball = ball; }
  run.balls.push(ball);
  p.ultCd = 10; p.ultMax = 10;
  // v0.02205：擲人大招誇張
  for (let i = 0; i < 8; i++) addFx(p.x, p.y - 40, 'ring', 90 + i * 35, i % 2 ? '#ffe566' : '#fff', bfx('2.1'));
  addFx(p.x, p.y - 40, 'burst', 160, '#ffe566', bfx('2.1'));
  addFx(p.x, p.y - 40, 'dust', 120, '#bbaa88', Object.assign({ seed: Math.random() * 6, life: 0.8 }, bfx('2.1')));
  addFloat(p.x, p.y - 90, '擲！', '#ffe566', true);
  shake(40);
}
function releaseCarry(p) {
  if (p.carry && p.carry.who) { p.carry.who.carriedBy = null; p.carry.who.invuln = 1; }
  p.carry = null;
  if (p.carriedBy) { p.carriedBy.carry = null; p.carriedBy = null; }
  if (p.ball) { p.ball.who = null; p.ball = null; }
}
function updateBalls(dt) {
  const L = brScale();
  for (const b of run.balls) {
    const dad = run.players[b.owner];
    if (b.back) {
      // 公仔自己跑返去爸爸度
      if (!dad || dad.dead) { b.done = true; continue; }
      const dx = dad.x - b.x, dy = dad.y - b.y, d = Math.hypot(dx, dy) || 1;
      b.x += dx / d * 520 * dt; b.y += dy / d * 520 * dt;
      if (d < 30) b.done = true;
      continue;
    }
    b.t += dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    const R = b.rect;
    let bounced = false;
    if (b.x < R.x0) { b.x = R.x0; b.vx = Math.abs(b.vx); bounced = true; }
    if (b.x > R.x1) { b.x = R.x1; b.vx = -Math.abs(b.vx); bounced = true; }
    if (b.y < R.y0) { b.y = R.y0; b.vy = Math.abs(b.vy); bounced = true; }
    if (b.y > R.y1) { b.y = R.y1; b.vy = -Math.abs(b.vy); bounced = true; }
    b.x = clamp(b.x, 30, MAP_W - 30); b.y = clamp(b.y, 30, MAP_H - 30);
    if (bounced) {
      addFx(b.x, b.y, 'ring', 60, '#ffffff', bfx('2.1'));
      shake(3);
      if (dad && hasB(dad, '2.11')) {
        damageEnemiesInRadius(b.x, b.y, 220, 135 * L, dad, { knock: 120 }); // ×3 dmg
        for (let i = 0; i < 6; i++) addFx(b.x, b.y, 'slam', 150 + i * 25, '#ff9944', bfx('2.11'));
        addFx(b.x, b.y, 'fire', 160, '#ffcc44', bfx('2.11'));
        shake(18);
      }
    }
    if (fxFull() && skillFxOn('br2.1')) run.fx.push({ x: b.x, y: b.y, type: 'burst', r: 22, color: b.who ? b.who.color : '#ffcc99', t: 0, life: 0.25 });
    if (dad) {
      for (const e of run.enemies) {
        if (e.hp <= 0 || (e.ballHit || 0) > run.time) continue;
        if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 < (e.r + 28) ** 2) {
          e.ballHit = run.time + 0.3;
          hurtEnemy(e, 120 * L, dad); // v0.02205：擲人傷害 ×3
          addFx(e.x, e.y, 'ring', 80, '#ffe566', bfx('2.1'));
          addFx(e.x, e.y, 'burst', 50, '#ffcc66', bfx('2.1'));
        }
      }
    }
    if (b.who) { b.who.x = b.x; b.who.y = b.y; }
    if (b.t >= b.life) {
      addFx(b.x, b.y, 'dust', 70, '#bbaa88', Object.assign({ seed: Math.random() * 6, life: 0.7 }, bfx('2.1')));
      if (b.who) { b.who.ball = null; b.who.invuln = Math.max(b.who.invuln, 0.8); b.done = true; }
      else b.back = true;
    }
  }
  run.balls = run.balls.filter((b) => !b.done);
}
function updateDadBr(p, dt, tick, L) {
  if (p.carry) {
    const w = p.carry.who;
    if (w) {
      if (w.dead) { releaseCarry(w); }
      else { w.x = p.x; w.y = p.y - 1; w.facing = p.facing; }
    } else if (tick('doll', 0.7)) {
      const t = nearestEnemyTo(p.x, p.y, 600);
      if (t) pushProj(p, p.x, p.y - 80, Math.atan2(t.y - p.y + 80, t.x - p.x), { damage: 18 * L * 2, speed: 560, size: 9, color: '#ffcc99', skill: 'br2.1', life: 1.2 });
    }
    if (hasB(p, '2.12')) {
      for (const b of run.ebul) {
        if (b.life > 0 && (b.x - p.x) ** 2 + (b.y - p.y + 20) ** 2 < 90 * 90) {
          b.life = 0;
          pushProj(p, b.x, b.y, Math.atan2(-b.vy, -b.vx), { damage: 25 * L, speed: 520, size: 10, color: '#88ccff', skill: 'br2.12', life: 1.2 });
          addFx(b.x, b.y, 'spark', 16, '#88ccff', bfx('2.12'));
        }
      }
    }
    if (hasB(p, '2.21') && tick('tower', 1)) {
      damageEnemiesInRadius(p.x, p.y, 210, 40 * L, p, { knock: 90 });
      addFx(p.x, p.y, 'slam', 210, '#ffd84a', bfx('2.21'));
      addFx(p.x, p.y, 'dust', 160, '#bbaa88', Object.assign({ seed: Math.random() * 6 }, bfx('2.21')));
      shake(5);
    }
  }
}
const STRUCT_KINDS = [
  { kind: 'bbq', icon: '🔥', name: '燒烤爐' },
  { kind: 'tent', icon: '⛺', name: '帳篷' },
  { kind: 'stool', icon: '🪑', name: '膠櫈' },
];
function placeStructure(p) {
  p.structIdx = (p.structIdx || 0);
  const k = STRUCT_KINDS[p.structIdx % 3];
  p.structIdx++;
  const max = hasB(p, '2.13') ? 5 : 3;
  const mine = run.structs.filter((s) => s.owner === p.slot);
  if (mine.length >= max) {
    const old = mine[0];
    addFx(old.x, old.y, 'dust', 50, '#998877', bfx('2.2'));
    run.structs.splice(run.structs.indexOf(old), 1);
  }
  run.structs.push({ owner: p.slot, kind: k.kind, icon: k.icon, x: p.x, y: p.y, t: 0, cd: 0.3, hp: 420, maxHp: 420, zap: 0 });
  // v0.02205：起陣地大招誇張 FX
  for (let i = 0; i < 8; i++) {
    addFx(p.x, p.y, 'slam', 90 + i * 40, '#ffcc66', bfx('2.2'));
    addFx(p.x, p.y, 'ring', 70 + i * 30, i % 2 ? '#ffcc66' : '#fff', bfx('2.2'));
  }
  addFx(p.x, p.y, 'dust', 140, '#bbaa88', Object.assign({ seed: Math.random() * 6, life: 0.9 }, bfx('2.2')));
  addFx(p.x, p.y, 'burst', 160, '#ffdd88', bfx('2.2'));
  damageEnemiesInRadius(p.x, p.y, 220, 90 * brScale(), p, { knock: 120 }); // 落地震擊 ×3 感
  addFloat(p.x, p.y - 70, k.icon + ' ' + k.name, '#ffcc66', true);
  shake(36);
}
function updateStructures(dt) {
  if (!run.structs.length) return;
  const L = brScale();
  for (const s of run.structs) {
    s.t += dt; s.cd -= dt;
    const p = run.players[s.owner];
    if (!p) continue;
    const big = hasB(p, '2.13');
    if (s.kind === 'bbq' && s.cd <= 0) {
      const t = nearestEnemyTo(s.x, s.y, 480);
      if (t) {
        s.cd = 0.8 * (big ? 0.7 : 1);
        pushProj(p, s.x, s.y - 30, Math.atan2(t.y - s.y + 30, t.x - s.x), { damage: 22 * L * (big ? 1.6 : 1), speed: 600, size: 9, color: '#ff8833', skill: 'br2.2', life: 1 });
        addFx(s.x, s.y - 30, 'burst', 22, '#ffdd55', bfx('2.2'));
      } else s.cd = 0.3;
    } else if (s.kind === 'stool' && s.cd <= 0) {
      s.cd = 0.5;
      for (const e of run.enemies) {
        if (e.hp <= 0 || (e.x - s.x) ** 2 + (e.y - s.y) ** 2 > 70 * 70) continue;
        e.chill = Math.max(e.chill, 0.6); e.chillFactor = 0.4;
        hurtEnemy(e, 12 * L * (big ? 1.6 : 1), p);
      }
    }
    if (hasB(p, '2.22')) {
      for (const a of run.players) {
        if (a.dead || a._fortT === run.time) continue;
        if ((a.x - s.x) ** 2 + (a.y - s.y) ** 2 < 170 * 170) { a._fortT = run.time; a.hp = Math.min(a.maxHp, a.hp + 6 * dt); }
      }
    }
  }
  // 電網
  run.netTick = (run.netTick || 0) - dt;
  if (run.netTick <= 0) {
    run.netTick = 0.3;
    for (const seg of netSegments()) {
      const p = run.players[seg.owner];
      const ax = seg.a.x, ay = seg.a.y - 20, bx = seg.b.x, by = seg.b.y - 20;
      const vx = bx - ax, vy = by - ay, len2 = vx * vx + vy * vy || 1;
      for (const e of run.enemies) {
        if (e.hp <= 0) continue;
        const u = clamp(((e.x - ax) * vx + (e.y - ay) * vy) / len2, 0, 1);
        const qx = ax + vx * u, qy = ay + vy * u;
        if ((e.x - qx) ** 2 + (e.y - qy) ** 2 < (36 + e.r) ** 2) {
          hurtEnemy(e, 28 * brScale(), p, { forceChill: true });
          if (fxFull()) addFx(e.x, e.y, 'spark', 14, '#aaeeff', bfx('2.14'));
        }
      }
    }
  }
  run.structs = run.structs.filter((s) => s.hp > 0);
}
function netSegments() {
  const out = [];
  for (const p of run.players) {
    if (!hasB(p, '2.14')) continue;
    const mine = run.structs.filter((s) => s.owner === p.slot);
    for (let i = 0; i < mine.length - 1; i++) out.push({ a: mine[i], b: mine[i + 1], owner: p.slot });
    if (mine.length > 2) out.push({ a: mine[mine.length - 1], b: mine[0], owner: p.slot });
  }
  return out;
}
function fortressSlow(e) {
  if (!run.structs.length) return 1;
  for (const s of run.structs) {
    const p = run.players[s.owner];
    if (p && hasB(p, '2.22') && (e.x - s.x) ** 2 + (e.y - s.y) ** 2 < 170 * 170) return 0.5;
  }
  return 1;
}
function blockByStructures() {
  for (const s of run.structs) {
    if (s.kind !== 'tent') continue;
    for (const e of run.enemies) {
      if (e.boss || e.charge) continue;
      const dx = e.x - s.x, dy = e.y - s.y, d = Math.hypot(dx, dy) || 1, R = 56 + e.r;
      if (d < R) { e.x = s.x + dx / d * R; e.y = s.y + dy / d * R; s.hp -= 6 * (1 / 60); }
    }
  }
  run.structs = run.structs.filter((s) => {
    if (s.hp <= 0) { addFx(s.x, s.y, 'dust', 60, '#998877'); return false; }
    return true;
  });
}
