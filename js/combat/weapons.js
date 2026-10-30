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
    // 籠內＝塔：仍然自動射，唔郁／唔大招
    const c = getChar(p.charId);
    const w = c.weapon;
    const mods = sm(p);
    const eff = te(p);
    const cdMul = mods.cooldown * (p.caged && p._towerFire ? p._towerFire : 1);
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
        p.tCalm = w.calmCooldown * cdMul * (p.branch && p.branch[0] === '3.1' ? 0.75 : 1);
        const r2 = (w.calmRadius * area) ** 2;
        for (const ally of run.players) {
          if (ally.dead) continue;
          const dx = ally.x - p.x, dy = ally.y - p.y;
          if (dx * dx + dy * dy <= r2) {
            applyHeal(p, ally, w.calmHeal * mods.healPower * (p.bHeal || 1));
          }
        }
        addFx(p.x, p.y, 'heal', w.calmRadius * area * 0.4, '#88ffcc');
      }
      p.tRage -= dt;
      if (p.tRage <= 0) {
        p.tRage = w.rageCooldown * cdMul;
        const rr = w.rageRadius * mods.fireRadius * area;
        const dmg = w.rageDamage * mods.fireDamage * (p.branch && p.branch[0] === '3.2' ? 1.4 : 1) * (hasB(p, '3.23') ? 1.5 : 1);
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
            color: eff.alwaysChill ? '#88ddff' : (w.color || '#9dffb0'),
            frost: !!eff.alwaysChill,
          });
        }
      }
    } else if (w.type === 'spirit_pulse') {
      p.tAura = (p.tAura == null ? 0 : p.tAura) - dt;
      if (p.tAura <= 0) {
        p.tAura = w.auraTick * cdMul;
        const dmg = w.baseDamage * mods.meleeDamage * (eff.meleeDamageMul || 1);
        damageEnemiesInRadius(p.x, p.y, w.auraRadius * area, dmg, p);
        if (fxFull()) addFx(p.x, p.y, 'aura', w.auraRadius * area * 0.35, '#c9a227');
      }
      p.tSlam = (p.tSlam == null ? 0 : p.tSlam) - dt;
      if (p.tSlam <= 0) {
        p.tSlam = w.spiritCd * cdMul;
        run.summons.push({
          x: p.x + (Math.random() - 0.5) * 100,
          y: p.y + (Math.random() - 0.5) * 100,
          t: 0, life: w.spiritDur, dmg: w.spiritDmg * mods.projDamage,
          rate: w.spiritRate, acc: 0, owner: p.slot,
          icon: '👻', color: '#ffe08a',
        });
        addFx(p.x, p.y, 'burst', 60, '#ffe08a');
        addFloat(p.x, p.y - 50, '祖先！', '#ffe08a', false);
      }
    } else if (w.type === 'bite_dash') {
      p.tShot = (p.tShot == null ? 0 : p.tShot) - dt;
      if (p.tShot <= 0) {
        p.tShot = w.cooldown * cdMul;
        const target = nearestEnemy(p);
        if (target) {
          const dx = target.x - p.x, dy = target.y - p.y;
          const d = Math.hypot(dx, dy) || 1;
          if (!p.caged) {
            const leap = Math.min(w.leap || 90, d);
            p.x += (dx / d) * leap;
            p.y += (dy / d) * leap;
            p.facing = dx >= 0 ? 1 : -1;
          }
          const dmg = w.baseDamage * mods.meleeDamage * (eff.meleeDamageMul || 1);
          damageEnemiesInRadius(p.x, p.y, w.radius * area, dmg, p, { knock: 90 });
          if (typeof damageCagesInRadius === 'function') damageCagesInRadius(p.x, p.y, w.radius * area, dmg, p);
          addFx(p.x, p.y, 'slam', w.radius * area * 0.7, '#e8963a');
          addFx(p.x, p.y, 'spark', 24, '#ffd4a0');
        }
      }
    } else if (w.type === 'cry_toss') {
      p.tAura = (p.tAura == null ? 0 : p.tAura) - dt;
      if (p.tAura <= 0) {
        p.tAura = w.cryTick * cdMul;
        const rr = w.cryRadius * area;
        const dmg = w.cryDamage * mods.projDamage;
        damageEnemiesInRadius(p.x, p.y, rr, dmg, p, { forceChill: true });
        if (fxFull()) addFx(p.x, p.y, 'ring', rr * 0.45, '#7ec8ff');
      }
      p.tShot = (p.tShot == null ? 0 : p.tShot) - dt;
      if (p.tShot <= 0) {
        p.tShot = w.cooldown * cdMul;
        const target = nearestEnemy(p);
        const tx = target ? target.x : p.x + p.facing * 80;
        const ty = target ? target.y : p.y;
        const dmg = w.tossDamage * mods.projDamage * (mods.explodeDamage || 1);
        const tr = w.tossRadius * area;
        damageEnemiesInRadius(tx, ty, tr, dmg, p, { shatter: true });
        if (typeof damageCagesInRadius === 'function') damageCagesInRadius(tx, ty, tr, dmg, p);
        addFx(tx, ty, 'burst', tr, '#7ec8ff');
        addFx(tx, ty, 'slam', tr * 0.7, '#ffaaee');
        addFloat(tx, ty - 30, '玩具！', '#7ec8ff', false);
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
        if (typeof damageCagesInRadius === 'function') damageCagesInRadius(pr.x, pr.y, pr.size + 28, pr.damage, owner);
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
