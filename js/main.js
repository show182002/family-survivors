/** 一家倖存 · 啟動（最後載入） */
'use strict';

(function bindStartButton() {
  const btn = el.btnStart;
  if (!btn) return;
  let locked = false;
  const fire = (e) => {
    if (btn.disabled || locked) return;
    locked = true;
    try { if (e && e.preventDefault) e.preventDefault(); } catch (_) {}
    try { if (e && e.stopPropagation) e.stopPropagation(); } catch (_) {}
    try { startRun(); } finally {
      setTimeout(() => { locked = false; }, 320);
    }
  };
  btn.addEventListener('click', fire);
  btn.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') return;
    fire(e);
  });
  btn.addEventListener('touchend', fire, { passive: false });
})();
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
