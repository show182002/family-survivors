/**
 * PoE 風格：技能掛 TAG，互動寫喺 TAG 規則（唔做 45 對 pairwise）
 * 加技能＝加一筆 SKILLS；加互動＝加一條 TAG_RULES
 */

/** 可用 tag */
const ALL_TAGS = [
  '火焰', '燃燒', '投射', '穿透', '爆炸', '治療', '護盾',
  '護甲', '近戰', '範圍', '冰凍', '連鎖', '毒', '暴擊', '召喚',
];

/**
 * 每角色獨立 10 技能（data-driven），全部掛 TAG 參與 PoE 規則。
 * char: 屬於邊個角色（升級只抽自己池）
 * max: 最高等級；mods(p, lv): 每級疊一次被動加成
 * act: 主動技能（自動施放），game.js 通用 runner 執行：
 *   nova（自身範圍爆）、target_nova（最近敵人位置爆）、projectile、orbit、
 *   zone（地面持續區）、heal_all、shield_all、summon
 */
const SKILLS = [
  // ——— 爸爸：坦克／近戰／砸地／護盾 ———
  { id: 'dad_slam', char: 'dad', name: '家法重擊', icon: '🔨', tags: ['近戰', '範圍'], max: 5,
    desc: '砸地傷害 +15%、範圍 +8%／級', mods(p) { p.skillMods.meleeDamage *= 1.15; p.skillMods.slamRadius *= 1.08; } },
  { id: 'dad_iron', char: 'dad', name: '鐵壁光環', icon: '🛡️', tags: ['護甲', '範圍'], max: 5,
    desc: '受傷 −8%、反震 +4／級', mods(p) { p.skillMods.damageTaken *= 0.92; p.skillMods.thorns += 4; } },
  { id: 'dad_quake', char: 'dad', name: '地震踏步', icon: '🌋', tags: ['近戰', '範圍', '爆炸'], max: 5,
    desc: '每 4 秒踏地震波，大範圍傷害', act: { type: 'nova', cd: 4, dmg: 30, r: 160, color: '#c88a44', melee: true } },
  { id: 'dad_shield', char: 'dad', name: '老竇護盾', icon: '🔰', tags: ['護盾', '護甲'], max: 5,
    desc: '每 9 秒俾自己同隊友加護盾', act: { type: 'shield_all', cd: 9, amt: 22, color: '#88aaff' } },
  { id: 'dad_belly', char: 'dad', name: '啤酒肚衝撞', icon: '🍺', tags: ['近戰', '範圍'], max: 5,
    desc: '每 3 秒肚腩彈開身邊敵人（擊退）', act: { type: 'nova', cd: 3, dmg: 18, r: 95, color: '#ffd27a', knock: 160, melee: true } },
  { id: 'dad_hammer', char: 'dad', name: '迴旋鐵鎚', icon: '🪓', tags: ['近戰', '投射'], max: 5,
    desc: '鐵鎚圍住爸爸轉，每級多一個', act: { type: 'orbit', count: 1, perLv: 1, dmg: 14, r: 120, size: 22, spin: 2.6, icon: '🔨', melee: true } },
  { id: 'dad_bbq', char: 'dad', name: '燒烤鐵板', icon: '🥩', tags: ['火焰', '燃燒', '範圍'], max: 5,
    desc: '腳下留低燒紅鐵板，燒敵人', act: { type: 'zone', at: 'self', cd: 5, dur: 3, r: 90, dmg: 8, tick: 0.4, color: '#ff6a22', burn: true } },
  { id: 'dad_frost', char: 'dad', name: '冰凍啤酒', icon: '🧊', tags: ['冰凍', '範圍'], max: 5,
    desc: '每 6 秒噴冰，範圍緩速', act: { type: 'nova', cd: 6, dmg: 14, r: 170, color: '#88ddff', chill: true } },
  { id: 'dad_tough', char: 'dad', name: '硬頸', icon: '💪', tags: ['護甲'], max: 5,
    desc: '最大生命 +30、每秒回 0.8／級', mods(p) { p.skillMods.maxHpBonus += 30; p.skillMods.regen += 0.8; } },
  { id: 'dad_slipper', char: 'dad', name: '爆炸拖鞋', icon: '🩴', tags: ['爆炸', '範圍'], max: 5,
    desc: '擊殺爆炸；爆炸傷 +20%／級', mods(p) { p.skillMods.explodeOnKill = true; p.skillMods.explodeDamage *= 1.2; p.skillMods.explodeRadius *= 1.06; } },

  // ——— 媽媽：支援／治療／控場（絕不傷隊友）———
  { id: 'mom_calm', char: 'mom', name: '冷靜脈衝', icon: '💚', tags: ['治療', '護盾'], max: 5,
    desc: '治療量 +20%／級', mods(p) { p.skillMods.healPower *= 1.2; } },
  { id: 'mom_rage', char: 'mom', name: '怒火噴射', icon: '🔥', tags: ['火焰', '範圍'], max: 5,
    desc: '火焰傷 +20%、範圍 +8%／級（只傷敵）', mods(p) { p.skillMods.fireDamage *= 1.2; p.skillMods.fireRadius *= 1.08; } },
  { id: 'mom_soup', char: 'mom', name: '老火湯', icon: '🍲', tags: ['治療'], max: 5,
    desc: '每 9 秒全隊回血（唔限距離）', act: { type: 'heal_all', cd: 9, amt: 12, color: '#88ffaa' } },
  { id: 'mom_nag', char: 'mom', name: '碎碎唸', icon: '🗯️', tags: ['範圍', '冰凍'], max: 5,
    desc: '唸到敵人行唔郁：範圍緩速＋小傷', act: { type: 'nova', cd: 5, dmg: 8, r: 200, color: '#ccbbff', chill: true } },
  { id: 'mom_hanger', char: 'mom', name: '衣架鞭', icon: '🧷', tags: ['投射', '連鎖'], max: 5,
    desc: '甩衣架打最近敵人，會連鎖跳', act: { type: 'projectile', cd: 1.6, dmg: 14, speed: 460, count: 1, chain: 2, color: '#ffb3e0' } },
  { id: 'mom_bubble', char: 'mom', name: '泡泡護罩', icon: '🫧', tags: ['護盾'], max: 5,
    desc: '每 10 秒全隊泡泡護盾', act: { type: 'shield_all', cd: 10, amt: 20, color: '#aaddff' } },
  { id: 'mom_spice', char: 'mom', name: '辣椒粉', icon: '🌶️', tags: ['火焰', '燃燒'], max: 5,
    desc: '燃燒機率 +30%、燃燒傷 +6／級', mods(p) { p.skillMods.burnChance += 0.3; p.skillMods.burnDps += 6; } },
  { id: 'mom_spray', char: 'mom', name: '消毒噴霧', icon: '🧴', tags: ['毒', '範圍'], max: 5,
    desc: '喺敵群噴毒霧（只毒敵人）', act: { type: 'zone', at: 'enemy', cd: 5, dur: 3.5, r: 100, dmg: 6, tick: 0.5, color: '#88ff66', poison: true } },
  { id: 'mom_hug', char: 'mom', name: '慈母擁抱', icon: '🤗', tags: ['治療', '範圍'], max: 5,
    desc: '治療 +10%、技能範圍 +8%、吸經驗 +15%／級', mods(p) { p.skillMods.healPower *= 1.1; p.skillMods.area *= 1.08; p.skillMods.pickup *= 1.15; } },
  { id: 'mom_freezer', char: 'mom', name: '冷凍櫃', icon: '❄️', tags: ['冰凍', '爆炸'], max: 5,
    desc: '喺最近敵人位置爆冰（碎冰）', act: { type: 'target_nova', cd: 4.5, dmg: 24, r: 110, color: '#99eeff', chill: true, shatter: true } },

  // ——— 女兒：遠程／投射／召喚（可愛）———
  { id: 'dau_pierce', char: 'daughter', name: '穿透彈芯', icon: '🏹', tags: ['投射', '穿透'], max: 5,
    desc: '彈傷 +15%、穿透 +1／級', mods(p) { p.skillMods.projDamage *= 1.15; p.skillMods.pierce += 1; } },
  { id: 'dau_star', char: 'daughter', name: '星星飛鏢', icon: '⭐', tags: ['投射', '暴擊'], max: 5,
    desc: '每 1.8 秒扇形射 3 粒星星', act: { type: 'projectile', cd: 1.8, dmg: 11, speed: 520, count: 3, perLv: 0.5, spread: 0.3, color: '#ffe566' } },
  { id: 'dau_bunny', char: 'daughter', name: '兔兔召喚', icon: '🐰', tags: ['召喚', '投射'], max: 5,
    desc: '召喚兔兔砲台自動射擊 7 秒', act: { type: 'summon', cd: 9, dur: 7, dmg: 9, rate: 0.55, icon: '🐰', color: '#ffccee' } },
  { id: 'dau_candy', char: 'daughter', name: '糖果炸彈', icon: '🍬', tags: ['爆炸', '範圍'], max: 5,
    desc: '擲糖果去敵群爆炸', act: { type: 'target_nova', cd: 3.5, dmg: 26, r: 100, color: '#ff88cc', shatter: true } },
  { id: 'dau_rainbow', char: 'daughter', name: '彩虹連鎖', icon: '🌈', tags: ['投射', '連鎖'], max: 5,
    desc: '投射物連鎖 +1、彈傷 +8%／級', mods(p) { p.skillMods.chain += 1; p.skillMods.projDamage *= 1.08; } },
  { id: 'dau_frost', char: 'daughter', name: '冰晶矢', icon: '🧊', tags: ['投射', '冰凍'], max: 5,
    desc: '彈傷 +10%、緩速機率 +40%／級', mods(p) { p.skillMods.projDamage *= 1.1; p.skillMods.chillChance += 0.4; p.skillMods.chillFactor = Math.min(p.skillMods.chillFactor, 0.55); } },
  { id: 'dau_mushroom', char: 'daughter', name: '毒蘑菇', icon: '🍄', tags: ['毒'], max: 5,
    desc: '命中上毒機率 +35%、毒傷 +5／級', mods(p) { p.skillMods.poisonChance += 0.35; p.skillMods.poisonDps += 5; } },
  { id: 'dau_sparkle', char: 'daughter', name: '閃亮暴擊', icon: '✨', tags: ['暴擊'], max: 5,
    desc: '暴擊率 +6%、暴擊傷 +15%／級', mods(p) { p.skillMods.critChance += 0.06; p.skillMods.critMul += 0.15; } },
  { id: 'dau_split', char: 'daughter', name: '分裂射擊', icon: '🎯', tags: ['投射'], max: 4,
    desc: '主武器每級多 1 粒彈', mods(p) { p.skillMods.extraProjectiles += 1; } },
  { id: 'dau_cat', char: 'daughter', name: '貓貓光球', icon: '🐱', tags: ['召喚', '範圍'], max: 5,
    desc: '貓貓光球圍住你轉，撞敵人', act: { type: 'orbit', count: 1, perLv: 1, dmg: 10, r: 90, size: 18, spin: 3.4, icon: '🐱' } },
];

