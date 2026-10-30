/** 一家倖存 · 出怪、敵人更新、玩家受傷 */
'use strict';

function spawnEnemies(dt) {
  const alive = run.enemies.filter((e) => e.hp > 0).length;
  const budget = enemyBudget(run.time);
  run.spawnAcc += dt;
  const interval = Math.max(0.028, (1.0 - run.time / 340) / 6); // v0.02207：相對 02205 再 ×2
  updateEvents(dt);
  while (run.spawnAcc >= interval && alive + 1 <= budget + 5) {
    run.spawnAcc -= interval;
    spawnOneEnemy(false);
  }
  const eliteEvery = tierOf(run.time) >= 4 ? 10 : 40;
  if (run.time > 60 && Math.floor(run.time) % eliteEvery === 0 && run._eliteMark !== Math.floor(run.time)) {
    run._eliteMark = Math.floor(run.time);
    spawnOneEnemy(true);
  }
}

function spawnOneEnemy(elite, o) {
  o = o || {};
  if (!o.boss && !o.force && run.enemies.length >= MAX_ENEMIES) return null;
  const focus = cameraFocus();
  const ang = Math.random() * Math.PI * 2;
  const dist = Math.max(STAGE_W, STAGE_H) * 0.55 + Math.random() * 200;
  let x = clamp(o.x != null ? o.x : focus.x + Math.cos(ang) * dist, 40, MAP_W - 40);
  let y = clamp(o.y != null ? o.y : focus.y + Math.sin(ang) * dist, 40, MAP_H - 40);
  const st = enemyStats(run.time);
  const tier = tierOf(run.time);
  const kind = o.kind || (elite ? 'brute' : pickKind(tier));
  const SPR = { shooter: 'ghost', charger: 'bat', splitter: 'slime', shield: 'brute', mini: 'slime' };
  const e = {
    type: kind,
    x, y,
    hp: st.hp * (elite ? 5 : 1) * (kind === 'brute' ? 1.2 : 1),
    maxHp: st.hp * (elite ? 5 : 1),
    speed: st.speed * (kind === 'bat' ? 1.25 : 1) * (elite ? 0.85 : 1),
    damage: st.damage * (elite ? 2 : 1),
    xp: st.xp * (elite ? 5 : 1),
    sprite: SPR[kind] || kind,
    hitFlash: 0,
    critFlash: 0,
    r: kind === 'brute' ? 28 : 16,
    burn: 0, burnDps: 0,
    poison: 0, poisonDps: 0,
    chill: 0, chillFactor: 1,
    _dead: false,
    scale: 3,
    stun: 0, mark: 0, face: 0, tShoot: 1.5 + Math.random() * 2, cd: 1 + Math.random() * 2,
  };
  if (kind === 'shooter') { e.hp *= 0.9; e.speed *= 0.8; }
  if (kind === 'charger') { e.hp *= 1.2; }
  if (kind === 'splitter') { e.hp *= 1.5; e.scale = 4; e.r = 20; }
  if (kind === 'shield') { e.hp *= 2.2; e.speed *= 0.75; e.scale = 3.5; e.r = 24; e.xp += 1; e.face = Math.atan2(focus.y - y, focus.x - x); }
  if (kind === 'mini') { e.scale = 2; e.r = 11; e.speed *= 1.3; }
  if (elite && tier >= 4 && !o.kind) { e.type = 'elite'; }
  e.maxHp = e.hp;
  if (o.hpMul) { e.hp *= o.hpMul; e.maxHp = e.hp; }
  // v0.02205：普通小怪 ⅓×0.5、⅓×0.75、⅓正常（再乘 pattern 嘅 speedMul）
  if (!elite && !o.boss) {
    const roll = Math.random();
    e.speed *= (roll < 1 / 3 ? 0.5 : roll < 2 / 3 ? 0.75 : 1);
  }
  if (o.speedMul) e.speed *= o.speedMul;
  if (o.vx != null) { e.charge = true; e.vx = o.vx; e.vy = o.vy; e.life = o.life || 8; }
  if (o.boss) {
    e.boss = o.boss;
    // final boss ~¼ 畫面（12px sprite ×40 ≈ 480 = STAGE_W/4）；中 Boss 略大
    if (o.boss === 'boss') {
      e.scale = 40; e.r = 200; e.tShoot = 2.4; e.damage *= 2;
      e.bossPhase = 'idle'; e.jumpY = 0; e.hidden = false; e.slamR = 280;
    } else {
      e.scale = 8; e.r = 52; e.tShoot = 3; e.damage *= 1.5;
    }
  }
  run.enemies.push(e);
  return e;
}

