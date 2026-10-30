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
      const n = Math.floor(16 * tierMul(run.time));
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
      const n = Math.floor(10 * tierMul(run.time));
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
      const n = Math.floor(20 * tierMul(run.time));
      for (let i = 0; i < n; i++) {
        spawnOneEnemy(false, { kind: i % 3 ? 'bat' : 'ghost', x: x + (Math.random() - 0.5) * 140, y: y + (Math.random() - 0.5) * 140, speedMul: 1.35 });
      }
    });
  } else if (kind === 'spiral') {
    banner('⚠ 螺旋陣！', '#cc88ff', 1.6);
    addWarn('spiral', 1.5, { x: f.x, y: f.y }, (d) => {
      run.spiral = { x: d.x, y: d.y, n: 0, total: Math.floor(26 * tierMul(run.time)), acc: 0 };
    });
  } else if (kind === 'ambush') {
    banner('⚠ 伏兵！避開紅圈', '#ff4444', 1.4);
    const spots = [];
    for (const p of run.players) {
      if (p.dead) continue;
      const k = Math.floor(3 * Math.sqrt(tierMul(run.time)));
      for (let i = 0; i < k; i++) {
        const a = Math.random() * Math.PI * 2, r = 150 + Math.random() * 120;
        spots.push({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r });
      }
    }
    addWarn('ambush', 1.4, { spots }, (d) => {
      for (const s of d.spots) {
        for (let j = 0; j < 2; j++) spawnOneEnemy(false, { kind: 'ghost', x: s.x + (Math.random() - 0.5) * 30, y: s.y + (Math.random() - 0.5) * 30 });
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
  if (!run.eliteDone && t >= 120) {
    run.eliteDone = true;
    const f = cameraFocus();
    addWarn('ambush', 3, { spots: [{ x: f.x + 420, y: f.y }], big: true }, (d) => {
      spawnOneEnemy(true, { x: d.spots[0].x, y: d.spots[0].y, boss: 'elite', hpMul: 45, speedMul: 1.1 });
    });
  }
  if (!run.elite2Done && t >= 240) {
    run.elite2Done = true;
    const f = cameraFocus();
    addWarn('ambush', 3, { spots: [{ x: f.x - 420, y: f.y }], big: true }, (d) => {
      spawnOneEnemy(true, { kind: 'brute', x: d.spots[0].x, y: d.spots[0].y, boss: 'elite', hpMul: 40, speedMul: 1.15 });
    });
  }
  if (!run.bossDone && t >= 270) {
    run.bossDone = true;
    banner('☠ 大魔王降臨！撐埋最後 30 秒！', '#dd66ff', 3.2);
    const f = cameraFocus();
    addWarn('ambush', 3, { spots: [{ x: f.x, y: f.y - 380 }], big: true }, (d) => {
      spawnOneEnemy(true, { kind: 'brute', x: d.spots[0].x, y: d.spots[0].y, boss: 'boss', hpMul: 140, speedMul: 0.8 });
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
  e.tShoot -= dt;
  if (e.windup > 0) {
    e.windup -= dt;
    if (e.windup <= 0) {
      if (e.boss === 'boss') {
        const n = 20, off = Math.random();
        for (let i = 0; i < n; i++) {
          const a = off + (Math.PI * 2 * i) / n;
          if (run.ebul.length < 200) run.ebul.push({ x: e.x, y: e.y - 30, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, life: 4, dmg: e.damage * 0.6 });
        }
        e.minionCycle = (e.minionCycle || 0) + 1;
        if (e.minionCycle % 3 === 0) startPattern('ring');
      } else if (e.dashTo) {
        e.dashT = 0.55;
      }
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
    e.tShoot = e.boss === 'boss' ? 3 : 3.6;
    e.windup = 0.9;
    if (e.boss === 'elite' && alive.length) {
      const tg = alive[Math.floor(Math.random() * alive.length)];
      e.dashFrom = { x: e.x, y: e.y };
      const dx = tg.x - e.x, dy = tg.y - e.y, d = Math.hypot(dx, dy) || 1;
      e.dashTo = { x: e.x + (dx / d) * 420, y: e.y + (dy / d) * 420 };
    }
  }
}
