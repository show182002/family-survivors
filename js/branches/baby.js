/** 一家倖存 · 寶寶轉職：玩具工房／哭王 */
'use strict';

function tossToyBomb(p, L, mods, count, spreadR) {
  const n = count || 1;
  const baseR = (hasB(p, '5.11') ? 120 : 90) * (mods.area || 1);
  const dmg = (hasB(p, '5.11') ? 28 : 18) * L * mods.projDamage;
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * (spreadR || 110);
    const x = p.x + Math.cos(ang) * dist;
    const y = p.y + Math.sin(ang) * dist;
    damageEnemiesInRadius(x, y, baseR, dmg, p, { knock: 60, forcePoison: Math.random() < 0.35 });
    addFx(x, y, 'burst', baseR * 0.55, '#7ec8ff', bfx('5.1'));
    addFx(x, y, 'slam', baseR * 0.4, '#ffe0a0', bfx('5.1'));
    if (typeof damageCagesInRadius === 'function') damageCagesInRadius(x, y, baseR * 0.45, dmg * 0.5, p);
  }
  addFx(p.x, p.y, 'icon', 44, '#fff', Object.assign({ icon: '🧸', life: 0.5 }, bfx('5.1')));
  return true;
}

function cryPulse(p, L, mods, strong) {
  const r = (strong ? 200 : 140) * (mods.area || 1);
  const dmg = (strong ? 22 : 12) * L * mods.meleeDamage;
  damageEnemiesInRadius(p.x, p.y, r, dmg, p, { knock: strong ? 90 : 40, forceChill: true });
  for (const e of run.enemies) {
    if (e.hp <= 0) continue;
    if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 > r * r) continue;
    e.chill = Math.max(e.chill || 0, strong ? 1.2 : 0.6);
    e.chillFactor = Math.min(e.chillFactor || 1, strong ? 0.4 : 0.55);
  }
  addFx(p.x, p.y, 'ring', r, '#a8d8ff', bfx('5.2'));
  addFx(p.x, p.y, 'aura', r * 0.4, '#7ec8ff', bfx('5.2'));
  if (strong) addFx(p.x, p.y, 'burst', r * 0.6, '#cceeff', bfx('5.13'));
}

