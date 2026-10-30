/** 一家倖存 · DOM 參考、畫布縮放、特效掣 */
'use strict';

// ——— DOM ———
const el = {
  select: document.getElementById('screen-select'),
  game: document.getElementById('screen-game'),
  canvas: document.getElementById('game'),
  cardsP1: document.getElementById('cards-p1'),
  cardsP2: document.getElementById('cards-p2'),
  readyP1: document.getElementById('ready-p1'),
  readyP2: document.getElementById('ready-p2'),
  btnStart: document.getElementById('btn-start'),
  timer: document.getElementById('timer'),
  kills: document.getElementById('kill-count'),
  xpBar: document.getElementById('xp-bar'),
  levelLabel: document.getElementById('level-label'),
  hpP1: document.getElementById('hp-p1'),
  hpP2: document.getElementById('hp-p2'),
  levelup: document.getElementById('overlay-levelup'),
  levelupTitle: document.getElementById('levelup-title'),
  levelupSub: document.getElementById('levelup-sub'),
  upgrades: document.getElementById('upgrade-choices'),
  activeTags: document.getElementById('active-tags'),
  pause: document.getElementById('overlay-pause'),
  end: document.getElementById('overlay-end'),
  endTitle: document.getElementById('end-title'),
  endStats: document.getElementById('end-stats'),
  btnResume: document.getElementById('btn-resume'),
  btnQuit: document.getElementById('btn-quit'),
  btnAgain: document.getElementById('btn-again'),
  btnToSelect: document.getElementById('btn-to-select'),
  fxBtns: document.querySelectorAll('[data-fx]'),
  hudFx: document.getElementById('hud-fx'),
  btnUltP1: document.getElementById('btn-ult-p1'),
  btnUltP2: document.getElementById('btn-ult-p2'),
};

const ctx = el.canvas.getContext('2d');
el.canvas.width = STAGE_W;
el.canvas.height = STAGE_H;

function fitCanvas() {
  const wrap = el.game;
  const aw = window.innerWidth;
  const ah = window.innerHeight;
  const scale = Math.min(aw / STAGE_W, ah / STAGE_H);
  el.canvas.style.width = Math.floor(STAGE_W * scale) + 'px';
  el.canvas.style.height = Math.floor(STAGE_H * scale) + 'px';
  el.canvas.style.margin = '0 auto';
  el.canvas.style.display = 'block';
  wrap.style.display = 'flex';
  wrap.style.alignItems = 'center';
  wrap.style.justifyContent = 'center';
  wrap.style.background = '#000';
}
window.addEventListener('resize', fitCanvas);

function refreshFxButtons() {
  el.fxBtns.forEach((b) => {
    b.classList.toggle('on', b.dataset.fx === fxMode);
  });
  if (el.hudFx) {
    const label = { full: '特效：完整', simple: '特效：簡約', off: '特效：關閉' };
    el.hudFx.textContent = label[fxMode] || '特效';
  }
}
el.fxBtns.forEach((b) => {
  b.addEventListener('click', () => setFxMode(b.dataset.fx));
});
if (el.hudFx) {
  el.hudFx.addEventListener('click', () => {
    const order = ['full', 'simple', 'off'];
    setFxMode(order[(order.indexOf(fxMode) + 1) % 3]);
  });
}
refreshFxButtons();
