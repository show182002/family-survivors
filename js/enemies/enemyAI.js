/** 一家倖存 · 射手／衝鋒／盾怪 AI */
'use strict';

// ——— 新敵人 AI（返 true＝已處理移動） ———
function enemyAI(e, target, dt, zoneSlow, alive) {
  const slow = (e.chill > 0 ? (e.chillFactor || 0.6) : 1) * zoneSlow;
  const dx = target.x - e.x, dy = target.y - e.y, len = Math.hypot(dx, dy) || 1;
  if (e.type === 'shooter') {
    const want = len < 320 ? -1 : len > 430 ? 1 : 0;
    const sx = -dy / len * 0.5;
    const sy = dx / len * 0.5;
    e.x += (dx / len * want + sx) * e.speed * slow * dt;
    e.y += (dy / len * want + sy) * e.speed * slow * dt;
    e.tShoot -= dt;
    if (e.tShoot <= 0 && len < 700) {
      e.tShoot = 2.8 + Math.random();
      if (run.ebul.length < 200) {
        const a = Math.atan2(dy, dx);
        run.ebul.push({ x: e.x, y: e.y - 20, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, life: 5, dmg: e.damage * 0.9, r: 14, color: '#ffa31a' });
      }
    }
    if (len < e.r + 18) hurtPlayer(target, e.damage, e);
    return true;
  }
  if (e.type === 'charger') {
    e.cd -= dt;
    if (e.dashT > 0) {
      e.dashT -= dt;
      e.x += e.dvx * slow * dt; e.y += e.dvy * slow * dt;
      for (const p of alive) if (!p.carriedBy && !p.ball && Math.hypot(p.x - e.x, p.y - e.y) < e.r + 20) hurtPlayer(p, e.damage * 1.3, e);
      return true;
    }
    if (e.wind > 0) {
      e.wind -= dt;
      if (e.wind <= 0) { e.dashT = 0.55; }
      return true;
    }
    if (len < 380 && e.cd <= 0) {
      e.cd = 3.5; e.wind = 0.6;
      e.dvx = dx / len * 620; e.dvy = dy / len * 620;
      return true;
    }
    return false;
  }
  if (e.type === 'shield') {
    const want = Math.atan2(dy, dx);
    let da = want - e.face;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    e.face += clamp(da, -1.4 * dt, 1.4 * dt);
    return false;
  }
  return false;
}
