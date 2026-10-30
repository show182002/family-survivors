/** 一家倖存 · 媽媽轉職：暖湯局／紅龍怒 */
'use strict';

function momUlt(p) {
  if (p.ultCd > 0) return;
  const L = brScale();
  const mods = sm(p);
  p.ultCd = (getChar(p.charId).ult.cooldown) * (hasB(p, '3.21') ? 0.85 : 1);
  p.ultMax = p.ultCd;
  p.flash = 0.55;
  if (typeof sfxUlt === 'function') sfxUlt();

  if (hasB(p, '3.21') || (p.branch[0] === '3.1' && hasB(p, '3.1'))) {
    // 仙湯／暖湯大招：超大治療＋輕火傷敵人
    const R = 260 * (mods.area || 1);
    for (const ally of run.players) {
      if (ally.dead) continue;
      applyHeal(p, ally, 55 * mods.healPower * L);
      if (hasB(p, '3.21')) ally.invuln = Math.max(ally.invuln || 0, 1.2);
    }
    damageEnemiesInRadius(p.x, p.y, R * 0.7, 40 * L, p, { knock: 40 });
    for (let i = 0; i < 10; i++) {
      addFx(p.x, p.y, 'heal', 80 + i * 22, '#88ffcc', bfx('3.21'));
      addFx(p.x, p.y, 'ring', 70 + i * 28, i % 2 ? '#ffe566' : '#88ffaa', bfx('3.1'));
    }
    addFx(p.x, p.y, 'burst', R, '#fff0aa', bfx('3.21'));
    addFloat(p.x, p.y - 90, hasB(p, '3.21') ? '神仙湯！' : '暖湯！', '#ffe566', true);
    shake(28);
    return;
  }

  if (hasB(p, '3.24') || p.branch[0] === '3.2') {
    const R = 280 * (mods.area || 1) * (mods.fireRadius || 1);
    const dmg = 90 * mods.fireDamage * L * (hasB(p, '3.23') ? 1.5 : 1) * 3;
    if (hasB(p, '3.24')) {
      coneDamage(p, p.x, p.y, 0, 0.7, R, dmg, { forceBurn: true });
      coneDamage(p, p.x, p.y, Math.PI, 0.7, R, dmg, { forceBurn: true });
      for (let i = 0; i < 8; i++) {
        addFx(p.x, p.y - 20, 'fire_cone', R * (0.5 + i * 0.06), '#ff4422', Object.assign({ ang: 0, half: 0.7, life: 0.5 }, bfx('3.24')));
        addFx(p.x, p.y - 20, 'fire_cone', R * (0.5 + i * 0.06), '#ffaa33', Object.assign({ ang: Math.PI, half: 0.7, life: 0.5 }, bfx('3.24')));
      }
    } else {
      damageEnemiesInRadius(p.x, p.y, R, dmg, p, { forceBurn: true, knock: 100 });
      for (let i = 0; i < 10; i++) {
        addFx(p.x, p.y, 'fire_cone', R * (0.5 + i * 0.05), i % 2 ? '#ff4422' : '#ffaa33', bfx('3.2'));
        addFx(p.x, p.y, 'fire', R * (0.3 + i * 0.04), '#ff6622', bfx('3.2'));
      }
    }
    for (const ally of run.players) {
      if (!ally.dead) applyHeal(p, ally, 30 * mods.healPower);
    }
    addFx(p.x, p.y, 'burst', R, '#ff8866', bfx('3.2'));
    addFloat(p.x, p.y - 90, hasB(p, '3.24') ? '雙龍息！' : '紅龍息！', '#ff6644', true);
    shake(32);
    return;
  }

  // fallback default mom dragon
  const c = getChar(p.charId);
  const u = c.ult;
  const area = (mods.area || 1) * (mods.fireRadius || 1) * 2.5;
  const dmg = u.damage * mods.fireDamage * 3;
  const R = u.radius * area;
  damageEnemiesInRadius(p.x, p.y, R, dmg, p, { forceBurn: true, knock: 100 });
  for (const ally of run.players) {
    if (!ally.dead) applyHeal(p, ally, u.heal * mods.healPower);
  }
  for (let i = 0; i < 10; i++) {
    addFx(p.x, p.y, 'fire_cone', R * (0.5 + i * 0.06), i % 2 ? '#ff4422' : '#ffaa33');
  }
  addFx(p.x, p.y, 'heal', 180, '#88ffaa');
  shake(20);
}

