/** v0.02202 轉職分支樹（Lv5／10／15 里程碑）— 數值喺 game.js 嘅 updateBranches */
const GAME_VERSION = 'v0.02208';
const BRANCH_LEVELS = [5, 10, 15];

/**
 * opts(p) 回傳嗰一階可揀嘅選項；req＝需要之前揀咗邊個
 * 每個選項都會帶一招新招（move），全部有 FX，會跟該分支嘅「✨」開關
 */
const BRANCHES = [
  // ——— 女兒：坐騎線 ———
  { id: '1.1', char: 'daughter', tier: 0, icon: '🐎', name: '1.1 馬', move: '馬蹄踐踏',
    desc: '騎馬！移動速度 +60%。新招「馬蹄踐踏」：每 2.5 秒踏地震開身邊敵人' },
  { id: '1.2', char: 'daughter', tier: 0, icon: '🐉', name: '1.2 飛龍', move: '龍息',
    desc: '騎飛龍！移速 +35%、全部攻擊 +35%。新招「龍息」：每 2.2 秒向最近敵人噴火錐' },
  { id: '1.11', char: 'daughter', tier: 1, icon: '🐴', name: '1.11 召喚坐騎仔', move: '召喚',
    desc: '每 7 秒召喚 2 隻小馬／小龍（跟你坐騎款）幫手打 9 秒' },
  { id: '1.12', char: 'daughter', tier: 1, icon: '💥', name: '1.12 坐騎大招', move: '強化',
    desc: '馬蹄踐踏／龍息範圍 ×2.2、傷害 +30%' },
  { id: '1.21', char: 'daughter', tier: 2, icon: '🦣', name: '1.21 巨大化', move: '巨獸輾壓',
    desc: '坐騎變巨大：行過嘅敵人持續受傷＋撞飛；但體型大，受傷 +15%' },
  { id: '1.22', char: 'daughter', tier: 2, icon: '🌈', name: '1.22 彩虹遊行', move: '彩虹路',
    desc: '行過留低彩虹路燒敵人，3 隻坐騎仔排隊跟住你撞怪' },

  // ——— 爸爸：H／Num0 大招會變 ———
  { id: '2.1', char: 'dad', tier: 0, icon: '🤸', name: '2.1 膊頭馬', move: '托人／擲人',
    desc: '大招改做：近隊友撳一下＝托上膊頭（你行、佢攻擊 ×2）；再撳＝擲出去變波亂撞 3 秒。CD 10 秒。一個人玩就托公仔🧸' },
  { id: '2.2', char: 'dad', tier: 0, icon: '🏕️', name: '2.2 起陣地', move: '擺陣地',
    desc: '大招改做：擺陣地（燒烤爐炮台🔥→帳篷牆⛺→膠櫈陷阱🪑輪住嚟）。CD 4 秒，同場最多 3 個，第 4 個會拆最舊' },
  { id: '2.11', char: 'dad', tier: 1, req: '2.1', icon: '💣', name: '2.11 擲人', move: '落地爆',
    desc: '擲出去嘅人每次撞邊反彈都爆一圈 AOE' },
  { id: '2.12', char: 'dad', tier: 1, req: '2.1', icon: '🦾', name: '2.12 鐵人', move: '反彈',
    desc: '托住人時受傷 −50%，仲會將身邊敵彈反彈返去' },
  { id: '2.13', char: 'dad', tier: 1, req: '2.2', icon: '🍢', name: '2.13 燒烤大排檔', move: '加檔',
    desc: '陣地上限 3→5，炮台傷害 +60%、射速更快' },
  { id: '2.14', char: 'dad', tier: 1, req: '2.2', icon: '⚡', name: '2.14 連線電網', move: '電網',
    desc: '陣地之間連住電線，敵人行過會觸電＋減速' },
  { id: '2.21', char: 'dad', tier: 2, req: '2.1', icon: '🗼', name: '2.21 雙人塔', move: '巨人踩',
    desc: '托住人時兩個變一隻巨人：每秒大範圍 AOE，但行慢 30%' },
  { id: '2.22', char: 'dad', tier: 2, req: '2.2', icon: '🏰', name: '2.22 家庭堡壘', move: '堡壘',
    desc: '每個陣地有防護罩：隊友喺入面每秒回血，敵人入嚟減速 50%' },

  // 媽媽：今次唔轉職（之後版本再加）
];

function getBranch(id) { return BRANCHES.find((b) => b.id === id); }
/** 某玩家喺第 tier 階可揀嘅選項 */
function branchOptions(player, tier) {
  const have = Object.values(player.branch || {});
  return BRANCHES.filter((b) => b.char === player.charId && b.tier === tier && (!b.req || have.includes(b.req)));
}
