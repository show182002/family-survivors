/** v0.02300 · Family Chaos mode — rotate playstyle ~every 30s */
'use strict';

const CHAOS_PHASE_LEN = 30;
const CHAOS_PHASES = ['mow', 'deliver', 'defend'];

function chaosPhaseLabel(id) {
  if (id === 'mow') return '割草波';
  if (id === 'deliver') return '送物到點';
  if (id === 'defend') return '基地防守';
  return id || '';
}

function initChaos(runObj) {
  runObj.chaos = {
    phaseIdx: 0,
    phaseId: CHAOS_PHASES[0],
    phaseT: 0,
    phaseLen: CHAOS_PHASE_LEN,
    pkg: null,
    drop: null,
    base: null,
    delivered: 0,
    defendOk: 0,
  };
  startChaosPhase(runObj, CHAOS_PHASES[0], true);
}

function startChaosPhase(runObj, id, silent) {
  const ch = runObj.chaos;
  ch.phaseId = id;
  ch.phaseT = 0;
  ch.phaseLen = CHAOS_PHASE_LEN;
  ch.pkg = null;
  ch.drop = null;
  // clear previous base soft
  ch.base = null;

  const f = typeof cameraFocus === 'function' ? cameraFocus() : { x: MAP_W / 2, y: MAP_H / 2 };

  if (id === 'deliver') {
    const ang = Math.random() * Math.PI * 2;
    ch.pkg = {
      x: clamp(f.x + Math.cos(ang) * 90, 80, MAP_W - 80),
      y: clamp(f.y + Math.sin(ang) * 70, 80, MAP_H - 80),
      carrier: null,
      r: 22,
    };
    const dang = ang + Math.PI * (0.7 + Math.random() * 0.6);
    ch.drop = {
      x: clamp(f.x + Math.cos(dang) * 260, 100, MAP_W - 100),
      y: clamp(f.y + Math.sin(dang) * 200, 100, MAP_H - 100),
      r: 70,
    };
  } else if (id === 'defend') {
    ch.base = {
      x: f.x, y: f.y,
      hp: 420, maxHp: 420, r: 64, t: 0,
    };
  }

  if (!silent && typeof banner === 'function') {
    banner('▶ ' + chaosPhaseLabel(id), '#ffe566', 2.6);
  }
  if (typeof addFx === 'function') {
    addFx(f.x, f.y, 'ring', 140, '#ffe566');
    addFx(f.x, f.y, 'burst', 90, '#88aaff');
  }
}

function advanceChaosPhase(runObj) {
  const ch = runObj.chaos;
  ch.phaseIdx = (ch.phaseIdx + 1) % CHAOS_PHASES.length;
  startChaosPhase(runObj, CHAOS_PHASES[ch.phaseIdx], false);
}

function updateChaos(dt) {
  if (!run || !run.chaos || run.gameMode !== 'chaos') return;
  const ch = run.chaos;
  ch.phaseT += dt;

  if (ch.phaseId === 'deliver') updateChaosDeliver(dt, ch);
  else if (ch.phaseId === 'defend') updateChaosDefend(dt, ch);
  // mow = normal combat; nothing extra

  if (ch.phaseT >= ch.phaseLen) advanceChaosPhase(run);
}

function updateChaosDeliver(dt, ch) {
  if (!ch.pkg || !ch.drop) return;
  // carrier pickup / carry
  if (ch.pkg.carrier == null) {
    for (const p of run.players) {
      if (!isCombatActive(p) || p.caged) continue;
      if ((p.x - ch.pkg.x) ** 2 + (p.y - ch.pkg.y) ** 2 < 40 * 40) {
        ch.pkg.carrier = p.slot;
        if (typeof banner === 'function') banner('拎到包裹！送到黃圈', '#ffe566', 1.8);
        break;
      }
    }
  } else {
    const p = run.players[ch.pkg.carrier];
    if (!p || !isCombatActive(p) || p.caged) {
      // drop where they fell / left
      if (p) { ch.pkg.x = p.x; ch.pkg.y = p.y; }
      ch.pkg.carrier = null;
    } else {
      ch.pkg.x = p.x;
      ch.pkg.y = p.y - 28;
      if ((p.x - ch.drop.x) ** 2 + (p.y - ch.drop.y) ** 2 < ch.drop.r * ch.drop.r) {
        ch.delivered = (ch.delivered || 0) + 1;
        ch.pkg = null;
        if (typeof banner === 'function') banner('送到！+' + (ch.delivered) + ' 單', '#88ffaa', 2);
        if (typeof addXp === 'function') addXp(8, p);
        if (typeof addFx === 'function') {
          addFx(ch.drop.x, ch.drop.y, 'burst', 120, '#ffe566');
          addFx(ch.drop.x, ch.drop.y, 'heal', 100, '#88ffaa');
        }
        // respawn another package for remaining phase time
        if (ch.phaseT < ch.phaseLen - 4) {
          const f = typeof cameraFocus === 'function' ? cameraFocus() : { x: p.x, y: p.y };
          const ang = Math.random() * Math.PI * 2;
          ch.pkg = {
            x: clamp(f.x + Math.cos(ang) * 120, 80, MAP_W - 80),
            y: clamp(f.y + Math.sin(ang) * 90, 80, MAP_H - 80),
            carrier: null, r: 22,
          };
        }
      }
    }
  }
}

