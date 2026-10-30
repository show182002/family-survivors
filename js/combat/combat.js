/** 一家倖存 · 傷害、擊殺、大招、治療 */
'use strict';

// ——— Combat helpers ———
function sm(p) { return p.skillMods || emptySkillMods(); }
function te(p) { return p.tagEffects || {}; }

function spawnProjectile(owner, dx, dy, opts) {
  const len = Math.hypot(dx, dy) || 1;
  const eff = te(owner);
  const speedMul = eff.projSpeedMul || 1;
  run.projectiles.push({
    x: owner.x,
    y: owner.y - 20,
    vx: (dx / len) * opts.speed * speedMul,
    vy: (dy / len) * opts.speed * speedMul,
    damage: opts.damage,
    pierce: opts.pierce,
    chain: opts.chain || 0,
    life: opts.life || 1.2,
    size: opts.size || 8,
    color: opts.color || '#9dffb0',
    ownerSlot: owner.slot,
    hit: new Set(),
    frost: opts.frost || false,
    trail: fxFull(),
  });
}

function damageEnemiesInRadius(x, y, r, dmg, source, opts) {
  opts = opts || {};
  const r2 = r * r;
  for (const e of run.enemies) {
    if (e.hp <= 0) continue;
    const dx = e.x - x, dy = e.y - y;
    if (dx * dx + dy * dy <= r2) {
      let mul = 1;
      if (opts.shatter && e.chill > 0 && te(source).shatterMul) mul = te(source).shatterMul;
      if (opts.knock && !e.boss) {
        const d = Math.hypot(dx, dy) || 1;
        e.x += (dx / d) * opts.knock * 0.35; e.y += (dy / d) * opts.knock * 0.35;
      }
      hurtEnemy(e, dmg * mul, source, Object.assign({ fx: x, fy: y }, opts));
    }
  }
}

function hurtEnemy(e, dmg, source, opts) {
  opts = opts || {};
  const p = source;
  let final = dmg;
  let crit = false;
  if (p) {
    if (p.bDmg) final *= p.bDmg;
    if (p.carriedBy) final *= 2;           // 膊頭馬：膊頭上攻擊 ×2
    if (p.atkBuff > 0) final *= 1.3;       // 點心 buff
  }
  if (e.mark > 0) final *= 1.5;            // 戒尺點名
  // 盾怪：正面（±60°）擋 90%
  if (e.type === 'shield' && opts.fx != null) {
    const vx = opts.fx - e.x, vy = opts.fy - e.y, d = Math.hypot(vx, vy);
    if (d > 12 && (Math.cos(e.face) * vx + Math.sin(e.face) * vy) / d > 0.5) {
      final *= 0.1;
      if (Math.random() < 0.15) addFloat(e.x, e.y - 10, '擋!', '#99bbff', false);
      e.hp -= final; e.hitFlash = 0.05;
      if (e.hp <= 0) killEnemy(e, p);
      return;
    }
  }
  if (p && sm(p).critChance > Math.random()) {
    final *= sm(p).critMul || 1.5;
    crit = true;
  }
  e.hp -= final;
  e.hitFlash = 0.12;
  if (crit) e.critFlash = 0.15;

  addFloat(e.x, e.y, String(Math.round(final)), crit ? '#ffe566' : '#fff', crit);
  if (crit) shake(4);

  // status from source tags
  if (p) {
    const mods = sm(p);
    const eff = te(p);
    let burnChance = mods.burnChance + (eff.burnChanceBonus || 0);
    if (opts.forceBurn) burnChance = 1;
    if (Math.random() < burnChance) {
      e.burn = Math.max(e.burn || 0, 2.5);
      e.burnDps = Math.max(e.burnDps || 0, mods.burnDps * (eff.burnDpsMul || 1));
      e.burnSource = p.slot;
    }
    if (Math.random() < mods.poisonChance || opts.forcePoison) {
      e.poison = Math.max(e.poison || 0, 3);
      e.poisonDps = Math.max(e.poisonDps || 0, mods.poisonDps);
      e.poisonSource = p.slot;
    }
    const chill = eff.alwaysChill || Math.random() < mods.chillChance || opts.forceChill;
    if (chill) {
      e.chill = Math.max(e.chill || 0, 2);
      e.chillFactor = eff.chillFactor || mods.chillFactor || 0.6;
    }
  }

  if (e.hp <= 0) killEnemy(e, p);
}

