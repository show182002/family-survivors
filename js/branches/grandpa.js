/** 一家倖存 · 阿公轉職：象棋局／太極氣 */
'use strict';

function fireChessCannon(p, L, mods, count, spread) {
  const t = nearestEnemyTo(p.x, p.y, 520);
  if (!t) return false;
  const base = Math.atan2(t.y - p.y, t.x - p.x);
  const n = count || 1;
  const dmg = (hasB(p, '4.11') ? 28 : 20) * L * mods.projDamage;
  for (let i = 0; i < n; i++) {
    const ang = base + (i - (n - 1) / 2) * (spread || 0.18);
    pushProj(p, p.x, p.y - 18, ang, {
      damage: dmg, speed: 560, life: 1.15, color: '#c9a227',
      skill: 'br4.1', pierce: hasB(p, '4.11') ? 2 : 1, size: hasB(p, '4.11') ? 12 : 9,
      frost: true,
    });
  }
  addFx(p.x, p.y - 18, 'burst', 50, '#ffe08a', bfx('4.1'));
  addFx(p.x, p.y - 18, 'icon', 40, '#fff', Object.assign({ icon: '♟️', life: 0.45 }, bfx('4.1')));
  return true;
}

function qiWave(p, L, mods) {
  const big = hasB(p, '4.23');
  const r = (big ? 200 : 140) * (mods.area || 1);
  const dmg = (big ? 26 : 16) * L * mods.meleeDamage;
  damageEnemiesInRadius(p.x, p.y, r, dmg, p, { knock: big ? 160 : 100, forceChill: true });
  addFx(p.x, p.y, 'ring', r, '#a8e0ff', bfx('4.2'));
  addFx(p.x, p.y, 'aura', r * 0.45, '#88ccee', bfx('4.2'));
  if (big) addFx(p.x, p.y, 'burst', r * 0.7, '#ddeeff', bfx('4.23'));
}

