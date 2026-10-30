/** 一家倖存 · 鄰居轉職：飛拖鞋仙／八卦電台 */
'use strict';

function throwSlippers(p, L, mods, count, spread) {
  const t = nearestEnemyTo(p.x, p.y, 500);
  if (!t) return false;
  const base = Math.atan2(t.y - p.y, t.x - p.x);
  const n = count || 1;
  const dmg = (hasB(p, '7.11') ? 22 : 15) * L * mods.projDamage;
  for (let i = 0; i < n; i++) {
    const ang = base + (i - (n - 1) / 2) * (spread || 0.16);
    pushProj(p, p.x, p.y - 16, ang, {
      damage: dmg, speed: 480, life: 1.15, color: '#fb923c',
      skill: 'br7.1', pierce: hasB(p, '7.11') ? 2 : 1, size: hasB(p, '7.11') ? 11 : 8,
    });
  }
  addFx(p.x, p.y - 16, 'burst', 40, '#fb923c', bfx('7.1'));
  addFx(p.x, p.y - 16, 'icon', 36, '#fff', Object.assign({ icon: '🩴', life: 0.4 }, bfx('7.1')));
  return true;
}

function gossipPulse(p, L, mods, strong) {
  const r = (strong ? 210 : 150) * (mods.area || 1);
  const dmg = (strong ? 20 : 10) * L * mods.meleeDamage;
  const markDur = strong ? 5.5 : 3.5;
  for (const e of run.enemies) {
    if (e.hp <= 0) continue;
    if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 > r * r) continue;
    e.mark = Math.max(e.mark || 0, markDur);
    hurtEnemy(e, dmg, p, { fx: e.x, fy: e.y });
  }
  addFx(p.x, p.y, 'ring', r, '#fed7aa', bfx('7.2'));
  addFx(p.x, p.y, 'aura', r * 0.35, '#fb923c', bfx('7.2'));
  if (strong) addFx(p.x, p.y, 'burst', r * 0.5, '#fdba74', bfx('7.13'));
}

