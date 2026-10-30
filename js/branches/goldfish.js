/** 一家倖存 · 金魚轉職：魚缸領域／急流 */
'use strict';

function fireBubbles(p, L, mods, count, speedMul) {
  const n = count || 3;
  const t = nearestEnemyTo(p.x, p.y, 480);
  const base = t ? Math.atan2(t.y - p.y, t.x - p.x) : (p.face || 0);
  const dmg = (hasB(p, '6.11') ? 16 : 12) * L * mods.projDamage;
  for (let i = 0; i < n; i++) {
    const ang = base + (i - (n - 1) / 2) * 0.2;
    pushProj(p, p.x, p.y - 10, ang, {
      damage: dmg, speed: 360 * (speedMul || 1), life: 1.2, color: '#7dd3fc',
      skill: 'br6.1', pierce: hasB(p, '6.11') ? 2 : 1, size: hasB(p, '6.11') ? 11 : 8,
      frost: true,
    });
  }
  addFx(p.x, p.y - 10, 'burst', 40, '#7dd3fc', bfx('6.1'));
  return !!t;
}

function splashWave(p, L, mods, big) {
  const r = (big ? 200 : 130) * (mods.area || 1);
  const dmg = (big ? 28 : 16) * L * mods.meleeDamage;
  damageEnemiesInRadius(p.x, p.y, r, dmg, p, { knock: big ? 160 : 80, forceChill: true });
  addFx(p.x, p.y, 'ring', r, '#38bdf8', bfx('6.2'));
  addFx(p.x, p.y, 'aura', r * 0.4, '#7dd3fc', bfx('6.2'));
  if (big) addFx(p.x, p.y, 'burst', r * 0.65, '#bae6fd', bfx('6.13'));
  if (typeof damageCagesInRadius === 'function') damageCagesInRadius(p.x, p.y, r * 0.5, dmg * 0.55, p);
}

