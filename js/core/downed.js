/** v0.02300 · Downed / revive (proximity channel) */
'use strict';

const DOWNED_WINDOW = 10; // seconds until permanent out
const REVIVE_NEED = 10;   // seconds standing near to revive
const REVIVE_RADIUS = 95;

function isOut(p) { return !p || !!p.dead; }
function isDowned(p) { return !!(p && p.downed && !p.dead); }
function isCombatActive(p) {
  return !!(p && !p.dead && !p.downed && !p.ball);
}
function isHuman(p) { return !!(p && !p.ai); }

function enterDowned(p) {
  if (!p || p.dead || p.downed) return;
  if (typeof releaseCarry === 'function') releaseCarry(p);
  p.hp = 0;
  p.downed = true;
  p.downedT = DOWNED_WINDOW;
  p.reviveProg = 0;
  p.invuln = 0.3;
  p.flash = 0.4;
  if (p.art) p.art.moving = false;
  if (typeof banner === 'function') banner(p.name + ' 倒地！近身救 10 秒', '#ff8866', 2.4);
  addFloat(p.x, p.y - 60, '倒地！', '#ff8866', true);
  if (typeof addFx === 'function') {
    addFx(p.x, p.y, 'ring', 80, '#ff6688');
    addFx(p.x, p.y, 'burst', 50, '#ffaa88');
  }
}

function finishOut(p) {
  if (!p || p.dead) return;
  p.downed = false;
  p.dead = true;
  p.hp = 0;
  p.reviveProg = 0;
  p.downedT = 0;
  if (typeof banner === 'function') banner(p.name + ' 出局…', '#ff4455', 2.2);
  addFloat(p.x, p.y - 70, '出局', '#ff4455', true);
  if (typeof addFx === 'function') addFx(p.x, p.y, 'burst', 70, '#ff3344');
}

function revivePlayer(p) {
  if (!p || p.dead || !p.downed) return;
  const half = Math.max(1, Math.floor(p.maxHp * 0.5));
  p.downed = false;
  p.downedT = 0;
  p.reviveProg = 0;
  p.hp = half;
  p.invuln = Math.max(p.invuln || 0, 1.5);
  p.flash = 0.5;
  if (typeof banner === 'function') banner(p.name + ' 救起！半血', '#88ffaa', 2.2);
  addFloat(p.x, p.y - 70, '得救！半血', '#88ffaa', true);
  if (typeof addFx === 'function') {
    addFx(p.x, p.y, 'heal', 120, '#88ffaa');
    addFx(p.x, p.y, 'ring', 100, '#c8ffe0');
  }
  if (typeof shake === 'function') shake(10);
  if (typeof sfxUlt === 'function') sfxUlt();
}

function nearestDownedAlly(from) {
  if (!run || !from) return null;
  let best = null, bestD = Infinity;
  for (const p of run.players) {
    if (p === from || !isDowned(p) || p.caged) continue;
    const d = (p.x - from.x) ** 2 + (p.y - from.y) ** 2;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

function updateDowned(dt) {
  if (!run || !run.players) return;
  for (const p of run.players) {
    if (!isDowned(p)) continue;
    p.downedT = (p.downedT == null ? DOWNED_WINDOW : p.downedT) - dt;
    // Find a living ally nearby (humans + free AI; not caged, not downed/dead)
    let near = false;
    let bestSaver = null;
    for (const a of run.players) {
      if (a === p || isOut(a) || isDowned(a) || a.caged || a.ball || a.carriedBy) continue;
      const d2 = (a.x - p.x) ** 2 + (a.y - p.y) ** 2;
      if (d2 <= REVIVE_RADIUS * REVIVE_RADIUS) {
        near = true;
        bestSaver = a;
        break;
      }
    }
    if (near) {
      p.reviveProg = (p.reviveProg || 0) + dt;
      if (p.reviveProg >= REVIVE_NEED) {
        revivePlayer(p);
        continue;
      }
    } else {
      // Progress pauses when nobody is near (does not reset — soft assist if late)
      // Keep progress; only time window drains.
    }
    if (p.downedT <= 0) {
      finishOut(p);
    }
  }
}

/** AI prefers walking to a downed ally to channel revive */
function aiReviveBias(p) {
  const d = nearestDownedAlly(p);
  if (!d) return null;
  const dx = d.x - p.x, dy = d.y - p.y;
  const dist = Math.hypot(dx, dy) || 1;
  if (dist < REVIVE_RADIUS * 0.55) return { dx: 0, dy: 0 }; // stand still to channel
  return { dx: dx / dist, dy: dy / dist };
}

function humansAllOut() {
  if (!run || !run.players) return true;
  const humans = run.players.filter(isHuman);
  if (!humans.length) return true;
  return humans.every(isOut);
}

function drawDownedOverlays(cam) {
  if (!run || !run.players) return;
  for (const p of run.players) {
    if (!isDowned(p)) continue;
    const sx = p.x - cam.x, sy = p.y - cam.y;
    const tLeft = Math.max(0, p.downedT || 0);
    const prog = Math.min(1, (p.reviveProg || 0) / REVIVE_NEED);
    ctx.save();
    // pulse ring
    const pulse = 0.55 + 0.45 * Math.sin((run.time || 0) * 8);
    ctx.globalAlpha = 0.35 + 0.25 * pulse;
    ctx.strokeStyle = '#ff6688';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(sx, sy - 10, REVIVE_RADIUS * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // countdown
    ctx.fillStyle = '#000';
    ctx.fillRect(sx - 30, sy - 88, 60, 18);
    ctx.fillStyle = '#ff8866';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('倒地 ' + Math.ceil(tLeft) + 's', sx, sy - 74);
    // revive bar
    ctx.fillStyle = '#000';
    ctx.fillRect(sx - 36, sy - 66, 72, 8);
    ctx.fillStyle = '#223322';
    ctx.fillRect(sx - 35, sy - 65, 70, 6);
    ctx.fillStyle = prog > 0 ? '#88ffaa' : '#665544';
    ctx.fillRect(sx - 35, sy - 65, 70 * prog, 6);
    ctx.restore();
  }
}
