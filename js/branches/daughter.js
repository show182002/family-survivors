/** 一家倖存 · 女兒轉職：坐騎線 */
'use strict';

// ——— 女兒 ———
function spawnMini(p, life, horse, line) {
  if (run.minis.length > 24) return;
  run.minis.push({ owner: p.slot, x: p.x + (Math.random() - 0.5) * 80, y: p.y + (Math.random() - 0.5) * 80,
    t: 0, life, horse, line: line || 0, cd: 0, hitCd: 0 });
}
function updateDaughterBr(p, dt, tick, L) {
  const horse = p.branch[0] === '1.1';
  const big = hasB(p, '1.12') ? 2.2 : 1, dm = hasB(p, '1.12') ? 1.3 : 1;
  const giant = hasB(p, '1.21');
  if (horse) {
    if (tick('stomp', 2.5)) {
      const r = 110 * big * (giant ? 1.3 : 1);
      damageEnemiesInRadius(p.x, p.y, r, 26 * L * dm, p, { knock: 70 });
      addFx(p.x, p.y, 'slam', r, '#e0b070', bfx('1.1'));
      addFx(p.x, p.y, 'dust', r * 0.8, '#c8a070', Object.assign({ seed: Math.random() * 6, life: 0.6 }, bfx('1.1')));
      shake(3);
    }
  } else if (tick('breath', 2.2)) {
    const t = nearestEnemyTo(p.x, p.y, 480 * Math.sqrt(big));
    if (t) {
      const ang = Math.atan2(t.y - p.y, t.x - p.x), r = 220 * big;
      coneDamage(p, p.x, p.y, ang, 0.6, r, 32 * L * dm, { forceBurn: true });
      addFx(p.x, p.y - 20, 'fire_cone', r, '#ff7a22', Object.assign({ ang, half: 0.6, life: 0.5 }, bfx('1.2')));
      addFx(p.x, p.y - 20, 'fire_cone', r * 0.6, '#ffe066', Object.assign({ ang, half: 0.35, life: 0.4 }, bfx('1.2')));
    } else p.bt.breath = 0.4;
  }
  if (hasB(p, '1.11') && tick('summon', 7)) {
    for (let i = 0; i < 2; i++) spawnMini(p, 9, horse, 0);
    addFx(p.x, p.y, 'burst', 70, horse ? '#ffd27a' : '#ff8844', bfx('1.11'));
    addFx(p.x, p.y, 'icon', 48, '#fff', Object.assign({ icon: horse ? '🐴' : '🐲', life: 0.8 }, bfx('1.11')));
  }
  if (giant) {
    p.bt.tr = (p.bt.tr || 0) - dt;
    if (p.bt.tr <= 0) {
      p.bt.tr = 0.25;
      damageEnemiesInRadius(p.x, p.y, 85, 16 * L, p, { knock: 140 });
      if (fxFull() && Math.random() < 0.5) addFx(p.x, p.y, 'dust', 70, '#bb9966', Object.assign({ seed: Math.random() * 6 }, bfx('1.21')));
    }
  }
  if (hasB(p, '1.22')) {
    p.bt.rb = (p.bt.rb || 0) - dt;
    if (p.bt.rb <= 0) {
      p.bt.rb = 0.09;
      const last = run.trails[run.trails.length - 1];
      if (!last || Math.hypot(last.x - p.x, last.y - p.y) > 14) run.trails.push({ x: p.x, y: p.y, t: 0, life: 2.6, owner: p.slot, hue: (run.time * 240) % 360 });
      if (run.trails.length > 90) run.trails.shift();
    }
    if (!p._parade) { p._parade = true; for (let i = 1; i <= 3; i++) spawnMini(p, 1e9, horse, i); }
  }
}
function updateMinis(dt) {
  const L = brScale();
  for (const m of run.minis) {
    m.t += dt; m.cd -= dt; m.hitCd -= dt;
    const p = run.players[m.owner];
    if (!p || p.dead) { m.t = m.life; continue; }
    if (m.line) {
      const h = p.hist[Math.min(p.hist.length - 1, m.line * 9)] || p;
      m.x += (h.x - m.x) * Math.min(1, dt * 12); m.y += (h.y - m.y) * Math.min(1, dt * 12);
    } else {
      const tg = nearestEnemyTo(m.x, m.y, 420);
      let gx = p.x, gy = p.y;
      if (tg && Math.hypot(tg.x - p.x, tg.y - p.y) < 520) { gx = tg.x; gy = tg.y; }
      const dx = gx - m.x, dy = gy - m.y, d = Math.hypot(dx, dy) || 1;
      if (d > 30) { m.x += dx / d * 330 * dt; m.y += dy / d * 330 * dt; }
      if (!m.horse && tg && m.cd <= 0) {
        m.cd = 0.9;
        pushProj(p, m.x, m.y - 10, Math.atan2(tg.y - m.y, tg.x - m.x), { damage: 16 * L, speed: 520, size: 8, color: '#ff8844', skill: 'br1.11', life: 1.1 });
      }
    }
    if (m.hitCd <= 0) {
      m.hitCd = 0.4;
      const r = m.line ? 34 : (m.horse ? 40 : 26);
      damageEnemiesInRadius(m.x, m.y, r, (m.line ? 12 : 15) * L, p, { knock: 40 });
    }
  }
  run.minis = run.minis.filter((m) => m.t < m.life);
}
function updateTrails(dt) {
  for (const t of run.trails) t.t += dt;
  run.trails = run.trails.filter((t) => t.t < t.life);
  run.trailTick -= dt;
  if (run.trailTick > 0 || !run.trails.length) return;
  run.trailTick = 0.3;
  const L = brScale();
  for (const e of run.enemies) {
    if (e.hp <= 0) continue;
    for (const t of run.trails) {
      if ((e.x - t.x) ** 2 + (e.y - t.y) ** 2 < (26 + e.r) ** 2) {
        hurtEnemy(e, 14 * L, run.players[t.owner]);
        break;
      }
    }
  }
}