function updateMomBr(p, dt, tick, L) {
  const mods = sm(p);
  // 3.1 煲湯
  if (p.branch[0] === '3.1' && tick('soup', hasB(p, '3.21') ? 2.2 : 3)) {
    const r = hasB(p, '3.21') ? 200 : 130;
    const heal = (hasB(p, '3.21') ? 28 : 14) * mods.healPower * L;
    for (const ally of run.players) {
      if (ally.dead) continue;
      if ((ally.x - p.x) ** 2 + (ally.y - p.y) ** 2 > r * r) continue;
      applyHeal(p, ally, heal);
      if (hasB(p, '3.21')) ally.invuln = Math.max(ally.invuln || 0, 0.35);
    }
    addFx(p.x, p.y, 'heal', r, '#88ffcc', bfx('3.1'));
    addFx(p.x, p.y, 'ring', r * 0.7, '#ffe566', bfx('3.1'));
  }
  // 3.2 龍焰
  if (p.branch[0] === '3.2' && tick('breath', 2.4)) {
    const t = nearestEnemyTo(p.x, p.y, 460);
    if (t) {
      const ang = Math.atan2(t.y - p.y, t.x - p.x);
      const r = 210 * (hasB(p, '3.23') ? 1.35 : 1);
      const dmg = 30 * L * mods.fireDamage * (hasB(p, '3.23') ? 1.5 : 1);
      if (hasB(p, '3.24')) {
        coneDamage(p, p.x, p.y, ang, 0.55, r, dmg, { forceBurn: true });
        coneDamage(p, p.x, p.y, ang + Math.PI, 0.55, r, dmg, { forceBurn: true });
        addFx(p.x, p.y - 20, 'fire_cone', r, '#ff7a22', Object.assign({ ang, half: 0.55, life: 0.45 }, bfx('3.24')));
        addFx(p.x, p.y - 20, 'fire_cone', r, '#ffaa44', Object.assign({ ang: ang + Math.PI, half: 0.55, life: 0.45 }, bfx('3.24')));
      } else {
        coneDamage(p, p.x, p.y, ang, 0.55, r, dmg, { forceBurn: true });
        addFx(p.x, p.y - 20, 'fire_cone', r, '#ff7a22', Object.assign({ ang, half: 0.55, life: 0.45 }, bfx('3.2')));
      }
    } else p.bt.breath = 0.5;
  }
  // 3.11 全家飯桌
  if (hasB(p, '3.11') && tick('table', 6)) {
    for (const ally of run.players) {
      if (ally.dead) continue;
      applyHeal(p, ally, 36 * mods.healPower * L);
      ally.atkBuff = Math.max(ally.atkBuff || 0, 2.5);
      ally._momSpeed = 2.5;
    }
    for (let i = 0; i < 8; i++) addFx(p.x, p.y, 'heal', 90 + i * 20, '#ffe566', bfx('3.11'));
    addFx(p.x, p.y, 'icon', 64, '#fff', Object.assign({ icon: '🍱', life: 1 }, bfx('3.11')));
    addFloat(p.x, p.y - 80, '開飯！', '#ffe566', true);
    shake(8);
  }
  // 3.12 補品快遞
  if (hasB(p, '3.12') && tick('tonic', 4)) {
    run.momTonics = run.momTonics || [];
    for (const ally of run.players) {
      if (ally.dead || ally === p) continue;
      run.momTonics.push({ x: p.x, y: p.y - 20, tx: ally.slot, t: 0, life: 2.5, owner: p.slot });
    }
    // self tonic
    run.momTonics.push({ x: p.x, y: p.y - 20, tx: p.slot, t: 0, life: 1.2, owner: p.slot });
    addFx(p.x, p.y, 'burst', 50, '#88ffaa', bfx('3.12'));
  }
  // 3.13 連環吼 — handled as rage triple in weapons via flag; here pulse
  if (hasB(p, '3.13') && tick('roar', 3.2)) {
    const rr = 140 * (mods.area || 1);
    const dmg = 22 * L * mods.fireDamage;
    for (let k = 0; k < 3; k++) {
      const delay = k;
      // immediate staggered via same frame offsets
      damageEnemiesInRadius(p.x, p.y, rr * (0.85 + k * 0.1), dmg, p, { forceBurn: true, knock: 50 });
      addFx(p.x, p.y, 'slam', rr * (0.7 + k * 0.15), '#ff6644', bfx('3.13'));
      addFx(p.x, p.y, 'ring', rr * (0.5 + k * 0.2), '#ffaa66', bfx('3.13'));
    }
    shake(10);
  }
  // 3.14 衣架風暴
  if (hasB(p, '3.14') && tick('hanger', 2.8)) {
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 * i) / 8 + run.time;
      pushProj(p, p.x, p.y - 20, ang, {
        damage: 16 * L * mods.projDamage, speed: 480, size: 8, color: '#ddaa88',
        skill: 'br3.14', life: 1.1, pierce: 2,
      });
    }
    addFx(p.x, p.y, 'burst', 70, '#ddaa88', bfx('3.14'));
    addFx(p.x, p.y, 'icon', 48, '#fff', Object.assign({ icon: '🧷', life: 0.6 }, bfx('3.14')));
  }
  // 3.22 廚房結界
  if (hasB(p, '3.22')) {
    p.bt.zone = (p.bt.zone || 0) - dt;
    if (p.bt.zone <= 0) {
      p.bt.zone = 0.4;
      const r = 170;
      for (const ally of run.players) {
        if (ally.dead) continue;
        if ((ally.x - p.x) ** 2 + (ally.y - p.y) ** 2 < r * r) {
          ally.hp = Math.min(ally.maxHp, ally.hp + 5 * mods.healPower * dt * 2.5);
        }
      }
      damageEnemiesInRadius(p.x, p.y, r, 8 * L, p);
      if (fxFull() && skillFxOn('br3.22')) addFx(p.x, p.y, 'aura', r * 0.4, '#88e0ff', bfx('3.22'));
    }
    for (const e of run.enemies) {
      if (e.hp <= 0) continue;
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < 170 * 170) {
        e.chill = Math.max(e.chill || 0, 0.3);
        e.chillFactor = Math.min(e.chillFactor || 1, 0.55);
      }
    }
  }
  // 3.23 巨龍化火環
  if (hasB(p, '3.23')) {
    p.bt.fring = (p.bt.fring || 0) - dt;
    if (p.bt.fring <= 0) {
      p.bt.fring = 0.35;
      damageEnemiesInRadius(p.x, p.y, 95, 14 * L * mods.fireDamage, p, { forceBurn: Math.random() < 0.4 });
      if (fxFull()) addFx(p.x, p.y, 'fire_aura', 70, '#ff5522', bfx('3.23'));
    }
  }
  // 飯桌移速 buff
  if (p._momSpeed > 0) p._momSpeed -= dt;
}

function updateMomTonics(dt) {
  if (!run.momTonics || !run.momTonics.length) return;
  const L = brScale();
  for (const t of run.momTonics) {
    t.t += dt;
    const ally = run.players[t.tx];
    const owner = run.players[t.owner];
    if (!ally || ally.dead || !owner) { t.done = true; continue; }
    const dx = ally.x - t.x, dy = ally.y - 20 - t.y, d = Math.hypot(dx, dy) || 1;
    t.x += dx / d * 420 * dt;
    t.y += dy / d * 420 * dt;
    if (d < 28) {
      applyHeal(owner, ally, 22 * sm(owner).healPower * L);
      ally.shield = Math.min(60, (ally.shield || 0) + 18);
      addFx(ally.x, ally.y, 'heal', 40, '#88ffaa', bfx('3.12'));
      t.done = true;
    }
    if (t.t >= t.life) t.done = true;
  }
  run.momTonics = run.momTonics.filter((t) => !t.done);
}

function drawMomTonics(cam) {
  if (!run.momTonics) return;
  for (const t of run.momTonics) {
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💊', t.x - cam.x, t.y - cam.y);
  }
}
