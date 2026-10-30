/** 一家倖存 · art-demo 風格樹（碰撞擋角色） */
'use strict';

const TREE_TILE = 40;
let WORLD_TREES = [];

function hashTree(x, y) {
  let n = x * 374761393 + y * 668265263;
  n = (n ^ (n >> 13)) * 1274126177;
  return (n ^ (n >> 16)) >>> 0;
}

function rebuildTrees() {
  WORLD_TREES = [];
  const spawnX = MAP_W / 2;
  const spawnY = MAP_H / 2;
  const count = 160;
  for (let i = 0; i < count; i++) {
    const h = hashTree(i * 11 + 3, i * 17 + 5);
    const x = 80 + (h % Math.max(1, MAP_W - 160));
    const y = 80 + (((h >> 9) % Math.max(1, MAP_H - 160)));
    if (Math.hypot(x - spawnX, y - spawnY) < 220) continue;
    WORLD_TREES.push({ x, y, s: 0.9 + (h % 5) * 0.08, r: 16 });
  }
}

function collidesTree(x, y, radius) {
  const r0 = radius || 12;
  for (let i = 0; i < WORLD_TREES.length; i++) {
    const t = WORLD_TREES[i];
    const rr = t.r + r0;
    const ddx = x - t.x, ddy = y - t.y;
    if (ddx * ddx + ddy * ddy < rr * rr) return true;
  }
  return false;
}

function ovalTree(g, x, y, rx, ry) {
  g.beginPath();
  if (g.ellipse) g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  else { g.save(); g.translate(x, y); g.scale(rx, ry); g.arc(0, 0, 1, 0, Math.PI * 2); g.restore(); }
}

function drawTreeOne(g, t, camX, camY) {
  const sx = t.x - camX, sy = t.y - camY;
  if (sx < -90 || sy < -120 || sx > STAGE_W + 90 || sy > STAGE_H + 90) return;
  const s = t.s;
  g.fillStyle = 'rgba(0,0,0,0.25)';
  ovalTree(g, sx, sy + 3, 20 * s, 9 * s); g.fill();
  g.fillStyle = '#5a3a18'; g.fillRect(sx - 5 * s, sy - 26 * s, 10 * s, 26 * s);
  g.fillStyle = '#3a2410'; g.fillRect(sx - 5 * s, sy - 26 * s, 3 * s, 26 * s);
  const layers = [
    { y: -46, r: 26, c: '#2e6e28' },
    { y: -56, r: 22, c: '#3a8a32' },
    { y: -64, r: 16, c: '#4aa03c' },
  ];
  for (let i = 0; i < layers.length; i++) {
    const L = layers[i];
    g.fillStyle = L.c;
    g.beginPath();
    g.arc(sx, sy + L.y * s, L.r * s, 0, Math.PI * 2);
    g.fill();
  }
}

function drawAllTrees(cam) {
  for (let i = 0; i < WORLD_TREES.length; i++) {
    drawTreeOne(ctx, WORLD_TREES[i], cam.x, cam.y);
  }
}

/** Y-sort trees with a list of {y, draw()} items — used for players + trees */
function drawTreesAndPlayers(cam, playerDrawList) {
  const items = [];
  for (let i = 0; i < WORLD_TREES.length; i++) {
    const t = WORLD_TREES[i];
    const sx = t.x - cam.x, sy = t.y - cam.y;
    if (sx < -90 || sy < -120 || sx > STAGE_W + 90 || sy > STAGE_H + 90) continue;
    items.push({ y: t.y, kind: 'tree', t });
  }
  for (let i = 0; i < playerDrawList.length; i++) {
    items.push(playerDrawList[i]);
  }
  items.sort((a, b) => a.y - b.y);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.kind === 'tree') drawTreeOne(ctx, it.t, cam.x, cam.y);
    else it.draw();
  }
}

rebuildTrees();