function neighborUlt(p) {
  if (p.ultCd > 0) return;
  const L = brScale();
  const mods = sm(p);
  const c = getChar(p.charId);
  p.ultCd = c.ult.cooldown * (hasB(p, '7.21') ? 0.88 : 1);
  p.ultMax = p.ultCd;
  p.flash = 0.55;
  if (typeof sfxUlt === 'function') sfxUlt();

  // 拖鞋線
  if (hasB(p, '7.21')) {
    const R = 280 * (mods.area || 1);
    damageEnemiesInRadius(p.x, p.y, R, 70 * L * mods.projDamage, p, { knock: 140 });
    for (let i = 0; i < 18; i++) {
      const ang = (Math.PI * 2 * i) / 18;
      pushProj(p, p.x, p.y - 10, ang, {
        damage: 22 * L * mods.projDamage, speed: 540, life: 1.3, color: '#fb923c',
        skill: 'br7.21', pierce: 3, size: 12,
      });
    }
    for (let i = 0; i < 10; i++) addFx(p.x, p.y, 'burst', 70 + i * 20, i % 2 ? '#fb923c' : '#fed7aa', bfx('7.21'));
    addFloat(p.x, p.y - 90, '拖鞋風暴！', '#fb923c', true);
    shake(34);
    return;
  }
  if (hasB(p, '7.22')) {
    const R = 240 * (mods.area || 1);
    // 金拖鞋：高傷穿透彈＋標記
    for (let i = 0; i < 10; i++) {
      const ang = (Math.PI * 2 * i) / 10;
      pushProj(p, p.x, p.y - 12, ang, {
        damage: 36 * L * mods.projDamage, speed: 560, life: 1.4, color: '#fbbf24',
        skill: 'br7.22', pierce: 4, size: 14,
      });
    }
    for (const e of run.enemies) {
      if (e.hp <= 0) continue;
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 <= R * R) e.mark = Math.max(e.mark || 0, 6);
    }
    damageEnemiesInRadius(p.x, p.y, R * 0.5, 40 * L, p, { knock: 80 });
    for (let i = 0; i < 8; i++) addFx(p.x, p.y, 'burst', 55 + i * 18, '#fbbf24', bfx('7.22'));
    addFloat(p.x, p.y - 90, '金拖鞋！', '#fbbf24', true);
    shake(32);
    return;
  }
  if (p.branch[0] === '7.1') {
    const R = 220 * (mods.area || 1);
    damageEnemiesInRadius(p.x, p.y, R, 55 * L * mods.projDamage, p, { knock: 100 });
    throwSlippers(p, L, mods, 8, 0.2);
    for (let i = 0; i < 8; i++) addFx(p.x, p.y, 'burst', 55 + i * 18, '#fb923c', bfx('7.1'));
    addFloat(p.x, p.y - 90, '飛拖鞋仙！', '#fb923c', true);
    shake(26);
    return;
  }

  // 八卦線
  if (hasB(p, '7.23')) {
    const R = 300 * (mods.area || 1);
    for (const e of run.enemies) {
      if (e.hp <= 0) continue;
      e.mark = Math.max(e.mark || 0, 7);
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 <= R * R) {
        hurtEnemy(e, 55 * L * mods.meleeDamage, p, { knock: 60 });
      }
    }
    for (let i = 0; i < 14; i++) {
      const ang = (Math.PI * 2 * i) / 14;
      pushProj(p, p.x, p.y - 8, ang, {
        damage: 18 * L * mods.projDamage, speed: 500, life: 1.2, color: '#fdba74',
        skill: 'br7.23', pierce: 2, size: 10,
      });
    }
    for (let i = 0; i < 12; i++) addFx(p.x, p.y, 'ring', 45 + i * 22, i % 2 ? '#fb923c' : '#fed7aa', bfx('7.23'));
    addFloat(p.x, p.y - 90, '全棟直播！', '#fed7aa', true);
    shake(34);
    return;
  }
  if (hasB(p, '7.24') || p.branch[0] === '7.2') {
    const R = 260 * (mods.area || 1);
    const markBoost = hasB(p, '7.24') ? 2.0 : 1.5;
    for (const e of run.enemies) {
      if (e.hp <= 0) continue;
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 > R * R) continue;
      e.mark = Math.max(e.mark || 0, hasB(p, '7.24') ? 8 : 5);
      // 黑名單：標記怪額外受傷一次
      hurtEnemy(e, 45 * L * mods.meleeDamage * markBoost / 1.5, p, { knock: 70 });
      if (hasB(p, '7.24')) e.stun = Math.max(e.stun || 0, 0.5);
    }
    for (let i = 0; i < 10; i++) addFx(p.x, p.y, 'aura', 50 + i * 18, '#c2410c', bfx('7.24'));
    addFx(p.x, p.y, 'burst', R * 0.55, '#fb923c', bfx(hasB(p, '7.24') ? '7.24' : '7.2'));
    addFloat(p.x, p.y - 90, hasB(p, '7.24') ? '黑名單！' : '八卦電台！', '#fed7aa', true);
    shake(28);
    return;
  }

  const u = c.ult;
  const R = u.radius * (mods.area || 1) * 2.2;
  damageEnemiesInRadius(p.x, p.y, R, u.damage * mods.meleeDamage * 3, p, { knock: 100 });
  for (const e of run.enemies) {
    if (e.hp <= 0) continue;
    if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 <= R * R) e.mark = Math.max(e.mark || 0, u.markDur || 5);
  }
  for (let i = 0; i < (u.count || 12); i++) {
    const ang = (Math.PI * 2 * i) / (u.count || 12);
    pushProj(p, p.x, p.y, ang, {
      damage: 14 * mods.projDamage, speed: 450, life: 1.1, color: '#fb923c',
      skill: 'nb_slipper', pierce: 2, size: 9,
    });
  }
  addFx(p.x, p.y, 'burst', R, '#fb923c');
  shake(20);
}