function grandpaUlt(p) {
  if (p.ultCd > 0) return;
  const L = brScale();
  const mods = sm(p);
  const c = getChar(p.charId);
  p.ultCd = c.ult.cooldown * (hasB(p, '4.23') ? 0.85 : 1);
  p.ultMax = p.ultCd;
  p.flash = 0.55;
  if (typeof sfxUlt === 'function') sfxUlt();

  // 象棋終局
  if (hasB(p, '4.21') || (p.branch[0] === '4.1' && hasB(p, '4.22'))) {
    if (hasB(p, '4.21')) {
      const R = 280 * (mods.area || 1);
      // 斬殺低血＋大傷
      for (const e of run.enemies) {
        if (e.hp <= 0) continue;
        if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 > R * R) continue;
        if (e.hp / (e.maxHp || e.hp) <= 0.35) hurtEnemy(e, e.hp + 1, p, { fx: e.x, fy: e.y });
        else hurtEnemy(e, 70 * L * mods.meleeDamage, p, { knock: 80 });
      }
      if (typeof damageCagesInRadius === 'function') damageCagesInRadius(p.x, p.y, R * 0.5, 40 * L, p);
      for (let i = 0; i < 10; i++) addFx(p.x, p.y, 'burst', 90 + i * 22, i % 2 ? '#c9a227' : '#ffe08a', bfx('4.21'));
      addFx(p.x, p.y, 'ring', R, '#ffe08a', bfx('4.21'));
      addFloat(p.x, p.y - 90, '殘局殺！', '#ffe08a', true);
      shake(34);
      return;
    }
    // 4.22 雙車錯
    const R = 320 * (mods.area || 1);
    const dmg = 55 * L * mods.meleeDamage;
    for (let k = 0; k < 2; k++) {
      const ang = k === 0 ? 0 : Math.PI / 2;
      for (let i = -4; i <= 4; i++) {
        const x = p.x + Math.cos(ang) * i * 55;
        const y = p.y + Math.sin(ang) * i * 55;
        damageEnemiesInRadius(x, y, 70, dmg, p, { knock: 120, forceChill: true });
        addFx(x, y, 'slam', 70, '#c9a227', bfx('4.22'));
      }
    }
    addFx(p.x, p.y, 'burst', R * 0.5, '#ffe08a', bfx('4.22'));
    addFloat(p.x, p.y - 90, '雙車錯！', '#ffe08a', true);
    shake(32);
    return;
  }

  if (p.branch[0] === '4.1') {
    // 象棋大招：砲雨＋祖先魂
    const R = 240 * (mods.area || 1);
    damageEnemiesInRadius(p.x, p.y, R, 60 * L * mods.meleeDamage, p, { knock: 110, forceChill: true });
    for (let i = 0; i < 10; i++) {
      const ang = (Math.PI * 2 * i) / 10;
      pushProj(p, p.x, p.y - 10, ang, {
        damage: 22 * L * mods.projDamage, speed: 520, life: 1.2, color: '#c9a227',
        skill: 'br4.1', pierce: 2, size: 11, frost: true,
      });
    }
    for (let i = 0; i < 4; i++) {
      const ang = (Math.PI * 2 * i) / 4;
      run.summons.push({
        x: p.x + Math.cos(ang) * 80, y: p.y + Math.sin(ang) * 80,
        t: 0, life: 9, dmg: 14 * mods.projDamage * L, rate: 0.4, cd: 0, owner: p.slot,
        icon: '♟️', color: '#ffe08a',
      });
    }
    for (let i = 0; i < 8; i++) addFx(p.x, p.y, 'burst', 70 + i * 20, '#c9a227', bfx('4.1'));
    addFloat(p.x, p.y - 90, '象棋局！', '#ffe08a', true);
    shake(28);
    return;
  }

  // 太極終局
  if (hasB(p, '4.24')) {
    const R = 260 * (mods.area || 1);
    for (const ally of run.players) {
      if (ally.dead) continue;
      ally.shield = Math.min(120, (ally.shield || 0) + 55);
      ally.invuln = Math.max(ally.invuln || 0, 1.0);
      applyHeal(p, ally, 35 * mods.healPower * L);
    }
    damageEnemiesInRadius(p.x, p.y, R, 70 * L * mods.meleeDamage, p, { knock: 200 });
    for (let i = 0; i < 10; i++) addFx(p.x, p.y, 'ring', 60 + i * 24, i % 2 ? '#a8e0ff' : '#fff', bfx('4.24'));
    addFx(p.x, p.y, 'burst', R, '#88ccee', bfx('4.24'));
    addFloat(p.x, p.y - 90, '以柔克剛！', '#a8e0ff', true);
    shake(30);
    return;
  }

  if (hasB(p, '4.23') || p.branch[0] === '4.2') {
    const R = 250 * (mods.area || 1);
    p.invuln = Math.max(p.invuln || 0, hasB(p, '4.23') ? 2.2 : 1.4);
    for (const ally of run.players) {
      if (ally.dead) continue;
      if ((ally.x - p.x) ** 2 + (ally.y - p.y) ** 2 < R * R) {
        ally.invuln = Math.max(ally.invuln || 0, hasB(p, '4.23') ? 1.4 : 0.8);
        applyHeal(p, ally, 40 * mods.healPower * L);
      }
    }
    damageEnemiesInRadius(p.x, p.y, R, 55 * L * mods.meleeDamage, p, { knock: 140, forceChill: true });
    for (let i = 0; i < 10; i++) addFx(p.x, p.y, 'aura', 50 + i * 18, '#88ccee', bfx('4.2'));
    addFx(p.x, p.y, 'ring', R, '#ddeeff', bfx(hasB(p, '4.23') ? '4.23' : '4.2'));
    addFloat(p.x, p.y - 90, hasB(p, '4.23') ? '太極化境！' : '太極氣！', '#a8e0ff', true);
    shake(28);
    return;
  }

  // fallback default army
  const u = c.ult;
  const area = (mods.area || 1) * 2.2;
  const dmg = u.damage * mods.meleeDamage * 3;
  const R = u.radius * area;
  damageEnemiesInRadius(p.x, p.y, R, dmg, p, { knock: 120, forceChill: true });
  for (let i = 0; i < (u.summons || 4); i++) {
    const ang = (Math.PI * 2 * i) / (u.summons || 4);
    run.summons.push({
      x: p.x + Math.cos(ang) * 70, y: p.y + Math.sin(ang) * 70,
      t: 0, life: u.spiritDur || 10, dmg: (u.spiritDmg || 12) * mods.projDamage * 1.5,
      rate: u.spiritRate || 0.45, cd: 0, owner: p.slot,
      icon: '👻', color: '#ffe08a',
    });
  }
  addFx(p.x, p.y, 'burst', R, '#c9a227');
  shake(20);
}

