/**
 * 升級＝抽技能卡（帶 TAG）
 * 共享經驗；每級每人 3 點，1P／2P 分開揀
 * 實際技能同 tag 規則喺 skills.js
 */

/** 額外通用被動（唔佔主要 tag，補足生存） */
const PASSIVES = [
  {
    id: 'boots',
    name: '疾風靴',
    icon: '👟',
    tags: [],
    desc: '移動速度 +12%',
    max: 5,
    prefer: [],
    apply(p) { p.skillMods.moveSpeed *= 1.12; },
  },
  {
    id: 'haste',
    name: '急速',
    icon: '⚡',
    tags: [],
    desc: '攻擊冷卻 −10%',
    max: 5,
    prefer: [],
    apply(p) { p.skillMods.cooldown *= 0.9; },
  },
  {
    id: 'vitality',
    name: '活力',
    icon: '❤️',
    tags: [],
    desc: '最大生命 +30，即時回 30',
    max: 5,
    prefer: [],
    apply(p) {
      p.skillMods.maxHpBonus += 30;
    },
  },
  {
    id: 'magnet',
    name: '真空磁鐵',
    icon: '🧲',
    tags: [],
    desc: '經驗吸取範圍 +35%',
    max: 5,
    prefer: [],
    apply(p) { p.skillMods.pickup *= 1.35; },
  },
];

/** 只抽該角色自己 10 技能池；全部滿級先用通用被動做後備 */
function getUpgradePool(charId) {
  const own = getCharSkillPool(charId);
  return own;
}

function poolNotMaxed(player) {
  const own = getCharSkillPool(player.charId).filter((s) => skillLevel(player, s.id) < (s.max || 5));
  if (own.length) return own;
  return PASSIVES.filter((s) => skillLevel(player, s.id) < (s.max || 5));
}

/** 自動升級：跟玩家設定嘅技能次序，揀第一個未滿級 */
function autoPickForPlayer(player) {
  const avail = poolNotMaxed(player);
  const order = player.order || [];
  for (const id of order) {
    const s = avail.find((x) => x.id === id);
    if (s) return s;
  }
  return avail[0] || null;
}

function pickUpgradeChoicesForPlayer(player, count = 3) {
  const pool = poolNotMaxed(player);
  const have = getOwnedTags(player);
  const scored = pool.map((s) => {
    let w = 1 + Math.random();
    if (skillLevel(player, s.id) > 0) w += 0.4;
    for (const rule of TAG_RULES) {
      const missing = rule.need.filter((t) => !have.has(t));
      if (missing.length === 1 && (s.tags || []).includes(missing[0])) w += 0.9;
    }
    return { s, w };
  });
  scored.sort((a, b) => b.w - a.w);
  return scored.slice(0, Math.min(count, scored.length)).map((x) => x.s);
}
