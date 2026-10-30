/** 一家倖存 · 技能主動效果 runner（data-driven） */
'use strict';

// ================= 技能主動 runner（data-driven） =================
function skillDmgMul(p, sk) {
  const m = sm(p), eff = te(p);
  let mul = 1;
  if (sk.act && sk.act.melee) mul *= m.meleeDamage * (eff.meleeDamageMul || 1);
  if (sk.tags.includes('火焰')) mul *= m.fireDamage;
  if (sk.tags.includes('投射') && !(sk.act && sk.act.melee)) mul *= m.projDamage;
  return mul;
}
function nearestEnemyTo(x, y, maxD) {
  let best = null, bd = (maxD || 1e9) ** 2;
  for (const e of run.enemies) {
    if (e.hp <= 0) continue;
    const d = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}
function pushProj(owner, x, y, ang, o) {
  const eff = te(owner);
  const spd = o.speed * (eff.projSpeedMul || 1);
  run.projectiles.push({
    x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
    damage: o.damage, pierce: o.pierce || 0, chain: o.chain || 0,
    life: o.life || 1.2, size: o.size || 8, color: o.color || '#fff',
    ownerSlot: owner.slot, hit: new Set(), frost: !!eff.alwaysChill,
    trail: fxFull() && skillFxOn(o.skill), skill: o.skill,
  });
}

function updateSkillActs(dt) {
  for (const p of run.players) {
    if (p.dead) continue;
    const m = sm(p), eff = te(p);
    const owned = [...new Set(p.skills)];
    const orbits = [];
    for (const id of owned) {
      const sk = SKILLS.find((s) => s.id === id);
      if (!sk || !sk.act) continue;
      const a = sk.act;
      const lv = skillLevel(p, id);
      const lvMul = 1 + 0.3 * (lv - 1);
      const dmg = a.dmg ? a.dmg * lvMul * skillDmgMul(p, sk) : 0;
      const area = (m.area || 1) * (1 + 0.06 * (lv - 1));
      const fxx = { skill: id };
      if (a.type === 'orbit') { orbits.push({ sk, a, lv, dmg }); continue; }
      p.actT[id] = (p.actT[id] == null ? a.cd * 0.5 : p.actT[id]) - dt;
      if (p.actT[id] > 0) continue;
      p.actT[id] = a.cd * m.cooldown * Math.max(0.5, 1 - 0.06 * (lv - 1));
      if (a.type === 'nova') {
        const r = a.r * area * (a.melee ? (eff.slamAreaMul || 1) : 1);
        damageEnemiesInRadius(p.x, p.y, r, dmg, p, { forceChill: a.chill, knock: a.knock, shatter: true });
        addFx(p.x, p.y, 'slam', r, a.color, fxx);
        addFx(p.x, p.y, 'ring', r * 0.6, a.color, fxx);
        if (a.melee) shake(4);
      } else if (a.type === 'target_nova') {
        const t = nearestEnemyTo(p.x, p.y, 700);
        if (!t) { p.actT[id] = 0.5; continue; }
        const r = a.r * area * (eff.explodeAreaMul || 1);
        let mul = (a.shatter && t.chill > 0 && eff.shatterMul) ? eff.shatterMul : 1;
        damageEnemiesInRadius(t.x, t.y, r, dmg * mul, p, { forceChill: a.chill, shatter: a.shatter });
        addFx(t.x, t.y, 'burst', r, a.color, fxx);
        addFx(t.x, t.y, 'ring', r, '#ffffff', fxx);
      } else if (a.type === 'projectile') {
        const t = nearestEnemyTo(p.x, p.y, 800);
        const base = t ? Math.atan2(t.y - p.y, t.x - p.x) : (p.facing > 0 ? 0 : Math.PI);
        const n = Math.floor((a.count || 1) + (a.perLv || 0) * (lv - 1));
        for (let i = 0; i < n; i++) {
          const ang = base + (i - (n - 1) / 2) * (a.spread || 0.2);
          pushProj(p, p.x, p.y - 20, ang, {
            damage: dmg, speed: a.speed, pierce: m.pierce + (eff.bonusPierce || 0),
            chain: (a.chain || 0) + m.chain + (eff.bonusChain || 0), size: 9, color: a.color, skill: id, life: 1.4,
          });
        }
      } else if (a.type === 'zone') {
        let x = p.x, y = p.y;
        if (a.at === 'enemy') {
          const t = nearestEnemyTo(p.x, p.y, 700);
          if (!t) { p.actT[id] = 0.5; continue; }
          x = t.x; y = t.y;
        }
        run.zones.push({ x, y, r: a.r * area, life: a.dur + 0.3 * (lv - 1), t: 0, tick: a.tick, tt: 0,
          dmg: dmg * a.tick / 0.4, owner: p.slot, color: a.color, skill: id, burn: a.burn, poison: a.poison });
      } else if (a.type === 'heal_all') {
        for (const ally of run.players) if (!ally.dead) applyHeal(p, ally, a.amt * lvMul * m.healPower);
        addFx(p.x, p.y, 'heal', 120, a.color, fxx);
      } else if (a.type === 'shield_all') {
        const amt = a.amt * lvMul * (eff.shieldMul || 1);
        for (const ally of run.players) {
          if (ally.dead) continue;
          ally.shield = Math.min(ally.maxHp * 0.6, (ally.shield || 0) + amt);
          addFx(ally.x, ally.y, 'shield', 50, a.color, fxx);
          addFloat(ally.x, ally.y - 20, '🛡+' + Math.round(amt), '#aaccff', false);
        }
      } else if (a.type === 'summon') {
        run.summons.push({ x: p.x + (Math.random() - 0.5) * 120, y: p.y + (Math.random() - 0.5) * 120,
          life: a.dur + 0.5 * (lv - 1), t: 0, rate: a.rate * (eff.summonRateMul || 1), dmg, owner: p.slot,
          icon: a.icon, color: a.color, skill: id });
        addFx(p.x, p.y, 'burst', 40, a.color, fxx);
      }
    }
    // orbit
    p.orbitAng += dt * 2.8 * (eff.orbitSpinMul || 1);
    p.orbitTick -= dt;
    p._orbs = [];
    for (const o of orbits) {
      const n = o.a.count + o.a.perLv * (o.lv - 1);
      const r = o.a.r * (m.area || 1);
      for (let i = 0; i < n; i++) {
        const ang = p.orbitAng * (o.a.spin / 2.8) + (Math.PI * 2 * i) / n;
        p._orbs.push({ x: p.x + Math.cos(ang) * r, y: p.y - 16 + Math.sin(ang) * r, size: o.a.size, dmg: o.dmg, icon: o.a.icon, skill: o.sk.id });
      }
    }
    if (p.orbitTick <= 0 && p._orbs.length) {
      p.orbitTick = 0.3;
      for (const ob of p._orbs) {
        for (const e of run.enemies) {
          if (e.hp <= 0) continue;
          if ((e.x - ob.x) ** 2 + (e.y - 16 - ob.y) ** 2 < (e.r + ob.size) ** 2) {
            hurtEnemy(e, ob.dmg, p);
            addFx(e.x, e.y, 'spark', 14, '#ffffff', { skill: ob.skill });
          }
        }
      }
    }
  }
  // zones
  for (const z of run.zones) {
    z.t += dt; z.tt -= dt;
    const owner = run.players[z.owner];
    if (z.tt <= 0 && owner) {
      z.tt = z.tick;
      damageEnemiesInRadius(z.x, z.y, z.r, z.dmg, owner, { forceBurn: z.burn, forcePoison: z.poison });
    }
  }
  run.zones = run.zones.filter((z) => z.t < z.life);
  // summons
  for (const s of run.summons) {
    s.t += dt; s.cd = (s.cd || 0) - dt;
    const owner = run.players[s.owner];
    if (s.cd <= 0 && owner) {
      const tg = nearestEnemyTo(s.x, s.y, 650);
      if (tg) {
        s.cd = s.rate;
        pushProj(owner, s.x, s.y - 10, Math.atan2(tg.y - s.y, tg.x - s.x), {
          damage: s.dmg, speed: 480, pierce: sm(owner).pierce, chain: sm(owner).chain, size: 7, color: s.color, skill: s.skill, life: 1.3,
        });
      }
    }
  }
  run.summons = run.summons.filter((s) => s.t < s.life);
}
