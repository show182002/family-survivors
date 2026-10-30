/** 一家倖存 · 鍵盤＋虛擬搖桿（左半 P1／右半 P2） */
'use strict';

const keys = Object.create(null);
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  onKeyDown(e);
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

const sticks = {
  p1: { id: null, ox: 0, oy: 0, x: 0, y: 0, dx: 0, dy: 0, active: false },
  p2: { id: null, ox: 0, oy: 0, x: 0, y: 0, dx: 0, dy: 0, active: false },
};

function stickMetrics() {
  const base = Math.min(STAGE_W, STAGE_H);
  return {
    radius: Math.max(100, Math.floor(base * 0.12)),
    knobMax: Math.max(70, Math.floor(base * 0.09)),
    knobR: Math.max(40, Math.floor(base * 0.05)),
  };
}

function whichStick(canvasX) {
  return canvasX < STAGE_W / 2 ? sticks.p1 : sticks.p2;
}

function defaultStickBase(stick) {
  const m = stickMetrics();
  return {
    x: stick === sticks.p1 ? STAGE_W * 0.18 : STAGE_W * 0.82,
    y: STAGE_H * 0.78,
    m,
  };
}

function clientToStage(clientX, clientY) {
  const rect = el.canvas.getBoundingClientRect();
  const rw = rect.width || 1;
  const rh = rect.height || 1;
  return {
    x: ((clientX - rect.left) / rw) * STAGE_W,
    y: ((clientY - rect.top) / rh) * STAGE_H,
  };
}

function setStickFromTouch(stick, cx, cy) {
  const m = stickMetrics();
  stick.x = cx; stick.y = cy;
  let dx = (stick.x - stick.ox) / m.knobMax;
  let dy = (stick.y - stick.oy) / m.knobMax;
  const len = Math.hypot(dx, dy) || 1;
  if (len > 1) { dx /= len; dy /= len; }
  stick.dx = dx; stick.dy = dy;
  stick.active = true;
}

function clearStick(stick) {
  stick.id = null; stick.active = false; stick.dx = 0; stick.dy = 0;
}

function touchIgnoredTarget(target) {
  if (!target || !target.closest) return false;
  return !!target.closest('button, a, input, select, textarea, .overlay, #rotateModal, #fsBtn, .ult-btn, .auto-chip, .fx-chip');
}

function onStickDown(clientX, clientY, pointerId, target) {
  if (typeof mode !== 'undefined' && mode !== 'play') return;
  if (touchIgnoredTarget(target)) return;
  // portrait hard-gate: ignore sticks
  if (typeof isPortraitGated === 'function' && isPortraitGated()) return;
  const p = clientToStage(clientX, clientY);
  const stick = whichStick(p.x);
  // if only 1P, right half still maps to p1 for solo comfort? Keep art-demo rule: left P1 right P2
  if (stick === sticks.p2 && run && run.players && run.players.length < 2) {
    // solo: allow whole screen as P1
    const s = sticks.p1;
    if (s.id != null && s.id !== pointerId) return;
    s.id = pointerId;
    const def = defaultStickBase(s);
    s.ox = def.x; s.oy = def.y;
    setStickFromTouch(s, p.x, p.y);
    return;
  }
  if (stick.id != null && stick.id !== pointerId) return;
  stick.id = pointerId;
  const def = defaultStickBase(stick);
  stick.ox = def.x; stick.oy = def.y;
  setStickFromTouch(stick, p.x, p.y);
}

function onStickMove(clientX, clientY, pointerId) {
  const p = clientToStage(clientX, clientY);
  if (sticks.p1.id === pointerId) setStickFromTouch(sticks.p1, p.x, p.y);
  if (sticks.p2.id === pointerId) setStickFromTouch(sticks.p2, p.x, p.y);
}

function onStickUp(pointerId) {
  if (sticks.p1.id === pointerId) clearStick(sticks.p1);
  if (sticks.p2.id === pointerId) clearStick(sticks.p2);
}

function bindStickTarget(node) {
  if (!node) return;
  node.addEventListener('touchstart', (e) => {
    if (touchIgnoredTarget(e.target)) return;
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      onStickDown(t.clientX, t.clientY, t.identifier, e.target);
    }
  }, { passive: false });
  node.addEventListener('touchmove', (e) => {
    if (touchIgnoredTarget(e.target) && !sticks.p1.active && !sticks.p2.active) return;
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      onStickMove(t.clientX, t.clientY, t.identifier);
    }
  }, { passive: false });
  node.addEventListener('touchend', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) onStickUp(e.changedTouches[i].identifier);
  }, { passive: false });
  node.addEventListener('touchcancel', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) onStickUp(e.changedTouches[i].identifier);
  }, { passive: false });
}

function axisFromKeys(map) {
  let dx = 0, dy = 0;
  if (keys[map.l]) dx -= 1;
  if (keys[map.r]) dx += 1;
  if (keys[map.u]) dy -= 1;
  if (keys[map.d]) dy += 1;
  if (dx && dy) { const inv = 1 / Math.SQRT2; dx *= inv; dy *= inv; }
  return { dx, dy };
}

function mergeStick(keyAxis, stick) {
  if (stick.active) return { dx: stick.dx, dy: stick.dy };
  return keyAxis;
}

function playerMoveAxis(slot) {
  if (slot === 0) {
    return mergeStick(
      axisFromKeys({ l: 'KeyA', r: 'KeyD', u: 'KeyW', d: 'KeyS' }),
      sticks.p1
    );
  }
  return mergeStick(
    axisFromKeys({ l: 'ArrowLeft', r: 'ArrowRight', u: 'ArrowUp', d: 'ArrowDown' }),
    sticks.p2
  );
}

function drawVirtualSticks(g) {
  if (typeof mode !== 'undefined' && mode !== 'play') return;
  const showP2 = run && run.players && run.players.length > 1;
  function drawOne(stick, label, color) {
    const def = defaultStickBase(stick);
    const m = def.m;
    const baseX = stick.active ? stick.ox : def.x;
    const baseY = stick.active ? stick.oy : def.y;
    g.beginPath();
    g.arc(baseX, baseY, m.radius, 0, Math.PI * 2);
    g.fillStyle = 'rgba(0,0,0,0.32)';
    g.fill();
    g.strokeStyle = color;
    g.lineWidth = 4;
    g.stroke();
    const kx = stick.active ? stick.ox + stick.dx * m.knobMax : baseX;
    const ky = stick.active ? stick.oy + stick.dy * m.knobMax : baseY;
    g.beginPath();
    g.arc(kx, ky, m.knobR, 0, Math.PI * 2);
    g.fillStyle = stick.active ? color : 'rgba(255,255,255,0.25)';
    g.fill();
    g.fillStyle = 'rgba(255,255,240,0.85)';
    g.font = '600 22px sans-serif';
    g.textAlign = 'center';
    g.fillText(label, baseX, baseY - m.radius - 12);
    g.textAlign = 'left';
  }
  drawOne(sticks.p1, 'P1', 'rgba(100,220,160,0.9)');
  if (showP2) drawOne(sticks.p2, 'P2', 'rgba(100,160,255,0.9)');
}

// defer bind until DOM ready (dom.js loads before this — el exists)
document.addEventListener('DOMContentLoaded', () => {
  bindStickTarget(document.getElementById('screen-game'));
});
// also bind immediately if already parsed
if (document.getElementById('screen-game')) {
  bindStickTarget(document.getElementById('screen-game'));
}