/** 舊 ID → 新 ID（相容舊存檔／startSkills） */
const SKILL_ALIAS = { slam_core: 'dad_slam', rage_flame: 'mom_rage', calm_pulse: 'mom_calm', pierce_bolt: 'dau_pierce' };

function getCharSkillPool(charId) { return SKILLS.filter((s) => s.char === charId); }
function skillLevel(player, id) { return (player.skills || []).filter((s) => s === id).length; }

/**
 * Tag 規則引擎（5–15 條）
 * 當玩家同時擁有 required tags，啟用 effect key
 */
const TAG_RULES = [
  {
    id: 'burn_blast',
    name: '燃爆',
    need: ['燃燒', '爆炸'],
    desc: '燃燒目標被爆炸／擊殺時額外火焰範圍傷',
    effect: { burnExplode: true, burnExplodeMul: 1.6 },
  },
  {
    id: 'poison_blast',
    name: '毒爆',
    need: ['毒', '爆炸'],
    desc: '毒目標爆炸時額外毒範圍傷',
    effect: { poisonExplode: true, poisonExplodeMul: 1.5 },
  },
  {
    id: 'pierce_shot',
    name: '貫穿射線',
    need: ['投射', '穿透'],
    desc: '投射物額外 +1 穿透、稍增彈速',
    effect: { bonusPierce: 1, projSpeedMul: 1.15 },
  },
  {
    id: 'frost_shot',
    name: '霜寒彈',
    need: ['投射', '冰凍'],
    desc: '投射命中必緩速',
    effect: { alwaysChill: true, chillFactor: 0.5 },
  },
  {
    id: 'holy_ward',
    name: '聖盾療',
    need: ['治療', '護盾'],
    desc: '治療同時給予短暫護盾',
    effect: { healGivesShield: true, shieldFromHeal: 0.5 },
  },
  {
    id: 'wide_slam',
    name: '開山砸',
    need: ['近戰', '範圍'],
    desc: '砸地／光環範圍大幅增加',
    effect: { slamAreaMul: 1.35, auraAreaMul: 1.25 },
  },
  {
    id: 'fire_aura',
    name: '炎環',
    need: ['火焰', '範圍'],
    desc: '持續火焰光環 tick（只傷敵）',
    effect: { fireAura: true, fireAuraDps: 8 },
  },
  {
    id: 'ignite',
    name: '點燃',
    need: ['火焰', '燃燒'],
    desc: '火焰技能更高機率上燃燒',
    effect: { burnChanceBonus: 0.35, burnDpsMul: 1.3 },
  },
  {
    id: 'chain_bolt',
    name: '電弧連鎖',
    need: ['投射', '連鎖'],
    desc: '投射物額外連鎖 1 次',
    effect: { bonusChain: 1 },
  },
  {
    id: 'shatter',
    name: '碎冰',
    need: ['冰凍', '爆炸'],
    desc: '對緩速中敵人爆炸傷害 +50%',
    effect: { shatterMul: 1.5 },
  },
  {
    id: 'thorn_melee',
    name: '棘甲反擊',
    need: ['護甲', '近戰'],
    desc: '被打反震＋近戰傷害提升',
    effect: { thornsMul: 2, meleeDamageMul: 1.15 },
  },
  {
    id: 'toxic_spread',
    name: '毒蔓延',
    need: ['毒', '範圍'],
    desc: '毒爆炸／範圍更大',
    effect: { poisonRadiusMul: 1.4 },
  },
  {
    id: 'pet_volley',
    name: '萌寵齊射',
    need: ['召喚', '投射'],
    desc: '召喚物射速 +40%、轉速 +30%',
    effect: { summonRateMul: 0.6, orbitSpinMul: 1.3 },
  },
  {
    id: 'fortress',
    name: '鐵桶陣',
    need: ['護盾', '護甲'],
    desc: '護盾量 +50%',
    effect: { shieldMul: 1.5 },
  },
  {
    id: 'crit_burst',
    name: '暴擊連爆',
    need: ['暴擊', '爆炸'],
    desc: '爆炸範圍 +25%',
    effect: { explodeAreaMul: 1.25 },
  },
];

