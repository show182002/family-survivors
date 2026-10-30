/** 一家倖存 · 主迴圈、玩家移動 */
'use strict';

// ——— Update ———
function frame(ts) {
  if (mode !== 'play' || !run) return;
  // v0.02001：rAF 嘅 ts 可能早過恢復時記低嘅 performance.now() → dt 唔可以負
  let dt = lastTs ? (ts - lastTs) / 1000 : 0;
  lastTs = ts;
  if (!(dt > 0)) dt = 0;
  if (dt > 0.05) dt = 0.05;
  try {
    frameStep(dt);
  } catch (err) {
    // 單一錯誤只記低，唔會令成個遊戲停
    console.error('[一家倖存] frame error', err);
  }
  if (mode === 'play' && run) animId = requestAnimationFrame(frame);
}
function frameStep(dt) {

  run.time += dt;
  if (run.magnetPulse > 0) run.magnetPulse -= dt;
  if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 30);

  updatePlayers(dt);
  updateWeapons(dt);
  updateSkillActs(dt);
  updateBranches(dt);
  updateProjectiles(dt);
  updateEnemies(dt);
  spawnEnemies(dt);
  updateGems(dt);
  updateFx(dt);
  updateCamera(dt);
  updateHud();

  if (run.time >= WIN_TIME) { endRun(true); return; }
  if (run.players.every((p) => p.dead)) { endRun(false); return; }

  draw();
}

function updatePlayers(dt) {
  for (const p of run.players) {
    if (p.dead) continue;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.ultCd > 0) p.ultCd -= dt;
    if (p.flash > 0) p.flash -= dt;
    if (p.shield > 0) p.shield = Math.max(0, p.shield - dt * 2);

    const mods = sm(p);
    if (mods.regen > 0) p.hp = Math.min(p.maxHp, p.hp + mods.regen * dt);

    // fire aura tag rule
    const eff = te(p);
    if (eff.fireAura) {
      p.tFireAura -= dt;
      if (p.tFireAura <= 0) {
        p.tFireAura = 0.4 * mods.cooldown;
        const r = 70 * mods.area * (eff.auraAreaMul || 1) * mods.fireRadius;
        damageEnemiesInRadius(p.x, p.y, r, (eff.fireAuraDps || 8) * mods.fireDamage, p, { forceBurn: Math.random() < 0.3 });
        if (fxFull()) addFx(p.x, p.y, 'fire_aura', r, '#ff6633');
      }
    }

    if (p.atkBuff > 0) p.atkBuff -= dt;
    if (p.carriedBy || p.ball) continue; // 位置由爸爸／波控制
    const axis = playerMoveAxis(p.slot);
    let mx = axis.dx || 0, my = axis.dy || 0;
    if (mx || my) {
      const len = Math.hypot(mx, my) || 1;
      mx /= len; my /= len;
      if (mx) p.facing = mx > 0 ? 1 : -1;
      if (!p.art) p.art = { dir: 'down', flipX: false, walkT: 0, moving: false };
      p.art.moving = true;
      p.art.walkT += dt;
      if (window.ArtSprite && ArtSprite.pickFacing) ArtSprite.pickFacing(mx, my, p.art);
    } else if (p.art) {
      p.art.moving = false;
      p.art.walkT = 0;
    }
    const spd = p.speed * mods.moveSpeed * (p.bSpeed || 1) * (p.carry && hasB(p, '2.21') ? 0.7 : 1);
    const rad = (p.charId === 'dad') ? 12 : 10;
    let nx = p.x + mx * spd * dt;
    let ny = p.y + my * spd * dt;
    if (!collidesTree(nx, ny, rad)) { p.x = nx; p.y = ny; }
    else {
      if (!collidesTree(nx, p.y, rad)) p.x = nx;
      if (!collidesTree(p.x, ny, rad)) p.y = ny;
    }
    p.x = clamp(p.x, 30, MAP_W - 30);
    p.y = clamp(p.y, 30, MAP_H - 30);
    if (hasB(p, '1.22')) { p.hist.unshift({ x: p.x, y: p.y }); if (p.hist.length > 60) p.hist.length = 60; }
  }
}
