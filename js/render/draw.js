/** 一家倖存 · 主繪圖 */
'use strict';

/** arc 半徑永遠 ≥0（負數會令 canvas 拋錯） */
function arcSafe(x, y, r, a0, a1) { ctx.arc(x, y, r > 0 ? r : 0, a0, a1); }

// ——— Draw ———
function draw() {
  const cam = run.cams;
  let ox = 0, oy = 0;
  if (screenShake > 0 && fxFull()) {
    ox = (Math.random() - 0.5) * screenShake * 2;
    oy = (Math.random() - 0.5) * screenShake * 2;
  }
  ctx.setTransform(1, 0, 0, 1, ox, oy);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0c1010';
  ctx.fillRect(-10, -10, STAGE_W + 20, STAGE_H + 20);

  const tile = 48;
  const x0 = Math.floor(cam.x / tile) * tile;
  const y0 = Math.floor(cam.y / tile) * tile;
  for (let y = y0; y < cam.y + STAGE_H + tile; y += tile) {
    for (let x = x0; x < cam.x + STAGE_W + tile; x += tile) {
      const gx = x - cam.x, gy = y - cam.y;
      const checker = ((x / tile) + (y / tile)) & 1;
      ctx.fillStyle = checker ? '#1a3a28' : '#163424';
      ctx.fillRect(gx, gy, tile, tile);
      ctx.fillStyle = checker ? '#245838' : '#1e4830';
      ctx.fillRect(gx + 8, gy + 12, 4, 4);
      ctx.fillRect(gx + 28, gy + 30, 4, 4);
    }
  }

  ctx.strokeStyle = '#e8c84a';
  ctx.lineWidth = 4;
  ctx.strokeRect(-cam.x, -cam.y, MAP_W, MAP_H);

  for (const g of run.gems) {
    const sx = g.x - cam.x, sy = g.y - cam.y;
    ctx.fillStyle = g.v >= 3 ? '#88eeff' : '#44aaff';
    ctx.fillRect(sx - g.r, sy - g.r, g.r * 2, g.r * 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx - 1, sy - 1, 2, 2);
  }

  for (const e of run.enemies) {
    if (e.hp <= 0) continue;
    const sx = e.x - cam.x, sy = e.y - cam.y;
    if (sx < -80 || sy < -80 || sx > STAGE_W + 80 || sy > STAGE_H + 80) continue;
    if (e.critFlash > 0) {
      ctx.fillStyle = 'rgba(255,230,100,0.5)';
      ctx.beginPath();
      arcSafe(sx, sy - 16, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    if (e.hitFlash > 0) {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#fff';
      ctx.fillRect(sx - 12, sy - 28, 24, 28);
      ctx.globalAlpha = 1;
    }
    if (e.charge) { ctx.fillStyle = 'rgba(255,60,60,0.35)'; ctx.fillRect(sx - e.vx * 0.15 - 6, sy - 18, 12, 6); }
    if (e.boss) {
      ctx.fillStyle = e.boss === 'boss' ? 'rgba(200,40,255,0.25)' : 'rgba(255,140,40,0.25)';
      ctx.beginPath(); arcSafe(sx, sy - e.r * 0.6, e.r * 1.2, 0, Math.PI * 2); ctx.fill();
    }
    drawSprite(ctx, e.sprite, sx, sy, e.scale || 3, false);
    if (e.type !== 'slime' && e.type !== 'bat' && e.type !== 'ghost') drawEnemyMark(e, sx, sy);
    // status pips
    if (e.burn > 0) { ctx.fillStyle = '#ff4422'; ctx.fillRect(sx - 10, sy - 40, 6, 6); }
    if (e.poison > 0) { ctx.fillStyle = '#66ff44'; ctx.fillRect(sx - 2, sy - 40, 6, 6); }
    if (e.chill > 0) { ctx.fillStyle = '#66ccff'; ctx.fillRect(sx + 6, sy - 40, 6, 6); }
    if (e.boss) {
      // 大血條
    } else if (e.hp < e.maxHp) {
      ctx.fillStyle = '#000';
      ctx.fillRect(sx - 14, sy - 36, 28, 4);
      ctx.fillStyle = '#f44';
      ctx.fillRect(sx - 14, sy - 36, 28 * (e.hp / e.maxHp), 4);
    }
  }

  // projectiles — bigger & brighter
  for (const pr of run.projectiles) {
    const sx = pr.x - cam.x, sy = pr.y - cam.y;
    ctx.fillStyle = pr.color;
    ctx.beginPath();
    arcSafe(sx, sy, pr.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    arcSafe(sx, sy, pr.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawExtras(cam);

  for (const p of run.players) {
    if (p.dead) continue;
    const sx = p.x - cam.x, sy = p.y - cam.y - (p.carriedBy ? 64 : 0);
    if (p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0) ctx.globalAlpha = 0.45;
    if (p.flash > 0) {
      ctx.fillStyle = 'rgba(255,255,200,0.3)';
      ctx.beginPath();
      arcSafe(sx, sy - 20, 48, 0, Math.PI * 2);
      ctx.fill();
    }
    if (p.shield > 0) {
      ctx.strokeStyle = 'rgba(136,170,255,0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      arcSafe(sx, sy - 18, 36, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawPlayerBody(p, sx, sy);
    ctx.globalAlpha = 1;

    // big HP bar over head
    const bw = 64, bh = 8;
    ctx.fillStyle = '#000';
    ctx.fillRect(sx - bw / 2 - 1, sy - 70, bw + 2, bh + 2);
    ctx.fillStyle = '#3a1010';
    ctx.fillRect(sx - bw / 2, sy - 69, bw, bh);
    ctx.fillStyle = p.color;
    ctx.fillRect(sx - bw / 2, sy - 69, bw * Math.max(0, p.hp / p.maxHp), bh);
    if (p.shield > 0) {
      ctx.fillStyle = 'rgba(136,170,255,0.8)';
      ctx.fillRect(sx - bw / 2, sy - 69, bw * Math.min(1, p.shield / p.maxHp), 3);
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(p.hp) + '/' + p.maxHp, sx, sy - 72);

    ctx.fillStyle = p.color;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(p.name + (p.slot === 0 ? ' 1P' : ' 2P'), sx, sy - 84);

    ctx.strokeStyle = p.ultCd <= 0 ? '#ffe566' : '#555';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const ratio = p.ultCd <= 0 ? 1 : 1 - p.ultCd / p.ultMax;
    arcSafe(sx, sy + 8, 14, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
    ctx.stroke();
  }

  // FX layers
  for (const f of run.fx) {
    const a = 1 - f.t / f.life;
    const sx = f.x - cam.x, sy = f.y - cam.y;
    const prog = f.t / f.life;
    if (f.type === 'slam' || f.type === 'ring' || f.type === 'aura' || f.type === 'poison_blast') {
      ctx.globalAlpha = a * 0.7;
      ctx.strokeStyle = f.color;
      ctx.lineWidth = f.type === 'slam' ? 6 : 3;
      ctx.beginPath();
      arcSafe(sx, sy, f.r * (0.35 + 0.65 * prog), 0, Math.PI * 2);
      ctx.stroke();
      if (f.type === 'slam' && fxFull()) {
        ctx.globalAlpha = a * 0.25;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        arcSafe(sx, sy, f.r * prog, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (f.type === 'fire' || f.type === 'fire_aura') {
      ctx.globalAlpha = a * 0.5;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      arcSafe(sx, sy, f.r * (0.5 + 0.5 * prog), 0, Math.PI * 2);
      ctx.fill();
    } else if (f.type === 'fire_cone') {
      ctx.globalAlpha = a * 0.55;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      const fa = f.ang || 0, fh = f.half || 1.2;
      arcSafe(sx, sy, f.r * (0.6 + 0.4 * prog), fa - fh, fa + fh);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = a * 0.35;
      ctx.beginPath();
      arcSafe(sx, sy, f.r * prog, 0, Math.PI * 2);
      ctx.fill();
    } else if (f.type === 'heal' || f.type === 'shield') {
      ctx.globalAlpha = a * 0.6;
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      arcSafe(sx, sy - 10, f.r * (0.4 + 0.6 * (1 - prog)), 0, Math.PI * 2);
      ctx.stroke();
    } else if (f.type === 'burst') {
      ctx.globalAlpha = a * 0.7;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      arcSafe(sx, sy, f.r * prog, 0, Math.PI * 2);
      ctx.fill();
    } else if (f.type === 'spark') {
      ctx.globalAlpha = a;
      ctx.fillStyle = f.color;
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
    } else if (f.type === 'dust') {
      ctx.globalAlpha = a * 0.5;
      ctx.fillStyle = f.color;
      for (let k = 0; k < 6; k++) {
        const ang = k * 1.047 + (f.seed || 0);
        ctx.beginPath(); arcSafe(sx + Math.cos(ang) * f.r * prog, sy + Math.sin(ang) * f.r * prog * 0.5, 8 + 10 * prog, 0, Math.PI * 2); ctx.fill();
      }
    } else if (f.type === 'bolt') {
      ctx.globalAlpha = a; ctx.strokeStyle = f.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx, sy);
      const ex = f.x2 - cam.x, ey = f.y2 - cam.y;
      for (let k = 1; k < 6; k++) ctx.lineTo(sx + (ex - sx) * k / 6 + (Math.random() - 0.5) * 16, sy + (ey - sy) * k / 6 + (Math.random() - 0.5) * 16);
      ctx.lineTo(ex, ey); ctx.stroke();
    } else if (f.type === 'icon') {
      ctx.globalAlpha = a; ctx.font = (f.r) + 'px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(f.icon, sx, sy - 30 * prog);
    }
    ctx.globalAlpha = 1;
  }

  // damage numbers
  for (const f of run.floats) {
    const a = 1 - f.t / f.life;
    const sx = f.x - cam.x, sy = f.y - cam.y;
    ctx.globalAlpha = a;
    ctx.fillStyle = f.color;
    ctx.font = f.crit ? 'bold 22px sans-serif' : 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(f.text, sx, sy);
    ctx.fillText(f.text, sx, sy);
    ctx.globalAlpha = 1;
  }

  drawOverlayUI(cam);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