function emptySkillMods() {
  return {
    meleeDamage: 1,
    slamRadius: 1,
    damageTaken: 1,
    thorns: 0,
    fireDamage: 1,
    fireRadius: 1,
    healPower: 1,
    projDamage: 1,
    pierce: 0,
    burnChance: 0,
    burnDps: 0,
    explodeOnKill: false,
    explodeRadius: 70,
    explodeDamage: 20,
    poisonChance: 0,
    poisonDps: 0,
    chillChance: 0,
    chillFactor: 0.7,
    chain: 0,
    moveSpeed: 1,
    cooldown: 1,
    area: 1,
    extraProjectiles: 0,
    maxHpBonus: 0,
    regen: 0,
    pickup: 1,
    xpGain: 1,
    critChance: 0.05,
    critMul: 1.5,
  };
}

function getOwnedTags(player) {
  const tags = new Set(player.baseTags || []);
  for (const sid of player.skills || []) {
    const sk = SKILLS.find((s) => s.id === sid);
    if (sk) sk.tags.forEach((t) => tags.add(t));
  }
  return tags;
}

/** 套用所有符合嘅 tag 規則 → 回傳合併 effect */
function resolveTagEffects(player) {
  const tags = getOwnedTags(player);
  const active = [];
  const merged = {};
  for (const rule of TAG_RULES) {
    if (rule.need.every((t) => tags.has(t))) {
      active.push(rule);
      Object.assign(merged, rule.effect);
    }
  }
  player.activeRules = active;
  player.tagEffects = merged;
  return merged;
}

