/** v0.02227 轉職分支樹（Lv5／10／15）— 含媽媽／阿公 */
const GAME_VERSION = 'v0.02227';
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

  // ——— 媽媽：暖湯／紅龍 ———
  { id: '3.1', char: 'mom', tier: 0, icon: '🍲', name: '3.1 暖湯局', move: '煲湯',
    desc: '走暖湯線：冷靜脈衝冷卻 −25%、治療 +40%。新招「煲湯」：每 3 秒為身邊隊友補一啖湯' },
  { id: '3.2', char: 'mom', tier: 0, icon: '🐲', name: '3.2 紅龍怒', move: '龍焰',
    desc: '走紅龍線：怒火範圍＋傷 +40%。新招「龍焰」：每 2.4 秒向近敵噴火錐（唔傷隊友）' },
  { id: '3.11', char: 'mom', tier: 1, req: '3.1', icon: '🍱', name: '3.11 全家飯桌', move: '開飯',
    desc: '每 6 秒全隊大補一輪，短暫移速 +20%' },
  { id: '3.12', char: 'mom', tier: 1, req: '3.1', icon: '💊', name: '3.12 補品快遞', move: '補品',
    desc: '每 4 秒派出補品波追隊友，接到回血＋護盾' },
  { id: '3.13', char: 'mom', tier: 1, req: '3.2', icon: '📢', name: '3.13 連環吼', move: '連吼',
    desc: '怒火變三連吼：短時間內爆三次範圍傷' },
  { id: '3.14', char: 'mom', tier: 1, req: '3.2', icon: '🧷', name: '3.14 衣架風暴', move: '衣架雨',
    desc: '每 2.8 秒向四周甩 8 支衣架彈（連鎖）' },
  { id: '3.21', char: 'mom', tier: 2, req: '3.1', icon: '✨', name: '3.21 神仙湯', move: '仙湯',
    desc: '煲湯升級：大範圍治療＋短暫無敵；大招改仙湯爆發' },
  { id: '3.22', char: 'mom', tier: 2, req: '3.1', icon: '🛡️', name: '3.22 廚房結界', move: '結界',
    desc: '身邊常駐廚房結界：入面隊友回血，敵人減速＋輕傷' },
  { id: '3.23', char: 'mom', tier: 2, req: '3.2', icon: '🔥', name: '3.23 巨龍化', move: '巨龍',
    desc: '變身巨龍感：體型＋火環常駐，怒火傷再 +50%，受傷 −15%' },
  { id: '3.24', char: 'mom', tier: 2, req: '3.2', icon: '🐉', name: '3.24 雙龍陣', move: '雙龍',
    desc: '龍焰變雙向噴射；大招改雙龍息大範圍（唔傷隊友）' },

  // ——— 阿公：象棋局／太極氣 ———
  { id: '4.1', char: 'grandpa', tier: 0, icon: '♟️', name: '4.1 象棋局', move: '砲擊',
    desc: '走象棋線：週期向近敵開砲，減速敵軍。新招「砲擊」：每 2.2 秒射一枚象棋砲' },
  { id: '4.2', char: 'grandpa', tier: 0, icon: '☯️', name: '4.2 太極氣', move: '氣波',
    desc: '走太極線：受傷 −25%。新招「氣波」：每 2.5 秒放出柔化氣波推開＋輕傷' },
  { id: '4.11', char: 'grandpa', tier: 1, req: '4.1', icon: '💣', name: '4.11 連環砲', move: '連砲',
    desc: '砲擊變三連砲，傷害＋範圍加大' },
  { id: '4.12', char: 'grandpa', tier: 1, req: '4.1', icon: '♟', name: '4.12 過河卒', move: '卒仔',
    desc: '每 6 秒派出 3 隻過河卒自動衝鋒攻擊 8 秒' },
  { id: '4.13', char: 'grandpa', tier: 1, req: '4.2', icon: '🛡️', name: '4.13 氣場罩', move: '氣罩',
    desc: '身邊常駐氣場：隊友入面微回血＋護盾，敵人減速' },
  { id: '4.14', char: 'grandpa', tier: 1, req: '4.2', icon: '👐', name: '4.14 推手震', move: '推手',
    desc: '每 2.8 秒大推手：強擊退＋暈眩短時' },
  { id: '4.21', char: 'grandpa', tier: 2, req: '4.1', icon: '♔', name: '4.21 殘局殺', move: '殘局',
    desc: '近敵血低於 30% 直接收割；大招改殘局殺：超大範圍斬殺＋壓制' },
  { id: '4.22', char: 'grandpa', tier: 2, req: '4.1', icon: '♜', name: '4.22 雙車錯', move: '雙車',
    desc: '週期放出左右雙車橫掃；大招改雙車錯亂撞全場' },
  { id: '4.23', char: 'grandpa', tier: 2, req: '4.2', icon: '🌀', name: '4.23 太極化境', move: '化境',
    desc: '受傷再 −20%（累計更硬）、氣波更快更大；大招改太極化境護體＋爆發' },
  { id: '4.24', char: 'grandpa', tier: 2, req: '4.2', icon: '🪞', name: '4.24 以柔克剛', move: '反震',
    desc: '受傷時反震敵人；大招改以柔克剛：全隊護盾＋大範圍反震波' },
];

function getBranch(id) { return BRANCHES.find((b) => b.id === id); }
/** 某玩家喺第 tier 階可揀嘅選項 */
function branchOptions(player, tier) {
  const have = Object.values(player.branch || {});
  return BRANCHES.filter((b) => b.char === player.charId && b.tier === tier && (!b.req || have.includes(b.req)));
}