function babyUlt(p) {
  if (p.ultCd > 0) return;
  const L = brScale();
  const mods = sm(p);
  const c = getChar(p.charId);
  p.ultCd = c.ult.cooldown * (hasB(p, '5.21') ? 0.88 : 1);
  p.ultMax = p.ultCd;
  p.flash = 0.55;
  if (typeof sfxUlt === 'function') sfxUlt();

  // 玩具線終局
  if (hasB(p, '5.21')) {
    const R = 260 * (mods.area || 1);
    damageEnemiesInRadius(p.x, p.y, R, 70 * L * mods.projDamage, p, { knock: 100, forcePoison: true });
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 * i) / 8;
      run.summons.push({
        x: p.x + Math.cos(ang) * 90, y: p.y + Math.sin(ang) * 90,
        t: 0, life: 10, dmg: 14 * mods.projDamage * L, rate: 0.38, cd: 0, owner: p.slot,
        icon: '🧸', color: '#7ec8ff', chase: true,
      });
    }
    for (let i = 0; i < 10; i++) addFx(p.x, p.y, 'burst', 70 + i * 20, i % 2 ? '#7ec8ff' : '#ffe0a0', bfx('5.21'));
    addFloat(p.x, p.y - 90, '玩具大軍！', '#7ec8ff', true);
    shake(32);
    return;
  }
  if (hasB(p, '5.22')) {
    const R = 240 * (mods.area || 1);
    // 尿布地雷場：多點毒爆
    for (let i = 0; i < 10; i++) {
      const ang = (Math.PI * 2 * i) / 10;
      const x = p.x + Math.cos(ang) * (70 + (i % 3) * 35);
      const y = p.y + Math.sin(ang) * (70 + (i % 3) * 35);
      damageEnemiesInRadius(x, y, 85, 48 * L * mods.projDamage, p, { forcePoison: true, knock: 70 });
      addFx(x, y, 'burst', 70, '#a3e635', bfx('5.22'));
      addFx(x, y, 'slam', 55, '#7ec8ff', bfx('5.22'));
    }
    damageEnemiesInRadius(p.x, p.y, R, 40 * L, p, { forceChill: true });
    addFloat(p.x, p.y - 90, '尿布地雷！', '#a3e635', true);
    shake(30);
    return;
  }
  if (p.branch[0] === '5.1') {
    const R = 230 * (mods.area || 1);
    damageEnemiesInRadius(p.x, p.y, R, 65 * L * mods.projDamage, p, { knock: 90, forcePoison: true });
    tossToyBomb(p, L, mods, 5, 160);
    for (let i = 0; i < 8; i++) addFx(p.x, p.y, 'burst', 60 + i * 22, '#7ec8ff', bfx('5.1'));
    addFloat(p.x, p.y - 90, '玩具工房！', '#7ec8ff', true);
    shake(28);
    return;
  }

  // 哭王終局
  if (hasB(p, '5.23')) {
    const R = 300 * (mods.area || 1);
    damageEnemiesInRadius(p.x, p.y, R, 75 * L * mods.meleeDamage, p, { knock: 140, forceChill: true });
    for (const e of run.enemies) {
      if (e.hp <= 0) continue;
      e.chill = Math.max(e.chill || 0, 2.5);
      e.chillFactor = Math.min(e.chillFactor || 1, 0.3);
      e.stun = Math.max(e.stun || 0, 0.6);
    }
    for (let i = 0; i < 12; i++) addFx(p.x, p.y, 'ring', 50 + i * 24, i % 2 ? '#7ec8ff' : '#fff', bfx('5.23'));
    addFloat(p.x, p.y - 90, '世界哭！', '#7ec8ff', true);
    shake(34);
    return;
  }
  if (hasB(p, '5.24') || p.branch[0] === '5.2') {
    const R = 250 * (mods.area || 1);
    for (const ally of run.players) {
      if (ally.dead) continue;
      if ((ally.x - p.x) ** 2 + (ally.y - p.y) ** 2 > R * R) continue;
      applyHeal(p, ally, 40 * mods.healPower * L);
      ally.shield = Math.min(100, (ally.shield || 0) + (hasB(p, '5.24') ? 45 : 20));
      ally.invuln = Math.max(ally.invuln || 0, hasB(p, '5.24') ? 1.2 : 0.5);
    }
    damageEnemiesInRadius(p.x, p.y, R * 0.85, 50 * L * mods.meleeDamage, p, { knock: 100, forceChill: true });
    for (let i = 0; i < 10; i++) addFx(p.x, p.y, 'heal', 60 + i * 18, '#a8e0ff', bfx('5.24'));
    addFx(p.x, p.y, 'ring', R, '#cceeff', bfx(hasB(p, '5.24') ? '5.24' : '5.2'));
    addFloat(p.x, p.y - 90, hasB(p, '5.24') ? '安撫結界！' : '哭王！', '#a8d8ff', true);
    shake(28);
    return;
  }

  // fallback diaper nuke
  const u = c.ult;
  const R = u.radius * (mods.area || 1) * 2.2;
  const dmg = u.damage * mods.meleeDamage * 3;
  damageEnemiesInRadius(p.x, p.y, R, dmg, p, { forceChill: true, forcePoison: true, knock: 90 });
  addFx(p.x, p.y, 'burst', R, '#7ec8ff');
  shake(20);
}

