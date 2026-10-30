/** 一家倖存 · 轉職＋新敵人繪圖 */
'use strict';

// ——— 繪圖 ———
function drawEnemyMark(e, sx, sy) {
  if (e.type === 'shield') {
    ctx.strokeStyle = '#99bbff'; ctx.lineWidth = 6; ctx.globalAlpha = 0.9;
    ctx.beginPath(); arcSafe(sx, sy - 20, e.r + 12, e.face - 1.05, e.face + 1.05); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (e.type === 'shooter') {
    ctx.fillStyle = e.tShoot < 0.6 ? '#ffdd33' : '#ffa31a';
    ctx.beginPath(); arcSafe(sx, sy - 44, e.tShoot < 0.6 ? 9 : 6, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'charger') {
    if (e.wind > 0) {
      ctx.globalAlpha = 0.35; ctx.fillStyle = '#ff3355';
      ctx.save(); ctx.translate(sx, sy - 10); ctx.rotate(Math.atan2(e.dvy, e.dvx));
      ctx.fillRect(0, -e.r, 340, e.r * 2); ctx.restore(); ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#ff5544'; ctx.fillRect(sx - 8, sy - 44, 16, 5);
  } else if (e.type === 'splitter') {
    ctx.strokeStyle = '#88ff66'; ctx.lineWidth = 2;
    ctx.beginPath(); arcSafe(sx, sy - 18, e.r + 4, 0, Math.PI * 2); ctx.stroke();
  } else if (e.type === 'elite' || e.type === 'brute') {
    ctx.strokeStyle = '#ffcc33'; ctx.lineWidth = 3;
    ctx.beginPath(); arcSafe(sx, sy - 24, e.r + 8, 0, Math.PI * 2); ctx.stroke();
  }
  if (e.stun > 0) { ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💫', sx, sy - 52); }
  if (e.mark > 0) { ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🎯', sx + 18, sy - 48); }
}
function drawArtPlayer(p, sx, sy, scaleMul) {
  if (!p.art) p.art = { dir: 'down', flipX: false, walkT: 0, moving: false };
  // sync flip from facing when idle side view missing
  const scale = 3 * (scaleMul || 1);
  if (window.ArtChars) {
    if (p.charId === 'daughter' && ArtChars.drawDaughter) {
      ArtChars.drawDaughter(ctx, sx, sy, p.art, scale);
      return true;
    }
    if (p.charId === 'dad' && ArtChars.drawDad) {
      ArtChars.drawDad(ctx, sx, sy, p.art, scale);
      return true;
    }
  }
  return false;
}
function drawPlayerBody(p, sx, sy) {
  const giant = hasB(p, '1.21');
  if (p.mount) {
    const sz = giant ? 120 : 64;
    ctx.font = sz + 'px sans-serif'; ctx.textAlign = 'center';
    ctx.save(); ctx.translate(sx, sy + sz * 0.15); if (p.facing > 0) ctx.scale(-1, 1);
    ctx.fillText(p.mount === 'horse' ? '🐎' : '🐉', 0, 0); ctx.restore();
    if (!drawArtPlayer(p, sx, sy - sz * 0.45, giant ? 1.25 : 0.9)) {
      drawSprite(ctx, p.sprite, sx, sy - sz * 0.45, SPRITE_SCALE * (giant ? 1.4 : 1), p.facing < 0);
    }
    return;
  }
  if (p.ball) {
    const t = run.time * 20;
    ctx.fillStyle = p.color; ctx.globalAlpha = 0.5;
    ctx.beginPath(); arcSafe(sx, sy - 20, 34, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(sx, sy - 20); ctx.rotate(t);
    if (!drawArtPlayer(p, 0, 24, 0.75)) {
      drawSprite(ctx, p.sprite, 0, 24, SPRITE_SCALE * 0.8, false);
    }
    ctx.restore();
    return;
  }
  const tower = p.carry && hasB(p, '2.21');
  if (!drawArtPlayer(p, sx, sy, tower ? 1.35 : 1)) {
    drawSprite(ctx, p.sprite, sx, sy, SPRITE_SCALE * (tower ? 1.6 : 1), p.facing < 0);
  }
  if (p.carry && p.carry.doll) { ctx.font = '40px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🧸', sx, sy - (tower ? 110 : 66)); }
}
function drawBranchWorld(cam) {
  ctx.textAlign = 'center';
  // 彩虹路
  for (const t of run.trails) {
    const a = 1 - t.t / t.life;
    ctx.globalAlpha = skillFxOn('br1.22') && fxOn() ? 0.55 * a : 0.2 * a;
    ctx.fillStyle = 'hsl(' + t.hue + ',95%,60%)';
    ctx.beginPath(); arcSafe(t.x - cam.x, t.y - cam.y, 24, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // 堡壘罩
  for (const s of run.structs) {
    const p = run.players[s.owner];
    const sx = s.x - cam.x, sy = s.y - cam.y;
    if (p && hasB(p, '2.22')) {
      ctx.globalAlpha = 0.14; ctx.fillStyle = '#66ddff';
      ctx.beginPath(); arcSafe(sx, sy, 170, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.5; ctx.strokeStyle = '#66ddff'; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (s.kind === 'stool') { ctx.globalAlpha = 0.18; ctx.fillStyle = '#ffcc66'; ctx.beginPath(); arcSafe(sx, sy, 70, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  }
  // 電網（v0.02100：電線加粗＋外層光暈）
  for (const seg of netSegments()) {
    const ax = seg.a.x - cam.x, ay = seg.a.y - cam.y - 20, bx = seg.b.x - cam.x, by = seg.b.y - cam.y - 20;
    const jag = skillFxOn('br2.14') && fxOn();
    const pulse = 0.75 + 0.25 * Math.sin((run.time || 0) * 10);
    const pts = [[ax, ay]];
    for (let k = 1; k < 8; k++) {
      pts.push([
        ax + (bx - ax) * k / 8 + (jag ? (Math.random() - 0.5) * 16 : 0),
        ay + (by - ay) * k / 8 + (jag ? (Math.random() - 0.5) * 16 : 0)
      ]);
    }
    pts.push([bx, by]);
    function strokeNet(width, color, alpha) {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
    strokeNet(28, '#44ccff', 0.22 * pulse);   // soft outer glow
    strokeNet(18, '#88eeff', 0.45 * pulse);   // mid glow
    strokeNet(12, '#ddffff', 0.95);           // thick core cable
    strokeNet(4, '#ffffff', 0.85);            // hot center
    ctx.globalAlpha = 1; ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  }
  for (const s of run.structs) {
    const sx = s.x - cam.x, sy = s.y - cam.y;
    ctx.font = '52px sans-serif'; ctx.fillText(s.icon, sx, sy);
    if (s.kind === 'tent' && s.hp < s.maxHp) {
      ctx.fillStyle = '#000'; ctx.fillRect(sx - 24, sy + 6, 48, 5);
      ctx.fillStyle = '#ffcc66'; ctx.fillRect(sx - 24, sy + 6, 48 * s.hp / s.maxHp, 5);
    }
  }
  // 坐騎仔
  for (const m of run.minis) {
    ctx.font = (m.line ? 36 : 40) + 'px sans-serif';
    ctx.fillText(m.horse ? '🐴' : '🐲', m.x - cam.x, m.y - cam.y + Math.sin(m.t * 10) * 3);
  }
  // 公仔（擲緊／跑返）
  for (const b of run.balls) {
    if (b.who) continue;
    ctx.font = '42px sans-serif';
    ctx.fillText('🧸', b.x - cam.x, b.y - cam.y);
  }
}