function goldfishUlt(p) {
  if (p.ultCd > 0) return;
  const L = brScale();
  const mods = sm(p);
  const c = getChar(p.charId);
  p.ultCd = c.ult.cooldown * (hasB(p, '6.23') ? 0.85 : 1);
  p.ultMax = p.ultCd;
  p.flash = 0.55;
  if (typeof sfxUlt === 'function') sfxUlt();

  // 魚缸線
  if (hasB(p, '6.21')) {
    const R = 270 * (mods.area || 1);
    damageEnemiesInRadius(p.x, p.y, R, 60 * L * mods.meleeDamage, p, { knock: 100, forceChill: true });
    // 水族箱：周圍多隻小魚召喚
    for (let i = 0; i < 6; i++) {
      const ang = (Math.PI * 2 * i) / 6;
      run.summons.push({
        x: p.x + Math.cos(ang) * 85, y: p.y + Math.sin(ang) * 85,
        t: 0, life: 10, dmg: 12 * mods.projDamage * L, rate: 0.35, cd: 0, owner: p.slot,
        icon: '🐟', color: '#f97316', chase: true,
      });
    }
    for (let i = 0; i < 10; i++) addFx(p.x, p.y, 'ring', 50 + i * 22, i % 2 ? '#7dd3fc' : '#38bdf8', bfx('6.21'));
    addFloat(p.x, p.y - 90, '水族箱！', '#7dd3fc', true);
    shake(30);
    return;
  }
  if (hasB(p, '6.22')) {
    const R = 250 * (mods.area || 1);
    // 珍珠砲：多方向大彈
    for (let i = 0; i < 12; i++) {
      const ang = (Math.PI * 2 * i) / 12;
      pushProj(p, p.x, p.y - 12, ang, {
        damage: 28 * L * mods.projDamage, speed: 520, life: 1.4, color: '#fef3c7',
        skill: 'br6.22', pierce: 3, size: 14, frost: true,
      });
    }
    damageEnemiesInRadius(p.x, p.y, R * 0.55, 45 * L, p, { forceChill: true });
    for (let i = 0; i < 8; i++) addFx(p.x, p.y, 'burst', 60 + i * 18, '#fef3c7', bfx('6.22'));
    addFloat(p.x, p.y - 90, '珍珠砲！', '#fef3c7', true);
    shake(32);
    return;
  }
  if (p.branch[0] === '6.1') {
    const R = 230 * (mods.area || 1);
    damageEnemiesInRadius(p.x, p.y, R, 55 * L * mods.meleeDamage, p, { knock: 90, forceChill: true });
    fireBubbles(p, L, mods, 10, 1.2);
    for (let i = 0; i < 8; i++) addFx(p.x, p.y, 'ring', 50 + i * 20, '#7dd3fc', bfx('6.1'));
    addFloat(p.x, p.y - 90, '魚缸領域！', '#7dd3fc', true);
    shake(26);
    return;
  }

  // 急流線
  if (hasB(p, '6.23')) {
    const R = 320 * (mods.area || 1);
    damageEnemiesInRadius(p.x, p.y, R, 80 * L * mods.meleeDamage, p, { knock: 220, forceChill: true });
    for (let i = 0; i < 14; i++) {
      const ang = (Math.PI * 2 * i) / 14;
      pushProj(p, p.x, p.y, ang, {
        damage: 20 * L * mods.projDamage, speed: 580, life: 1.1, color: '#0ea5e9',
        skill: 'br6.23', pierce: 2, size: 10, frost: true,
      });
    }
    for (let i = 0; i < 12; i++) addFx(p.x, p.y, 'burst', 70 + i * 22, i % 2 ? '#0ea5e9' : '#bae6fd', bfx('6.23'));
    addFloat(p.x, p.y - 90, '海嘯！', '#0ea5e9', true);
    shake(36);
    return;
  }
  if (hasB(p, '6.24') || p.branch[0] === '6.2') {
    const R = 260 * (mods.area || 1);
    p.invuln = Math.max(p.invuln || 0, hasB(p, '6.24') ? 1.8 : 0.8);
    p.bDmg = Math.max(p.bDmg || 1, hasB(p, '6.24') ? 1.45 : 1.2);
    p._goldScale = hasB(p, '6.24') ? 4.5 : 2.5;
    damageEnemiesInRadius(p.x, p.y, R, 65 * L * mods.meleeDamage, p, { knock: 140, forceChill: true });
    for (let i = 0; i < 10; i++) addFx(p.x, p.y, 'aura', 50 + i * 18, '#f97316', bfx('6.24'));
    addFx(p.x, p.y, 'burst', R * 0.6, '#fdba74', bfx(hasB(p, '6.24') ? '6.24' : '6.2'));
    addFloat(p.x, p.y - 90, hasB(p, '6.24') ? '金鱗化！' : '急流！', '#f97316', true);
    shake(30);
    return;
  }

  const u = c.ult;
  const R = u.radius * (mods.area || 1) * 2.2;
  damageEnemiesInRadius(p.x, p.y, R, u.damage * mods.meleeDamage * 3, p, { forceChill: true, knock: 120 });
  for (let i = 0; i < (u.count || 12); i++) {
    const ang = (Math.PI * 2 * i) / (u.count || 12);
    pushProj(p, p.x, p.y, ang, {
      damage: 14 * mods.projDamage, speed: 400, life: 1.2, color: '#7dd3fc',
      skill: 'gf_bubble', pierce: 2, size: 9, frost: true,
    });
  }
  addFx(p.x, p.y, 'burst', R, '#7dd3fc');
  shake(20);
}

