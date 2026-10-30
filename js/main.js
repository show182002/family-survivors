/** 一家倖存 · 啟動（最後載入） */
'use strict';

el.btnStart.addEventListener('click', startRun);
el.btnResume.addEventListener('click', resumeGame);
el.btnQuit.addEventListener('click', backToSelect);
el.btnAgain.addEventListener('click', () => { backToSelect(); startRun(); });
el.btnToSelect.addEventListener('click', backToSelect);
buildSelectCards();
fitCanvas();

function bindUltButton(btn, slot) {
  if (!btn) return;
  const fire = (e) => {
    e.preventDefault();
    e.stopPropagation();
    tryUlt(slot);
    btn.blur();
  };
  btn.addEventListener('pointerdown', fire);
  btn.addEventListener('click', (e) => { e.preventDefault(); });
}
bindUltButton(el.btnUltP1, 0);
bindUltButton(el.btnUltP2, 1);