function updateBabyBr(p, dt, tick, L) {
  const mods = sm(p);

  // 5.1 玩具工房：週期丟玩具彈
  if (p.branch[0] === '5.1') {
    const cd = hasB(p, '5.11') ? 1.9 : 2.4;
    if (tick('toy', cd)) {
      const n = hasB(p, '5.11') ? 3 : 1;
      tossToyBomb(p, L, mods, n, hasB(p, '5.11') ? 140 : 100);
    }
  }

  // 5.2 哭王：強化哭脈衝
  if (p.branch[0] === '5.2') {
    const cd = hasB(p, '5.13') ? 1.8 : 2.3;
    if (tick('cry', cd)) cryPulse(p, L, mods, hasB(p, '5.13'));
  }

  // 5.12 遙控車
  if (hasB(p, '5.12') && tick('rc', 5.5)) {
    for (let i = 0; i < 2; i++) {
      const ang = run.time + i * Math.PI;
      run.summons.push({
        x: p.x + Math.cos(ang) * 55, y: p.y + Math.sin(ang) * 55,
        t: 0, life: 8, dmg: 13 * mods.projDamage * L, rate: 0.32, cd: 0, owner: p.slot,
        icon: '🏎️', color: '#7ec8ff', chase: true,
      });
    }
    addFx(p.x, p.y, 'burst', 55, '#7ec8ff', bfx('5.12'));
    addFx(p.x, p.y, 'icon', 48, '#fff', Object.assign({ icon: '🏎️', life: 0.7 }, bfx('5.12')));
    addFloat(p.x, p.y - 70, '遙控車！', '#7ec8ff', true);
  }

  // 5.14 搖籃震
  if (hasB(p, '5.14') && tick('cradle', 2.9)) {
    const r = 175 * (mods.area || 1);
    damageEnemiesInRadius(p.x, p.y, r, 26 * L * mods.meleeDamage, p, { knock: 200, forceChill: true });
    addFx(p.x, p.y, 'slam', r, '#a8d8ff', bfx('5.14'));
    addFx(p.x, p.y, 'ring', r * 0.85, '#fff', bfx('5.14'));
    shake(8);
  }

  // 5.11 積木城被動：週期小城牆傷
  if (hasB(p, '5.11') && tick('blocks', 3.5)) {
    const r = 130;
    damageEnemiesInRadius(p.x, p.y, r, 18 * L * mods.meleeDamage, p, { knock: 50 });
    addFx(p.x, p.y, 'slam', r * 0.7, '#fbbf24', bfx('5.11'));
    addFx(p.x, p.y, 'icon', 40, '#fff', Object.assign({ icon: '🧱', life: 0.5 }, bfx('5.11')));
  }

  // 5.22 尿布地雷被動：週期埋雷
  if (hasB(p, '5.22') && tick('mine', 3.8)) {
    const t = nearestEnemyTo(p.x, p.y, 380);
    const x = t ? t.x : p.x + (Math.random() - 0.5) * 160;
    const y = t ? t.y : p.y + (Math.random() - 0.5) * 160;
    damageEnemiesInRadius(x, y, 95, 30 * L * mods.projDamage, p, { forcePoison: true, knock: 80 });
    addFx(x, y, 'burst', 80, '#a3e635', bfx('5.22'));
    addFx(x, y, 'icon', 36, '#fff', Object.assign({ icon: '💣', life: 0.55 }, bfx('5.22')));
  }

  // 5.24 安撫結界常駐
  if (hasB(p, '5.24')) {
    p.bt.soothe = (p.bt.soothe || 0) - dt;
    if (p.bt.soothe <= 0) {
      p.bt.soothe = 0.45;
      const r = 160;
      for (const ally of run.players) {
        if (ally.dead) continue;
        if ((ally.x - p.x) ** 2 + (ally.y - p.y) ** 2 < r * r) {
          ally.hp = Math.min(ally.maxHp, ally.hp + 5 * mods.healPower);
          ally.shield = Math.min(50, (ally.shield || 0) + 2);
        }
      }
      if (fxFull() && skillFxOn('br5.24')) addFx(p.x, p.y, 'aura', r * 0.4, '#a8e0ff', bfx('5.24'));
    }
    for (const e of run.enemies) {
      if (e.hp <= 0) continue;
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < 160 * 160) {
        e.chill = Math.max(e.chill || 0, 0.25);
        e.chillFactor = Math.min(e.chillFactor || 1, 0.6);
      }
    }
  }

  // 5.21 玩具仔小光環
  if (hasB(p, '5.21') && tick('armyAura', 4.5)) {
    for (let i = 0; i < 2; i++) {
      const ang = (Math.PI * 2 * i) / 2 + run.time;
      run.summons.push({
        x: p.x + Math.cos(ang) * 60, y: p.y + Math.sin(ang) * 60,
        t: 0, life: 6, dmg: 11 * mods.projDamage * L, rate: 0.4, cd: 0, owner: p.slot,
        icon: '🧸', color: '#7ec8ff', chase: true,
      });
    }
  }
}
