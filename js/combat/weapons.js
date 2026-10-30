/** 一家倖存 · 角色普攻、彈道 */
'use strict';

function nearestEnemy(p) {
  let best = null, bestD = Infinity;
  for (const e of run.enemies) {
    if (e.hp <= 0) continue;
    const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

function updateWeapons(dt) {
  for (const p of run.players) {
    if (p.dead) continue;
    const c = getChar(p.charId);
    const w = c.weapon;
    const mods = sm(p);
    const eff = te(p);
    const cdMul = mods.cooldown;
    const area = mods.area * (eff.auraAreaMul || 1);

    if (w.type === 'aura_slam') {
      p.tAura -= dt;
      if (p.tAura <= 0) {
        p.tAura = w.auraTick * cdMul;
        const dmg = w.baseDamage * mods.meleeDamage * (eff.meleeDamageMul || 1);
        damageEnemiesInRadius(p.x, p.y, w.auraRadius * area, dmg, p);
        if (fxFull()) addFx(p.x, p.y, 'aura', w.auraRadius * area * 0.35, '#4a8cff');
      }
      p.tSlam -= dt;
      if (p.tSlam <= 0) {
        p.tSlam = w.slamCooldown * cdMul;
        const sr = w.slamRadius * mods.slamRadius * (eff.slamAreaMul || 1) * mods.area;
        const dmg = w.slamDamage * mods.meleeDamage * (eff.meleeDamageMul || 1);
        damageEnemiesInRadius(p.x, p.y, sr, dmg, p);
        addFx(p.x, p.y, 'slam', sr, '#4a8cff');
        addFx(p.x, p.y, 'ring', sr * 0.6, '#aaccff');
        shake(5);
      }
    } else if (w.type === 'calm_rage') {
      p.tCalm -= dt;
      if (p.tCalm <= 0) {
        p.tCalm = w.calmCooldown * cdMul;
        const r2 = (w.calmRadius * area) ** 2;
        for (const ally of run.players) {
          if (ally.dead) continue;
          const dx = ally.x - p.x, dy = ally.y - p.y;
          if (dx * dx + dy * dy <= r2) {
            applyHeal(p, ally, w.calmHeal * mods.healPower);
          }
        }
        addFx(p.x, p.y, 'heal', w.calmRadius * area * 0.4, '#88ffcc');
      }
      p.tRage -= dt;
      if (p.tRage <= 0) {
        p.tRage = w.rageCooldown * cdMul;
        const rr = w.rageRadius * mods.fireRadius * area;
        const dmg = w.rageDamage * mods.fireDamage;
        // ENEMIES ONLY
        damageEnemiesInRadius(p.x, p.y, rr, dmg, p);
        addFx(p.x, p.y, 'fire_cone', rr, '#ff6644');
        addFx(p.x, p.y, 'fire', rr * 0.5, '#ffaa44');
      }
    } else if (w.type === 'pierce_shot') {
      p.tShot -= dt;
      if (p.tShot <= 0) {
        p.tShot = w.cooldown * cdMul;
        const target = nearestEnemy(p);
        let dx = p.facing, dy = 0;
        if (target) { dx = target.x - p.x; dy = target.y - p.y; }
        const count = 1 + mods.extraProjectiles;
        const pierce = w.pierce + mods.pierce + (eff.bonusPierce || 0);
        const chain = mods.chain + (eff.bonusChain || 0);
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * 0.18;
          const ang = Math.atan2(dy, dx) + spread;
          spawnProjectile(p, Math.cos(ang), Math.sin(ang), {
            damage: w.baseDamage * mods.projDamage,
            pierce,
            chain,
            speed: w.speed,
            life: w.range / w.speed,
            size: w.size + 2,
            color: eff.alwaysChill ? '#88ddff' : '#9dffb0',
            frost: !!eff.alwaysChill,
          });
        }
      }
    }
  }
}

function updateProjectiles(dt) {
  const newborn = [];
  for (const pr of run.projectiles) {
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
    pr.life -= dt;
    if (pr.trail && fxFull() && skillFxOn(pr.skill) && Math.random() < 0.4) {
      addFx(pr.x, pr.y, 'spark', 4, pr.color, { life: 0.2 });
    }
    for (const e of run.enemies) {
      if (e.hp <= 0 || pr.hit.has(e)) continue;
      const dx = e.x - pr.x, dy = e.y - pr.y;
      if (dx * dx + dy * dy < (e.r + pr.size) ** 2) {
        const owner = run.players[pr.ownerSlot];
        hurtEnemy(e, pr.damage, owner, { forceChill: pr.frost, fx: pr.x - pr.vx * 0.1, fy: pr.y - pr.vy * 0.1 });
        pr.hit.add(e);
        // chain
        if (pr.chain > 0) {
          let next = null, best = Infinity;
          for (const o of run.enemies) {
            if (o.hp <= 0 || pr.hit.has(o)) continue;
            const d = (o.x - e.x) ** 2 + (o.y - e.y) ** 2;
            if (d < best && d < 180 * 180) { best = d; next = o; }
          }
          if (next) {
            const ang = Math.atan2(next.y - e.y, next.x - e.x);
            newborn.push({
              x: e.x, y: e.y,
              vx: Math.cos(ang) * Math.hypot(pr.vx, pr.vy),
              vy: Math.sin(ang) * Math.hypot(pr.vx, pr.vy),
              damage: pr.damage * 0.85,
              pierce: 0,
              chain: pr.chain - 1,
              life: 0.6,
              size: pr.size,
              color: '#ffe566',
              ownerSlot: pr.ownerSlot,
              hit: new Set(pr.hit),
              frost: pr.frost,
              trail: pr.trail,
            });
            pr.chain = 0;
            addFx(e.x, e.y, 'spark', 20, '#ffe566');
          }
        }
        pr.pierce--;
        if (pr.pierce < 0) pr.life = 0;
      }
    }
  }
  run.projectiles = run.projectiles.filter((p) => p.life > 0).concat(newborn);
}