function cameraFocus() {
  const alive = run.players.filter((p) => !p.dead);
  if (!alive.length) return { x: run.cams.x + STAGE_W / 2, y: run.cams.y + STAGE_H / 2 };
  let x = 0, y = 0;
  for (const p of alive) { x += p.x; y += p.y; }
  return { x: x / alive.length, y: y / alive.length };
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function updateEnemies(dt) {
  const alivePlayers = run.players.filter((p) => !p.dead);
  for (const e of run.enemies) {
    if (e.hp <= 0) continue;
    if (e.hitFlash > 0) e.hitFlash -= dt;
    if (e.critFlash > 0) e.critFlash -= dt;

    // DoTs
    if (e.burn > 0) {
      e.burn -= dt;
      e.hp -= (e.burnDps || 4) * dt;
      if (fxFull() && Math.random() < 0.08) addFx(e.x, e.y, 'spark', 6, '#ff6622', { life: 0.25 });
      if (e.hp <= 0) {
        const src = run.players[e.burnSource];
        killEnemy(e, src);
        continue;
      }
    }
    if (e.poison > 0) {
      e.poison -= dt;
      e.hp -= (e.poisonDps || 4) * dt;
      if (e.hp <= 0) {
        const src = run.players[e.poisonSource];
        killEnemy(e, src);
        continue;
      }
    }
    if (e.chill > 0) e.chill -= dt;
    if (e.mark > 0) e.mark -= dt;
    if (e.stun > 0) { e.stun -= dt; continue; }

    let target = null, best = Infinity;
    for (const p of alivePlayers) {
      if (p.carriedBy || p.ball) continue;
      const d = (p.x - e.x) ** 2 + (p.y - e.y) ** 2;
      if (d < best) { best = d; target = p; }
    }
    const zoneSlow = fortressSlow(e);
    if (target && enemyAI(e, target, dt, zoneSlow, alivePlayers)) continue;
    if (e.charge) {
      const slow = e.chill > 0 ? (e.chillFactor || 0.6) : 1;
      e.x += e.vx * slow * dt; e.y += e.vy * slow * dt;
      e.life -= dt;
      if (e.life <= 0) { e.hp = 0; continue; }
      for (const p of alivePlayers) {
        if (Math.hypot(p.x - e.x, p.y - e.y) < e.r + 18) hurtPlayer(p, e.damage, e);
      }
      continue;
    }
    if (e.boss) {
      updateBoss(e, dt, alivePlayers);
      if (e._bossSkipMove || e.hidden) continue;
    }
    if (target) {
      const dx = target.x - e.x, dy = target.y - e.y;
      const len = Math.hypot(dx, dy) || 1;
      const slow = (e.chill > 0 ? (e.chillFactor || 0.6) : 1) * zoneSlow;
      e.x += (dx / len) * e.speed * slow * dt;
      e.y += (dy / len) * e.speed * slow * dt;
      if (len < e.r + 18) hurtPlayer(target, e.damage, e);
    }
  }
  run.enemies = run.enemies.filter((e) => e.hp > 0);
  blockByStructures();
}

function hurtPlayer(target, rawDmg, e) {
  {
    {
      {
        if (target.carriedBy || target.ball) return; // 膊頭上／擲緊唔受傷
        if (target.invuln <= 0 && !target.dead) {
          let dmg = rawDmg * sm(target).damageTaken;
          if (target.carry && hasB(target, '2.12')) dmg *= 0.5;
          if (hasB(target, '1.21')) dmg *= 1.15;
          // 阿公太極線減傷
          if (typeof hasB === 'function' && target.branch && target.branch[0] === '4.2') {
            dmg *= hasB(target, '4.23') ? 0.55 : 0.75;
          }
          if (typeof hasB === 'function' && hasB(target, '4.24') && e && e.hp > 0) {
            hurtEnemy(e, Math.max(4, dmg * 0.55), target);
          }
          if (target.shield > 0) {
            const abs = Math.min(target.shield, dmg);
            target.shield -= abs;
            dmg -= abs;
          }
          target.hp -= dmg;
          target.invuln = 0.55;
          target.flash = 0.2;
          addFloat(target.x, target.y, '-' + Math.round(dmg), '#ff6688', false);
          // thorns
          const th = sm(target).thorns * (te(target).thornsMul || 1);
          if (th > 0 && e && e.hp > 0) hurtEnemy(e, th, target);
          if (target.hp <= 0) {
            target.hp = 0;
            target.dead = true;
            releaseCarry(target);
          }
        }
      }
    }
  }
}
