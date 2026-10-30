/** 一家倖存 · 鍵盤輸入 */
'use strict';

// ——— Input ———
const keys = Object.create(null);
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  onKeyDown(e);
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
