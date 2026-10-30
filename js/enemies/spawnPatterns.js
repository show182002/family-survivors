/** 一家倖存 · 出場花樣、階段橫額、Boss */
'use strict';

// ================= 敵人出場花樣 / 精英 / Boss =================
function addWarn(kind, delay, data, fire) {
  run.warns.push({ kind, t: 0, delay, data, fire });
}
function banner(text, color, dur) { run.banner = { text, color: color || '#ff5555', t: 0, life: dur || 2.2 }; }
const PATTERNS = ['ring', 'line', 'corner', 'spiral', 'ambush'];

function startPattern(kind) {
  const f = cameraFocus();
  const min = run.time / 60;
  if (kind === 'ring') {
    const R = 640;
    banner('⚠ 包圍！', '#ff6a6a', 1.6);
    addWarn('ring', 1.8, { x: f.x, y: f.y, r: R }, (d) => {
      const n = Math.floor(96 * tierMul(run.time)); // v0.02207 ×2 vs 02205
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n;
        spawnOneEnemy(false, { x: d.x + Math.cos(a) * d.r, y: d.y + Math.sin(a) * d.r, speedMul: 1.15 });
      }
    });
  } else if (kind === 'line') {
    const horiz = Math.random() < 0.6;
    const dir = Math.random() < 0.5 ? 1 : -1;
    banner('⚠ 衝鋒！留意紅色通道', '#ff8844', 1.6);
    const cam = run.cams;
    const d = horiz
      ? { horiz, dir, c: f.y + (Math.random() - 0.5) * 200, w: 300, cam: { x: cam.x, y: cam.y } }
      : { horiz, dir, c: f.x + (Math.random() - 0.5) * 300, w: 320, cam: { x: cam.x, y: cam.y } };
    addWarn('line', 2.0, d, (d) => {
      const n = Math.floor(60 * tierMul(run.time)); // v0.02207 ×2 vs 02205
      const spd = 460 + min * 30;
      for (let i = 0; i < n; i++) {
        const off = (i / (n - 1) - 0.5) * d.w;
        const lag = Math.random() * 120;
        if (d.horiz) {
          const x = d.dir > 0 ? run.cams.x - 60 - lag : run.cams.x + STAGE_W + 60 + lag;
          spawnOneEnemy(false, { kind: 'bat', x, y: d.c + off, vx: spd * d.dir, vy: 0, life: (STAGE_W + 300) / spd });
        } else {
          const y = d.dir > 0 ? run.cams.y - 60 - lag : run.cams.y + STAGE_H + 60 + lag;
          spawnOneEnemy(false, { kind: 'bat', x: d.c + off, y, vx: 0, vy: spd * d.dir, life: (STAGE_H + 300) / spd });
        }
      }
    });
  } else if (kind === 'corner') {
    const cx = Math.random() < 0.5 ? 0 : 1, cy = Math.random() < 0.5 ? 0 : 1;
    banner('⚠ 角落湧出蝙蝠群！', '#ffaa44', 1.6);
    addWarn('corner', 1.8, { cx, cy }, (d) => {
      const x = run.cams.x + (d.cx ? STAGE_W + 40 : -40);
      const y = run.cams.y + (d.cy ? STAGE_H + 40 : -40);
      const n = Math.floor(120 * tierMul(run.time)); // v0.02207 ×2 vs 02205
      for (let i = 0; i < n; i++) {
        spawnOneEnemy(false, { kind: i % 3 ? 'bat' : 'ghost', x: x + (Math.random() - 0.5) * 140, y: y + (Math.random() - 0.5) * 140, speedMul: 1.35 });
      }
    });
  } else if (kind === 'spiral') {
    banner('⚠ 螺旋陣！', '#cc88ff', 1.6);
    addWarn('spiral', 1.5, { x: f.x, y: f.y }, (d) => {
      run.spiral = { x: d.x, y: d.y, n: 0, total: Math.floor(156 * tierMul(run.time)), acc: 0 }; // v0.02207 ×2 vs 02205
    });
  } else if (kind === 'ambush') {
    banner('⚠ 伏兵！避開紅圈', '#ff4444', 1.4);
    const spots = [];
    for (const p of run.players) {
      if (p.dead) continue;
      const k = Math.floor(18 * Math.sqrt(tierMul(run.time))); // v0.02207 ×2 vs 02205 spots
      for (let i = 0; i < k; i++) {
        const a = Math.random() * Math.PI * 2, r = 150 + Math.random() * 120;
        spots.push({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r });
      }
    }
    addWarn('ambush', 1.4, { spots }, (d) => {
      for (const s of d.spots) {
        for (let j = 0; j < 12; j++) spawnOneEnemy(false, { kind: 'ghost', x: s.x + (Math.random() - 0.5) * 30, y: s.y + (Math.random() - 0.5) * 30 }); // v0.02207 ×2 vs 02205
        addFx(s.x, s.y, 'burst', 50, '#aa44ff');
      }
    });
  }
}