function updateGoldfishBr(p, dt, tick, L) {
  const mods = sm(p);
  if (p._goldScale > 0) p._goldScale -= dt;

  // 6.1 魚缸領域：週期泡泡
  if (p.branch[0] === '6.1') {
    const cd = hasB(p, '6.11') ? 1.6 : 2.1;
    if (tick('bub', cd)) {
      const n = hasB(p, '6.11') ? 5 : 3;
      if (!fireBubbles(p, L, mods, n, hasB(p, '6.11') ? 1.15 : 1)) p.bt.bub = 0.4;
    }
  }

  // 6.2 急流：水花衝
  if (p.branch[0] === '6.2') {
    const cd = hasB(p, '6.13') ? 1.7 : 2.2;
    if (tick('flow', cd)) splashWave(p, L, mods, hasB(p, '6.13'));
  }

  // 6.11 泡泡盾
  if (hasB(p, '6.11')) {
    p.bt.bshield = (p.bt.bshield || 0) - dt;
    if (p.bt.bshield <= 0) {
      p.bt.bshield = 2.8;
      p.shield = Math.min(80, (p.shield || 0) + 18);
      addFx(p.x, p.y, 'ring', 70, '#7dd3fc', bfx('6.11'));
      addFx(p.x, p.y, 'icon', 36, '#fff', Object.assign({ icon: '🫧', life: 0.5 }, bfx('6.11')));
    }
  }

  // 6.12 餵食時間：補隊友＋小魚
  if (hasB(p, '6.12') && tick('feed', 5.5)) {
    for (const ally of run.players) {
      if (ally.dead) continue;
      applyHeal(p, ally, 22 * mods.healPower * L);
    }
    for (let i = 0; i < 2; i++) {
      const ang = (Math.PI * 2 * i) / 2 + run.time;
      run.summons.push({
        x: p.x + Math.cos(ang) * 50, y: p.y + Math.sin(ang) * 50,
        t: 0, life: 7, dmg: 10 * mods.projDamage * L, rate: 0.4, cd: 0, owner: p.slot,
        icon: '🐠', color: '#fdba74', chase: true,
      });
    }
    addFx(p.x, p.y, 'heal', 90, '#7dd3fc', bfx('6.12'));
    addFloat(p.x, p.y - 70, '餵食！', '#fdba74', true);
  }

  // 6.14 魚群衝
  if (hasB(p, '6.14') && tick('school', 3.2)) {
    const t = nearestEnemyTo(p.x, p.y, 420);
    const base = t ? Math.atan2(t.y - p.y, t.x - p.x) : (p.face || 0);
    for (let i = 0; i < 6; i++) {
      const ang = base + (i - 2.5) * 0.12;
      pushProj(p, p.x, p.y - 8, ang, {
        damage: 14 * L * mods.projDamage, speed: 500, life: 1.0, color: '#f97316',
        skill: 'br6.14', pierce: 2, size: 9, frost: true,
      });
    }
    addFx(p.x, p.y, 'burst', 55, '#f97316', bfx('6.14'));
    addFx(p.x, p.y, 'icon', 40, '#fff', Object.assign({ icon: '🐟', life: 0.55 }, bfx('6.14')));
  }

  // 6.13 龍捲水被動加強已在 splashWave；再加週期小龍捲
  if (hasB(p, '6.13') && tick('tornado', 4.2)) {
    const t = nearestEnemyTo(p.x, p.y, 400);
    const x = t ? t.x : p.x;
    const y = t ? t.y : p.y;
    damageEnemiesInRadius(x, y, 110, 32 * L * mods.meleeDamage, p, { knock: 180, forceChill: true });
    addFx(x, y, 'aura', 90, '#0ea5e9', bfx('6.13'));
    addFx(x, y, 'ring', 110, '#bae6fd', bfx('6.13'));
  }

  // 6.24 金鱗化：短暫期間火環式水傷
  if (hasB(p, '6.24') && p._goldScale > 0) {
    p.bt.scale = (p.bt.scale || 0) - dt;
    if (p.bt.scale <= 0) {
      p.bt.scale = 0.35;
      damageEnemiesInRadius(p.x, p.y, 100, 14 * L * mods.meleeDamage, p, { forceChill: true });
      if (fxFull()) addFx(p.x, p.y, 'aura', 70, '#f97316', bfx('6.24'));
    }
  }

  // 6.21 水族微魚
  if (hasB(p, '6.21') && tick('tankFish', 5)) {
    for (let i = 0; i < 2; i++) {
      const ang = run.time + i * Math.PI;
      run.summons.push({
        x: p.x + Math.cos(ang) * 55, y: p.y + Math.sin(ang) * 55,
        t: 0, life: 6, dmg: 11 * mods.projDamage * L, rate: 0.38, cd: 0, owner: p.slot,
        icon: '🐟', color: '#f97316', chase: true,
      });
    }
  }
}
