/** 一家倖存 · 經驗寶石、特效更新、鏡頭 */
'use strict';

function updateGems(dt) {
  const alive = run.players.filter((p) => !p.dead);
  if (!alive.length) return;
  for (const g of run.gems) {
    g.life -= dt;
    let nearest = null, nd = Infinity;
    for (const p of alive) {
      const d = (p.x - g.x) ** 2 + (p.y - g.y) ** 2;
      if (d < nd) { nd = d; nearest = p; }
    }
    if (!nearest) continue;
    const pickup = nearest.pickupRadius * sm(nearest).pickup;
    const vacuum = run.magnetPulse > 0 ? 2000 : pickup * 2.2;
    const d = Math.sqrt(nd);
    if (d < vacuum || g.magnet) {
      g.magnet = true;
      const spd = run.magnetPulse > 0 ? 900 : 380 + (1 - d / vacuum) * 420;
      const dx = nearest.x - g.x, dy = nearest.y - g.y;
      const len = Math.hypot(dx, dy) || 1;
      g.x += (dx / len) * spd * dt;
      g.y += (dy / len) * spd * dt;
    }
    if (d < 22 || (g.magnet && d < 28)) {
      g._got = true;
      addXp(g.v, nearest);
    }
  }
  run.gems = run.gems.filter((g) => !g._got && g.life > 0);
}

function updateFx(dt) {
  for (const f of run.fx) f.t += dt;
  run.fx = run.fx.filter((f) => f.t < f.life);
  for (const f of run.floats) {
    f.t += dt;
    f.y -= 40 * dt;
  }
  run.floats = run.floats.filter((f) => f.t < f.life);
}

function updateCamera(dt) {
  const f = cameraFocus();
  const tx = f.x - STAGE_W / 2;
  const ty = f.y - STAGE_H / 2;
  run.cams.x += (tx - run.cams.x) * Math.min(1, 6 * dt);
  run.cams.y += (ty - run.cams.y) * Math.min(1, 6 * dt);
  run.cams.x = clamp(run.cams.x, 0, MAP_W - STAGE_W);
  run.cams.y = clamp(run.cams.y, 0, MAP_H - STAGE_H);
}
