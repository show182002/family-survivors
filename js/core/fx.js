/** 一家倖存 · 特效、傷害數字、震屏 */
'use strict';

function addFx(x, y, type, r, color, extra) {
  if (extra && extra.skill && !skillFxOn(extra.skill)) return;
  if (!fxOn() && type !== 'slam' && type !== 'fire') return;
  if (!fxFull() && (type === 'spark' || type === 'particle')) return;
  run.fx.push(Object.assign({ x, y, type, r: r || 40, color: color || '#fff', t: 0, life: 0.45 }, extra || {}));
}

function addFloat(x, y, text, color, crit) {
  if (!fxOn()) return;
  if (!fxFull() && !crit) return; // simple: only crit numbers
  run.floats.push({
    x: x + (Math.random() - 0.5) * 20,
    y: y - 30,
    text,
    color: color || '#fff',
    crit: !!crit,
    t: 0,
    life: crit ? 0.9 : 0.6,
  });
}

function shake(amt) {
  if (!fxFull()) return;
  screenShake = Math.max(screenShake, amt);
}
