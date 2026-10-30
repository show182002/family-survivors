# 一家倖存 · Family Survivors（PoE TAG 版）　**v0.02207**

Vampire Survivors 風格割草 + **PoE 風格 TAG 互動**（唔做 45 對 pairwise）。

舞台 **1920×817（2.35:1 ultrawide）**。用瀏覽器打開 `index.html` 即玩。

## 今版主打
**爸爸＋女兒**（媽媽仍可選，但今版唔擴充媽媽轉職設計）。

## v0.02207 更新（今次）
- **畫面 2.35:1**：舞台 1920×817＋CSS contain，左右睇多啲（唔再跟 Safari 網址列硬鬥）。
- **小怪再 ×2**（相對 v0.02205）：預算／間隔／花樣數量再倍；上限約 1000；移速混 ⅓×0.5／⅓×0.75／⅓×1 照舊。
- **自製音**：Web Audio 程序 BGM＋SE（hit／kill／xp／level／ult）；首次觸控解鎖；HUD「音／靜」＋本機記住。

## v0.02206 更新
- 「全」掣：Fullscreen API（`navigationUI: 'hide'`）＋ webkit；同步發起以保住 iOS Safari user gesture
- 失敗 fallback；桌面 **F** 切換全螢幕

## v0.02205 更新
- 大招割草 ×3 傷／誇張 FX；小怪 ×3；多中 Boss＋最終大魔王；畫面倍率 touch→×3／鍵鼠→×1

## 操作
- 1P：WASD／搖桿移動，H／招掣大招
- 2P：方向鍵／搖桿，Num0／招掣
- Esc 暫停；「全」全螢幕；「1／1½／2／3」倍率；「音／靜」靜音

## 結構
```
js/core/     config · audio · dom · input · mobile · player · loop · …
js/enemies/  enemyTiers · enemies · spawnPatterns · enemyAI
js/combat/   combat · weapons
js/branches/ branchCore · dad · daughter
js/render/   draw · drawExtras · branchDraw
js/ui/       menus · hud · pause
```

正式連結：https://show182002.github.io/family-survivors/
