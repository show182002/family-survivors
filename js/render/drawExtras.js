/** 一家倖存 · 區域／召喚／敵彈／預警繪圖 */
'use strict';

// ================= 額外繪圖 =================
function drawExtras(cam) {
  for (const z of run.zones) {
    const sx = z.x - cam.x, sy = z.y - cam.y;
    const on = skillFxOn(z.skill) && fxOn();
    ctx.globalAlpha = on ? 0.28 + 0.1 * Math.sin(z.t * 10) : 0.15;
    ctx.fillStyle = z.color;
    ctx.beginPath(); arcSafe(sx, sy, z.r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.7; ctx.strokeStyle = z.color; ctx.lineWidth = 2; ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.textAlign = 'center';
  for (const s of run.summons) {
    const sx = s.x - cam.x, sy = s.y - cam.y;
    ctx.font = '34px sans-serif';
    ctx.fillText(s.icon, sx, sy + Math.sin(s.t * 8) * 3);
  }
  for (const p of run.players) {
    if (p.dead || !p._orbs) continue;
    for (const ob of p._orbs) {
      const sx = ob.x - cam.x, sy = ob.y - cam.y;
      if (skillFxOn(ob.skill) && fxOn()) {
        ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff';
        ctx.beginPath(); arcSafe(sx, sy, ob.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
      ctx.font = (ob.size * 1.4) + 'px sans-serif';
      ctx.fillText(ob.icon, sx, sy + ob.size * 0.5);
    }
  }
  drawBranchWorld(cam);
  // enemy bullets
  for (const b of run.ebul) {
    const sx = b.x - cam.x, sy = b.y - cam.y;
    const rr = b.r || 9;
    ctx.fillStyle = b.color || '#ff2266'; ctx.beginPath(); arcSafe(sx, sy, rr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); arcSafe(sx, sy, rr * 0.4, 0, Math.PI * 2); ctx.fill();
  }
  // boss telegraphs
  for (const e of run.enemies) {
    if (!e.boss) continue;
    const sx = e.x - cam.x, sy = e.y - cam.y;
    // final boss：空中階段地面砸落圓影
    if (e.boss === 'boss' && (e.bossPhase === 'air' || e.bossPhase === 'fall')) {
      const R = e.slamR || 280;
      const k = e.bossPhase === 'fall' ? 1 : (e.teleK || (1 - Math.max(0, e.phaseT || 0) / 1.35));
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.45 * k;
      ctx.fillStyle = '#4a0066';
      ctx.beginPath(); ctx.ellipse(sx, sy, R * (0.55 + 0.45 * k), R * (0.28 + 0.22 * k), 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin((e.phaseT || 0) * 20);
      ctx.strokeStyle = '#ff44cc'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.ellipse(sx, sy, R * k, R * 0.45 * k, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(sx, sy, R * k * 0.7, R * 0.32 * k, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ff66dd'; ctx.font = 'bold 42px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('▼', sx, sy - R * 0.2 * k);
      ctx.restore();
      continue;
    }
    if (!(e.windup > 0)) continue;
    const k = 1 - e.windup / 0.9;
    ctx.strokeStyle = '#ff3355'; ctx.lineWidth = 4;
    if (e.boss === 'boss' && e.bossPhase === 'rise') {
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); arcSafe(sx, sy - 30 - (e.jumpY || 0), 50 + k * 80, 0, Math.PI * 2); ctx.stroke();
    } else if (e.dashTo) {
      ctx.globalAlpha = 0.35 + 0.3 * k; ctx.fillStyle = '#ff3355';
      ctx.save(); ctx.translate(sx, sy);
      const ang = Math.atan2(e.dashTo.y - e.y, e.dashTo.x - e.x);
      ctx.rotate(ang); ctx.fillRect(0, -e.r, 420 * k, e.r * 2); ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  // warnings（世界座標）
  for (const w of run.warns) {
    const k = w.t / w.delay;
    const blink = Math.floor(w.t * 8) % 2 === 0;
    ctx.strokeStyle = '#ff3333'; ctx.fillStyle = '#ff3333';
    if (w.kind === 'ring') {
      ctx.globalAlpha = 0.85; ctx.lineWidth = 6; ctx.setLineDash([24, 16]);
      ctx.beginPath(); arcSafe(w.data.x - cam.x, w.data.y - cam.y, w.data.r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.5; ctx.lineWidth = 3;
      ctx.beginPath(); arcSafe(w.data.x - cam.x, w.data.y - cam.y, w.data.r * (1 - 0.3 * k), 0, Math.PI * 2); ctx.stroke();
    } else if (w.kind === 'line') {
      const d = w.data;
      ctx.globalAlpha = blink ? 0.3 : 0.18;
      if (d.horiz) ctx.fillRect(0, d.c - cam.y - d.w / 2, STAGE_W, d.w);
      else ctx.fillRect(d.c - cam.x - d.w / 2, 0, d.w, STAGE_H);
      ctx.globalAlpha = 0.9; ctx.font = 'bold 48px sans-serif'; ctx.fillStyle = '#fff';
      const arrow = d.horiz ? (d.dir > 0 ? '▶▶▶' : '◀◀◀') : (d.dir > 0 ? '▼' : '▲');
      for (let i = 0; i < 4; i++) {
        if (d.horiz) ctx.fillText(arrow, 240 + i * 480, d.c - cam.y + 16);
        else ctx.fillText(arrow, d.c - cam.x, 160 + i * 260);
      }
    } else if (w.kind === 'ambush') {
      for (const s of w.data.spots) {
        const R = w.data.big ? 90 : 34;
        ctx.globalAlpha = blink ? 0.9 : 0.5; ctx.lineWidth = 4;
        ctx.beginPath(); arcSafe(s.x - cam.x, s.y - cam.y, R * (0.6 + 0.4 * k), 0, Math.PI * 2); ctx.stroke();
        ctx.font = 'bold ' + (w.data.big ? 64 : 30) + 'px sans-serif'; ctx.fillText('!', s.x - cam.x, s.y - cam.y + 10);
      }
    } else if (w.kind === 'spiral') {
      ctx.globalAlpha = 0.6; ctx.lineWidth = 4; ctx.beginPath();
      for (let i = 0; i < 60; i++) {
        const a = i * 0.42, r = 620 - i * 4;
        const x = w.data.x - cam.x + Math.cos(a + w.t) * r, y = w.data.y - cam.y + Math.sin(a + w.t) * r;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function drawOverlayUI(cam) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // corner warnings（螢幕座標）
  for (const w of run.warns) {
    if (w.kind !== 'corner') continue;
    const blink = Math.floor(w.t * 8) % 2 === 0;
    const x = w.data.cx ? STAGE_W : 0, y = w.data.cy ? STAGE_H : 0;
    ctx.globalAlpha = blink ? 0.55 : 0.25; ctx.fillStyle = '#ff3333';
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + (w.data.cx ? -420 : 420), y); ctx.lineTo(x, y + (w.data.cy ? -420 : 420)); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.font = 'bold 72px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('!', x + (w.data.cx ? -110 : 110), y + (w.data.cy ? -70 : 130));
  }
  // boss hp bars
  const bosses = run.enemies.filter((e) => e.boss && e.hp > 0);
  bosses.forEach((b, i) => {
    const w = 900, x = (STAGE_W - w) / 2, y = 120 + i * 40;
    ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y - 3, w + 6, 24);
    ctx.fillStyle = b.boss === 'boss' ? '#c040ff' : '#ff9030';
    ctx.fillRect(x, y, w * (b.hp / b.maxHp), 18);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(b.boss === 'boss' ? '☠ 最終大魔王' : '中 Boss', STAGE_W / 2, y + 15);
  });
  if (run.banner) {
    const b = run.banner;
    const a = Math.min(1, (b.life - b.t) * 2, b.t * 6);
    ctx.globalAlpha = Math.max(0, a);
    ctx.font = 'bold 56px sans-serif'; ctx.textAlign = 'center';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 8;
    ctx.strokeText(b.text, STAGE_W / 2, 260); ctx.fillStyle = b.color; ctx.fillText(b.text, STAGE_W / 2, 260);
    ctx.globalAlpha = 1;
  }
}