function updateEvents(dt) {
  const t = run.time;
  if (t >= run.nextEvent) {
    run.nextEvent = t + Math.max(12, 24 - t / 25);
    // 遲啲同時出兩款
    startPattern(PATTERNS[run.eventIdx++ % PATTERNS.length]);
    if (t > 200) startPattern(PATTERNS[Math.floor(Math.random() * PATTERNS.length)]);
  }
  const tier = tierOf(t);
  if (tier > run.tier) {
    run.tier = tier;
    const TXT = ['小怪出動', '射手怪出現！（慢彈，避得到）', '衝鋒怪＋分裂怪＋中 Boss！', '盾怪出現！（正面擋，要打側／背）', '精英混戰＋中 Boss！'];
    if (tier > 0) banner('第' + (tier + 1) + '階段 · ' + TXT[tier], '#ffcc44', 3);
  }
  // v0.02205：多啲中 Boss；final boss 最後 1 分鐘（t>=240／5:00 局）
  if (!run.elite0Done && t >= 60) {
    run.elite0Done = true;
    banner('⚠ 中 Boss！', '#ff9030', 2.4);
    const f = cameraFocus();
    addWarn('ambush', 2.6, { spots: [{ x: f.x + 380, y: f.y - 80 }], big: true }, (d) => {
      spawnOneEnemy(true, { kind: 'brute', x: d.spots[0].x, y: d.spots[0].y, boss: 'elite', hpMul: 32, speedMul: 1.05 });
    });
  }
  if (!run.eliteDone && t >= 120) {
    run.eliteDone = true;
    banner('⚠ 中 Boss！', '#ff9030', 2.4);
    const f = cameraFocus();
    addWarn('ambush', 3, { spots: [{ x: f.x + 420, y: f.y }], big: true }, (d) => {
      spawnOneEnemy(true, { x: d.spots[0].x, y: d.spots[0].y, boss: 'elite', hpMul: 45, speedMul: 1.1 });
    });
  }
  if (!run.elite3Done && t >= 180) {
    run.elite3Done = true;
    banner('⚠ 雙中 Boss！', '#ff7030', 2.6);
    const f = cameraFocus();
    addWarn('ambush', 2.8, { spots: [{ x: f.x - 400, y: f.y }, { x: f.x + 400, y: f.y }], big: true }, (d) => {
      spawnOneEnemy(true, { kind: 'brute', x: d.spots[0].x, y: d.spots[0].y, boss: 'elite', hpMul: 36, speedMul: 1.12 });
      if (d.spots[1]) spawnOneEnemy(true, { kind: 'shield', x: d.spots[1].x, y: d.spots[1].y, boss: 'elite', hpMul: 38, speedMul: 0.95 });
    });
  }
  if (!run.elite2Done && t >= 210) {
    run.elite2Done = true;
    banner('⚠ 中 Boss！', '#ff9030', 2.4);
    const f = cameraFocus();
    addWarn('ambush', 3, { spots: [{ x: f.x - 420, y: f.y }], big: true }, (d) => {
      spawnOneEnemy(true, { kind: 'brute', x: d.spots[0].x, y: d.spots[0].y, boss: 'elite', hpMul: 50, speedMul: 1.15 });
    });
  }
  if (!run.bossDone && t >= 240) {
    run.bossDone = true;
    banner('☠ 最終大魔王！最後 1 分鐘！', '#dd66ff', 3.4);
    const f = cameraFocus();
    addWarn('ambush', 2.8, { spots: [{ x: f.x, y: f.y - 320 }], big: true }, (d) => {
      spawnOneEnemy(true, { kind: 'brute', x: d.spots[0].x, y: d.spots[0].y, boss: 'boss', hpMul: 180, speedMul: 0.7 });
    });
  }
  for (const w of run.warns) {
    w.t += dt;
    if (w.t >= w.delay && !w.done) { w.done = true; w.fire(w.data); }
  }
  run.warns = run.warns.filter((w) => !w.done);
  if (run.spiral) {
    const sp = run.spiral;
    sp.acc += dt;
    while (sp.acc >= 0.07 && sp.n < sp.total) {
      sp.acc -= 0.07;
      const a = sp.n * 0.42, r = 620 - sp.n * 4;
      spawnOneEnemy(false, { kind: 'slime', x: sp.x + Math.cos(a) * r, y: sp.y + Math.sin(a) * r, speedMul: 1.1 });
      sp.n++;
    }
    if (sp.n >= sp.total) run.spiral = null;
  }
  if (run.banner) { run.banner.t += dt; if (run.banner.t > run.banner.life) run.banner = null; }
  // enemy bullets
  const alive = run.players.filter((p) => !p.dead);
  for (const b of run.ebul) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    for (const p of alive) {
      const br = 14 + (b.r || 9);
      if ((p.x - b.x) ** 2 + (p.y - 16 - b.y) ** 2 < br * br) { hurtPlayer(p, b.dmg, null); b.life = 0; }
    }
  }
  run.ebul = run.ebul.filter((b) => b.life > 0);
}