function updateChaosDefend(dt, ch) {
  if (!ch.base) return;
  const b = ch.base;
  b.t = (b.t || 0) + dt;
  // Enemies near base chip it
  for (const e of run.enemies) {
    if (e.hp <= 0) continue;
    const d2 = (e.x - b.x) ** 2 + (e.y - b.y) ** 2;
    // Pull slightly toward base
    if (d2 < 520 * 520) {
      const d = Math.sqrt(d2) || 1;
      e.x += ((b.x - e.x) / d) * e.speed * 0.35 * dt;
      e.y += ((b.y - e.y) / d) * e.speed * 0.35 * dt;
    }
    if (d2 < (b.r + e.r) * (b.r + e.r)) {
      b.hp -= (e.damage || 8) * 0.55 * dt * 8; // chip
      if (Math.random() < 0.08) addFloat(b.x, b.y - 40, '基地!', '#ffaa66', false);
    }
  }
  if (b.hp <= 0) {
    b.hp = 0;
    if (!b._broke) {
      b._broke = true;
      if (typeof banner === 'function') banner('基地破咗！守下一波', '#ff6688', 2.4);
      if (typeof shake === 'function') shake(14);
    }
  } else if (ch.phaseT >= ch.phaseLen - 0.05 && !b._broke) {
    ch.defendOk = (ch.defendOk || 0) + 1;
  }
}

function drawChaos(cam) {
  if (!run || !run.chaos || run.gameMode !== 'chaos') return;
  const ch = run.chaos;
  // phase HUD strip (canvas)
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(STAGE_W / 2 - 160, 8, 320, 36);
  ctx.fillStyle = '#ffe566';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  const left = Math.max(0, ch.phaseLen - ch.phaseT);
  ctx.fillText('大暴走 · ' + chaosPhaseLabel(ch.phaseId) + ' · ' + Math.ceil(left) + 's', STAGE_W / 2, 32);
  ctx.restore();

  if (ch.phaseId === 'deliver') {
    if (ch.drop) {
      const sx = ch.drop.x - cam.x, sy = ch.drop.y - cam.y;
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.2 * Math.sin((run.time || 0) * 5);
      ctx.strokeStyle = '#ffe566';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(sx, sy, ch.drop.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffe566';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('送達點', sx, sy - ch.drop.r - 8);
      ctx.restore();
    }
    if (ch.pkg) {
      const sx = ch.pkg.x - cam.x, sy = ch.pkg.y - cam.y;
      ctx.save();
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📦', sx, sy);
      if (ch.pkg.carrier == null) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('拎包裹', sx, sy + 22);
      }
      ctx.restore();
    }
  }

  if (ch.phaseId === 'defend' && ch.base) {
    const b = ch.base;
    const sx = b.x - cam.x, sy = b.y - cam.y;
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = b.hp > 0 ? '#88aaff' : '#ff4455';
    ctx.beginPath();
    ctx.arc(sx, sy, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#cce0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(sx, sy, b.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⛺', sx, sy + 8);
    ctx.fillStyle = '#000';
    ctx.fillRect(sx - 40, sy - b.r - 18, 80, 10);
    ctx.fillStyle = b.hp > b.maxHp * 0.3 ? '#88ffaa' : '#ff6688';
    ctx.fillRect(sx - 40, sy - b.r - 18, 80 * Math.max(0, b.hp / b.maxHp), 10);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('守住基地', sx, sy - b.r - 24);
    ctx.restore();
  }
}
