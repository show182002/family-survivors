# 一家倖存 · Family Survivors（PoE TAG 版）　**v0.02212**

Vampire Survivors 風格割草 + **PoE 風格 TAG 互動**（唔做 45 對 pairwise）。

舞台 **1920×817（2.35:1 ultrawide）**。用瀏覽器打開 `index.html` 即玩。

## 今版主打
籠隊友＝塔防：×10 血、微回血、籠內可射；爸爸／女兒技能可互動守塔。

## v0.02212 更新（今次）
- **籠塔**：困住時血 ×10（唔再 1/10）、約 1.5%/秒微回血；打爆籠後先變脆弱 AI（1/10）
- **籠內可射**：當塔自動普攻；唔郁／唔大招；敵人可打塔
- **爸爸起陣地**：電網可接籠；家庭堡壘對塔多回血；BBQ／帳篷近 → 塔射速＋
- **爸爸膊頭馬**：唔托籠內人（提示打爆籠）；擲波傷籠
- **女兒坐騎**：彩虹軌近籠 bonus；分身優先打籠邊怪；AoE／龍息傷籠鎖
- **媽媽**：治療照樣可補籠塔

## v0.02211 更新
- **女兒**：縮小（draw scale ≈2.2）＋重畫可愛女仔（圓臉大眼雙馬尾）
- **媽媽**：加大（scale ≈3.4）＋新建 `mom.js` 圍裙主婦 chibi；選角卡同戰鬥一致
- **1 分鐘籠隊友**：未選角色（例如已選爸＋女 → 出媽媽）困籠；打爆籠後 AI 隊友（血 1/10、追怪＋簡單走位／大招）
- **媽媽轉職**：3.1 暖湯局／3.2 紅龍怒 → 3.11–3.14 → 3.21 神仙湯／3.22 廚房結界／3.23 巨龍化／3.24 雙龍陣
- **選技 highlight**：粗金邊＋光暈＋放大，預設第一張 focused（手機都清楚）

## v0.02210 更新
- **雙人限距＝設計畫布一屏**：`STAGE_W×STAGE_H`（≈1848×745），**唔跟 zoom**

## 操作
- 1P：WASD／搖桿移動，H／招掣大招
- 2P：方向鍵／搖桿，Num0／招掣
- Esc 暫停；「全」全螢幕；「1／1½／2／3」倍率；「音／靜」靜音

## 結構
```
js/core/     config · audio · cageAlly · player · loop · …
js/characters/  dad · mom · daughter · spriteUtil
js/branches/    branchCore · dad · mom · daughter
js/enemies/  …
js/combat/   combat · weapons
```

玩：https://show182002.github.io/family-survivors/