function updateGrandpaBr(p, dt, tick, L) {
  const mods = sm(p);

  // 4.1 砲擊／4.11 連環砲
  if (p.branch[0] === '4.1') {
    const cd = hasB(p, '4.11') ? 1.7 : 2.2;
    if (tick('cannon', cd)) {
      const n = hasB(p, '4.11') ? 3 : 1;
      if (!fireChessCannon(p, L, mods, n, hasB(p, '4.11') ? 0.22 : 0.15)) p.bt.cannon = 0.45;
    }
  }

  // 4.2 氣波
  if (p.branch[0] === '4.2') {
    const cd = hasB(p, '4.23') ? 1.8 : 2.5;
    if (tick('qi', cd)) qiWave(p, L, mods);
  }

  // 4.12 過河卒
  if (hasB(p, '4.12') && tick('pawn', 6)) {
    for (let i = 0; i < 3; i++) {
      const ang = (Math.PI * 2 * i) / 3 + run.time;
      run.summons.push({
        x: p.x + Math.cos(ang) * 50, y: p.y + Math.sin(ang) * 50,
        t: 0, life: 8, dmg: 12 * mods.projDamage * L, rate: 0.35, cd: 0, owner: p.slot,
        icon: '♟', color: '#c9a227', chase: true,
      });
    }
    addFx(p.x, p.y, 'burst', 60, '#c9a227', bfx('4.12'));
    addFx(p.x, p.y, 'icon', 48, '#fff', Object.assign({ icon: '♟', life: 0.8 }, bfx('4.12')));
    addFloat(p.x, p.y - 70, '過河！', '#ffe08a', true);
  }

  // 4.13 氣場罩
  if (hasB(p, '4.13')) {
    p.bt.aura = (p.bt.aura || 0) - dt;
    if (p.bt.aura <= 0) {
      p.bt.aura = 0.4;
      const r = 165;
      for (const ally of run.players) {
        if (ally.dead) continue;
        if ((ally.x - p.x) ** 2 + (ally.y - p.y) ** 2 < r * r) {
          ally.hp = Math.min(ally.maxHp, ally.hp + 6 * mods.healPower);
          ally.shield = Math.min(40, (ally.shield || 0) + 3);
        }
      }
      if (fxFull() && skillFxOn('br4.13')) addFx(p.x, p.y, 'aura', r * 0.4, '#88ccee', bfx('4.13'));
    }
    for (const e of run.enemies) {
      if (e.hp <= 0) continue;
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < 165 * 165) {
        e.chill = Math.max(e.chill || 0, 0.25);
        e.chillFactor = Math.min(e.chillFactor || 1, 0.6);
      }
    }
  }

  // 4.14 推手震
  if (hasB(p, '4.14') && tick('push', 2.8)) {
    const r = 180 * (mods.area || 1);
    damageEnemiesInRadius(p.x, p.y, r, 24 * L * mods.meleeDamage, p, { knock: 220, forceChill: true });
    addFx(p.x, p.y, 'slam', r, '#a8e0ff', bfx('4.14'));
    addFx(p.x, p.y, 'ring', r * 0.8, '#fff', bfx('4.14'));
    shake(8);
  }

  // 4.21 殘局殺（被動收割）
  if (hasB(p, '4.21') && tick('exec', 0.55)) {
    const r = 150;
    for (const e of run.enemies) {
      if (e.hp <= 0) continue;
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 > r * r) continue;
      const ratio = e.hp / (e.maxHp || e.hp || 1);
      if (ratio <= 0.3) {
        hurtEnemy(e, e.hp + 1, p, { fx: e.x, fy: e.y });
        addFx(e.x, e.y, 'burst', 40, '#ffe08a', bfx('4.21'));
        addFloat(e.x, e.y - 30, '將死', '#ffe08a', true);
      }
    }
  }

  // 4.22 雙車錯被動橫掃
  if (hasB(p, '4.22') && tick('rook', 3.2)) {
    const dmg = 30 * L * mods.meleeDamage;
    for (let k = 0; k < 2; k++) {
      const ang = k === 0 ? 0 : Math.PI / 2;
      for (let i = -3; i <= 3; i++) {
        const x = p.x + Math.cos(ang) * i * 48;
        const y = p.y + Math.sin(ang) * i * 48;
        damageEnemiesInRadius(x, y, 55, dmg, p, { knock: 70 });
        if (fxFull()) addFx(x, y, 'slam', 40, '#c9a227', bfx('4.22'));
      }
    }
    addFx(p.x, p.y, 'icon', 44, '#fff', Object.assign({ icon: '♜', life: 0.6 }, bfx('4.22')));
  }

  // 4.23 化境微氣環
  if (hasB(p, '4.23')) {
    p.bt.fring = (p.bt.fring || 0) - dt;
    if (p.bt.fring <= 0) {
      p.bt.fring = 0.4;
      damageEnemiesInRadius(p.x, p.y, 90, 10 * L * mods.meleeDamage, p, { knock: 40 });
      if (fxFull()) addFx(p.x, p.y, 'aura', 60, '#88ccee', bfx('4.23'));
    }
  }
}