function updateNeighborBr(p, dt, tick, L) {
  const mods = sm(p);

  // 7.1 飛拖鞋仙
  if (p.branch[0] === '7.1') {
    const cd = hasB(p, '7.11') ? 1.5 : 2.0;
    if (tick('slip', cd)) {
      const n = hasB(p, '7.11') ? 3 : 1;
      if (!throwSlippers(p, L, mods, n, hasB(p, '7.11') ? 0.22 : 0.14)) p.bt.slip = 0.4;
    }
  }

  // 7.2 八卦電台
  if (p.branch[0] === '7.2') {
    const cd = hasB(p, '7.13') ? 1.9 : 2.5;
    if (tick('gossip', cd)) gossipPulse(p, L, mods, hasB(p, '7.13'));
  }

  // 7.12 拖鞋地雷
  if (hasB(p, '7.12') && tick('mine', 3.6)) {
    const t = nearestEnemyTo(p.x, p.y, 360);
    const x = t ? t.x : p.x + (Math.random() - 0.5) * 140;
    const y = t ? t.y : p.y + (Math.random() - 0.5) * 140;
    damageEnemiesInRadius(x, y, 100, 32 * L * mods.projDamage, p, { knock: 100 });
    for (const e of run.enemies) {
      if (e.hp <= 0) continue;
      if ((e.x - x) ** 2 + (e.y - y) ** 2 < 100 * 100) e.mark = Math.max(e.mark || 0, 3);
    }
    addFx(x, y, 'burst', 85, '#fb923c', bfx('7.12'));
    addFx(x, y, 'icon', 36, '#fff', Object.assign({ icon: '🩴', life: 0.55 }, bfx('7.12')));
  }

  // 7.14 竊聽網：常駐標記近敵
  if (hasB(p, '7.14')) {
    p.bt.wire = (p.bt.wire || 0) - dt;
    if (p.bt.wire <= 0) {
      p.bt.wire = 0.5;
      const r = 175;
      let n = 0;
      for (const e of run.enemies) {
        if (e.hp <= 0) continue;
        if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 > r * r) continue;
        e.mark = Math.max(e.mark || 0, 2.5);
        e.chill = Math.max(e.chill || 0, 0.2);
        e.chillFactor = Math.min(e.chillFactor || 1, 0.7);
        n++;
      }
      if (n && fxFull() && skillFxOn('br7.14')) addFx(p.x, p.y, 'aura', r * 0.4, '#fed7aa', bfx('7.14'));
    }
  }

  // 7.13 標記擴散：標記怪附近擴散
  if (hasB(p, '7.13') && tick('spread', 2.8)) {
    const marked = [];
    for (const e of run.enemies) {
      if (e.hp > 0 && e.mark > 0) marked.push(e);
    }
    for (const m of marked.slice(0, 6)) {
      for (const e of run.enemies) {
        if (e.hp <= 0 || e === m) continue;
        if ((e.x - m.x) ** 2 + (e.y - m.y) ** 2 < 110 * 110) {
          e.mark = Math.max(e.mark || 0, 3);
        }
      }
      if (fxFull()) addFx(m.x, m.y, 'ring', 50, '#fed7aa', bfx('7.13'));
    }
  }

  // 7.22 金拖鞋被動：標記怪額外射一發
  if (hasB(p, '7.22') && tick('gold', 2.4)) {
    const marked = [];
    for (const e of run.enemies) {
      if (e.hp > 0 && e.mark > 0) marked.push(e);
    }
    marked.sort((a, b) => (a.x - p.x) ** 2 + (a.y - p.y) ** 2 - ((b.x - p.x) ** 2 + (b.y - p.y) ** 2));
    const t = marked[0] || nearestEnemyTo(p.x, p.y, 450);
    if (t) {
      const ang = Math.atan2(t.y - p.y, t.x - p.x);
      pushProj(p, p.x, p.y - 14, ang, {
        damage: 26 * L * mods.projDamage, speed: 560, life: 1.2, color: '#fbbf24',
        skill: 'br7.22', pierce: 3, size: 12,
      });
      addFx(p.x, p.y, 'icon', 36, '#fff', Object.assign({ icon: '✨', life: 0.4 }, bfx('7.22')));
    }
  }

  // 7.24 黑名單：標記怪持續額外傷害
  if (hasB(p, '7.24') && tick('blacklist', 0.7)) {
    for (const e of run.enemies) {
      if (e.hp <= 0 || !(e.mark > 0)) continue;
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 > 280 * 280) continue;
      hurtEnemy(e, 8 * L * mods.meleeDamage, p, { fx: e.x, fy: e.y });
    }
  }
}