function updateBoss(e, dt, alive) {
  // ——— Final boss：跳高消失 → 地上圓形預兆 → 跌落砸地 ———
  if (e.boss === 'boss') {
    e._bossSkipMove = false;
    if (!e.bossPhase) e.bossPhase = 'idle';
    if (e.bossPhase === 'idle') {
      e.tShoot -= dt;
      e.jumpY = 0; e.hidden = false;
      if (e.tShoot <= 0 && alive.length) {
        e.bossPhase = 'rise';
        e.phaseT = 0.55;
        e.windup = 0.55;
        addFloat(e.x, e.y - e.r, '跳！', '#dd66ff', true);
        shake(8);
      }
      return;
    }
    if (e.bossPhase === 'rise') {
      e._bossSkipMove = true;
      e.phaseT -= dt;
      e.windup = Math.max(0, e.phaseT);
      e.jumpY = (1 - Math.max(0, e.phaseT) / 0.55) * 520;
      if (e.phaseT <= 0) {
        e.bossPhase = 'air';
        e.phaseT = 1.35;
        e.hidden = true;
        e.jumpY = 800;
        const tg = alive[Math.floor(Math.random() * alive.length)];
        const ang = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 120;
        e.slamX = clamp(tg.x + Math.cos(ang) * dist, 80, MAP_W - 80);
        e.slamY = clamp(tg.y + Math.sin(ang) * dist, 80, MAP_H - 80);
        e.x = e.slamX; e.y = e.slamY;
        banner('⚠ 落地！', '#ff44aa', 1.2);
      }
      return;
    }
    if (e.bossPhase === 'air') {
      e._bossSkipMove = true;
      e.hidden = true;
      e.phaseT -= dt;
      e.windup = Math.max(0.05, e.phaseT); // telegraph uses windup
      e.teleK = 1 - Math.max(0, e.phaseT) / 1.35;
      if (e.phaseT <= 0) {
        e.bossPhase = 'fall';
        e.phaseT = 0.28;
        e.hidden = false;
        e.jumpY = 420;
      }
      return;
    }
    if (e.bossPhase === 'fall') {
      e._bossSkipMove = true;
      e.phaseT -= dt;
      const k = 1 - Math.max(0, e.phaseT) / 0.28;
      e.jumpY = 420 * (1 - k);
      e.hidden = false;
      if (e.phaseT <= 0) {
        e.bossPhase = 'idle';
        e.jumpY = 0;
        e.hidden = false;
        e.tShoot = 3.2;
        e.windup = 0;
        const R = e.slamR || 280;
        // 砸地傷害 + 彈幕 + 震屏
        for (const p of alive) {
          if (Math.hypot(p.x - e.x, p.y - e.y) < R + 18) hurtPlayer(p, e.damage * 1.8, e);
        }
        for (const en of run.enemies) {
          // no friendly fire needed
        }
        for (let i = 0; i < 10; i++) {
          addFx(e.x, e.y, 'slam', R * (0.4 + i * 0.08), '#c040ff');
          addFx(e.x, e.y, 'ring', R * (0.35 + i * 0.07), i % 2 ? '#dd66ff' : '#fff');
        }
        addFx(e.x, e.y, 'dust', R, '#8866aa', { seed: Math.random() * 6, life: 0.9 });
        addFx(e.x, e.y, 'burst', R, '#ff66cc');
        shake(48);
        const n = 24, off = Math.random();
        for (let i = 0; i < n; i++) {
          const a = off + (Math.PI * 2 * i) / n;
          if (run.ebul.length < 220) run.ebul.push({ x: e.x, y: e.y - 40, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: 4, dmg: e.damage * 0.55, r: 12 });
        }
        e.minionCycle = (e.minionCycle || 0) + 1;
        if (e.minionCycle % 2 === 0) startPattern('ring');
      }
      return;
    }
    return;
  }

  // ——— 中 Boss：衝刺（維持）———
  e.tShoot -= dt;
  e._bossSkipMove = !!(e.dashT > 0 || e.windup > 0);
  if (e.windup > 0) {
    e.windup -= dt;
    if (e.windup <= 0) {
      if (e.dashTo) e.dashT = 0.55;
    }
  }
  if (e.dashT > 0 && e.dashTo) {
    e.dashT -= dt;
    const dx = e.dashTo.x - e.x, dy = e.dashTo.y - e.y, d = Math.hypot(dx, dy) || 1;
    e.x += (dx / d) * 720 * dt; e.y += (dy / d) * 720 * dt;
    for (const p of alive) if (Math.hypot(p.x - e.x, p.y - e.y) < e.r + 20) hurtPlayer(p, e.damage, e);
    if (e.dashT <= 0) e.dashTo = null;
  }
  if (e.tShoot <= 0 && !(e.windup > 0)) {
    e.tShoot = 3.6;
    e.windup = 0.9;
    if (alive.length) {
      const tg = alive[Math.floor(Math.random() * alive.length)];
      e.dashFrom = { x: e.x, y: e.y };
      const dx = tg.x - e.x, dy = tg.y - e.y, d = Math.hypot(dx, dy) || 1;
      e.dashTo = { x: e.x + (dx / d) * 420, y: e.y + (dy / d) * 420 };
    }
  }
}