function killEnemy(e, source) {
  if (e._dead) return;
  e._dead = true;
  e.hp = 0;
  run.kills++;
  const luck = 0;
  let value = e.xp || 1;
  if (Math.random() < 0.08 + luck) value = Math.ceil(value * 3);
  run.gems.push({
    x: e.x, y: e.y, v: value,
    r: value >= 3 ? 7 : 4,
    magnet: false, life: 60,
  });

  if (source) {
    const mods = sm(source);
    const eff = te(source);
    if (mods.explodeOnKill || eff.burnExplode || eff.poisonExplode) {
      triggerExplode(e, source);
    }
  }
  addFx(e.x, e.y, 'burst', 28, '#ffaa66');
  if (e.type === 'splitter') {
    for (let i = 0; i < 2; i++) {
      const m = spawnOneEnemy(false, { kind: 'mini', x: e.x + (i ? 18 : -18), y: e.y, force: true });
      if (m) { m.hp = m.maxHp = e.maxHp * 0.35; m.xp = 1; }
    }
    addFx(e.x, e.y, 'ring', 50, '#88ff66');
  }
}

function triggerExplode(e, source) {
  const mods = sm(source);
  const eff = te(source);
  let r = mods.explodeRadius * (sm(source).area || 1) * (eff.explodeAreaMul || 1);
  let dmg = mods.explodeDamage * (mods.meleeDamage || 1);
  if (eff.poisonExplode && e.poison > 0) {
    r *= eff.poisonRadiusMul || 1;
    dmg *= eff.poisonExplodeMul || 1.5;
    addFx(e.x, e.y, 'poison_blast', r, '#88ff44');
  }
  if (eff.burnExplode && e.burn > 0) {
    dmg *= eff.burnExplodeMul || 1.6;
    addFx(e.x, e.y, 'fire', r, '#ff6622');
  }
  if (!eff.burnExplode && !eff.poisonExplode) {
    addFx(e.x, e.y, 'slam', r, '#ffcc44');
  }
  if (eff.shatterMul && e.chill > 0) dmg *= eff.shatterMul;
  // recursive-safe: explode doesn't re-trigger explodeOnKill chain forever
  damageEnemiesInRadius(e.x, e.y, r, dmg, source, { shatter: true, noExplode: true });
  shake(6);
}

function tryUlt(slot) {
  if (!run || mode !== 'play') return;
  const p = run.players[slot];
  if (!p || p.dead || p.carriedBy || p.ball) return;
  if (p.charId === 'dad' && p.branch && p.branch[0]) { dadUlt(p); return; }
  if (p.ultCd > 0) return;
  const c = getChar(p.charId);
  const u = c.ult;
  const mods = sm(p);
  const eff = te(p);
  p.ultCd = u.cooldown;
  p.flash = 0.35;

  if (u.type === 'dad_slam') {
    const area = (mods.area || 1) * (eff.slamAreaMul || 1);
    const dmg = u.damage * mods.meleeDamage * (eff.meleeDamageMul || 1);
    damageEnemiesInRadius(p.x, p.y, u.radius * area, dmg, p);
    p.invuln = Math.max(p.invuln, u.invuln);
    addFx(p.x, p.y, 'slam', u.radius * area, '#4a8cff');
    addFx(p.x, p.y, 'ring', u.radius * area * 0.7, '#9cf');
    shake(10);
  } else if (u.type === 'mom_dragon') {
    // ENEMIES ONLY
    const area = (mods.area || 1) * (mods.fireRadius || 1);
    const dmg = u.damage * mods.fireDamage;
    damageEnemiesInRadius(p.x, p.y, u.radius * area, dmg, p, { forceBurn: true });
    for (const ally of run.players) {
      if (ally.dead) continue;
      const heal = u.heal * mods.healPower;
      applyHeal(p, ally, heal);
    }
    addFx(p.x, p.y, 'fire_cone', u.radius * area, '#ff4422');
    addFx(p.x, p.y, 'heal', 90, '#88ffaa');
    shake(8);
  } else if (u.type === 'daughter_storm') {
    const n = u.count;
    const pierce = u.pierce + mods.pierce + (eff.bonusPierce || 0);
    const chain = mods.chain + (eff.bonusChain || 0);
    for (let i = 0; i < n; i++) {
      const ang = (Math.PI * 2 * i) / n;
      spawnProjectile(p, Math.cos(ang), Math.sin(ang), {
        damage: u.damage * mods.projDamage,
        pierce,
        chain,
        speed: u.speed,
        life: 1.4,
        size: 9,
        color: '#6dff9a',
        frost: !!eff.alwaysChill,
      });
    }
    addFx(p.x, p.y, 'burst', 70, '#6dff9a');
    shake(7);
  }
}

function applyHeal(source, ally, amount) {
  ally.hp = Math.min(ally.maxHp, ally.hp + amount);
  addFx(ally.x, ally.y, 'heal', 50, '#88ffcc');
  addFloat(ally.x, ally.y - 10, '+' + Math.round(amount), '#88ffaa', false);
  const eff = te(source);
  if (eff.healGivesShield) {
    ally.shield = Math.min(ally.maxHp * 0.5, (ally.shield || 0) + amount * (eff.shieldFromHeal || 0.5));
    addFx(ally.x, ally.y, 'shield', 40, '#88aaff');
  }
}