/** 重建 skillMods（由技能 apply + 之後戰鬥讀 tagEffects） */
function findSkillOrPassive(id) {
  const sk = SKILLS.find((s) => s.id === id);
  if (sk) return sk;
  if (typeof PASSIVES !== 'undefined') {
    return PASSIVES.find((s) => s.id === id);
  }
  return null;
}

function rebuildPlayerPower(player) {
  player.skillMods = emptySkillMods();
  const counts = {};
  for (const sid of player.skills || []) {
    counts[sid] = (counts[sid] || 0) + 1;
  }
  for (const [sid, n] of Object.entries(counts)) {
    const sk = findSkillOrPassive(sid);
    if (!sk) continue;
    for (let i = 0; i < n; i++) {
      if (sk.mods) sk.mods(player, i + 1);
      else if (sk.apply) sk.apply(player);
    }
  }
  // sync maxHp bonus from mods once
  const base = (typeof getChar === 'function' ? getChar(player.charId) : null);
  if (base) {
    const want = base.maxHp + (player.skillMods.maxHpBonus || 0);
    if (want !== player.maxHp) {
      const diff = want - player.maxHp;
      player.maxHp = want;
      if (!player.dead && diff > 0) player.hp = Math.min(player.maxHp, player.hp + diff);
    }
  }
  resolveTagEffects(player);
}

function learnSkill(player, skillId) {
  skillId = SKILL_ALIAS[skillId] || skillId;
  if (!player.skills) player.skills = [];
  player.skills.push(skillId);
  rebuildPlayerPower(player);
}
