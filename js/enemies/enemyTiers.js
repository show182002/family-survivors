/** 一家倖存 · 每分鐘一階：數量／血／攻／種類 */
'use strict';

// ——— Spawning ———
// 每分鐘一階：數量 ×1.5、血／攻明顯上升
function tierOf(t) { return Math.min(4, Math.floor(t / 60)); }
function tierMul(t) { return Math.pow(1.5, tierOf(t)); }
function enemyBudget(t) {
  const frac = (t % 60) / 60;
  return Math.min(MAX_ENEMIES - 40, Math.floor(156 * tierMul(t) * (1 + 0.25 * frac))); // v0.02207：相對 02205 再 ×2（累計 ≈×6）
}
function enemyStats(t) {
  const tier = tierOf(t), frac = Math.min(1, (t - tier * 60) / 60);
  return {
    hp: 14 * Math.pow(1.75, tier) * (1 + 0.3 * frac),
    speed: 60 + tier * 9,
    damage: 6 * Math.pow(1.35, tier) * (1 + 0.1 * frac),
    xp: [1, 1, 2, 2, 3][tier],
  };
}
function pickKind(tier) {
  const r = Math.random();
  const shooters = run.enemies.filter((e) => e.type === 'shooter' && e.hp > 0).length;
  if (tier >= 1 && r < 0.12 && shooters < 8) return 'shooter';
  if (tier >= 2 && r >= 0.12 && r < 0.24) return 'charger';
  if (tier >= 2 && r >= 0.24 && r < 0.34) return 'splitter';
  if (tier >= 3 && r >= 0.34 && r < 0.48) return 'shield';
  return ['slime', 'bat', 'ghost'][Math.floor(Math.random() * 3)];
}
