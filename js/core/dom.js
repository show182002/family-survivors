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
  hpP3: document.getElementById('hp-p3'),
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
  hudZoom: document.getElementById('hud-zoom'),
  hudMute: document.getElementById('hud-mute'),
  btnUltP1: document.getElementById('btn-ult-p1'),
  btnUltP2: document.getElementById('btn-ult-p2'),
};

const ctx = el.canvas.getContext('2d');
el.canvas.width = STAGE_W;
el.canvas.height = STAGE_H;

function fitCanvas() {
  // Keep bitmap STAGE_W×STAGE_H (1920×817 @ v0.02207); CSS dvw/dvh owns display size.
  if (el.canvas.width !== STAGE_W) el.canvas.width = STAGE_W;
  if (el.canvas.height !== STAGE_H) el.canvas.height = STAGE_H;
  try {
    const cs = window.getComputedStyle(el.canvas);
    const cw = parseFloat(cs.width) || 0;
    const ch = parseFloat(cs.height) || 0;
    if (cw < 2 || ch < 2) {
      const aw = window.innerWidth || 320;
      const ah = window.innerHeight || 180;
      const scale = Math.min(aw / STAGE_W, ah / STAGE_H);
      el.canvas.style.width = Math.max(1, Math.floor(STAGE_W * scale)) + 'px';
      el.canvas.style.height = Math.max(1, Math.floor(STAGE_H * scale)) + 'px';
    } else {
      el.canvas.style.width = '';
      el.canvas.style.height = '';
    }
  } catch (_) {
    el.canvas.style.width = '';
    el.canvas.style.height = '';
  }
  el.canvas.style.display = 'block';
  if (el.game && !el.game.classList.contains('hidden')) {
    el.game.style.display = 'flex';
    el.game.style.alignItems = 'center';
    el.game.style.justifyContent = 'center';
  }
  ctx.imageSmoothingEnabled = false;
  if (typeof layoutUltButtons === 'function') layoutUltButtons();
}
window.addEventListener('resize', fitCanvas);
window.addEventListener('orientationchange', fitCanvas);
if (window.visualViewport) visualViewport.addEventListener('resize', fitCanvas);

function refreshFxButtons() {
  el.fxBtns.forEach((b) => {
    b.classList.toggle('on', b.dataset.fx === fxMode);
  });
  if (el.hudFx) {
    const label = { full: '效', simple: '簡', off: '無' };
    el.hudFx.textContent = label[fxMode] || '效';
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

function refreshZoomButton() {
  if (!el.hudZoom) return;
  el.hudZoom.textContent = typeof zoomLabel === 'function' ? zoomLabel() : '1';
  el.hudZoom.title = '倍 ' + (typeof getViewZoom === 'function' ? getViewZoom() : 1);
}
if (el.hudZoom) {
  el.hudZoom.addEventListener('click', () => {
    if (typeof cycleViewZoom === 'function') cycleViewZoom();
    el.hudZoom.blur();
  });
}
refreshZoomButton();

function refreshMuteButton() {
  if (!el.hudMute) return;
  const muted = typeof isMuted === 'function' ? isMuted() : false;
  el.hudMute.textContent = muted ? '靜' : '音';
  el.hudMute.title = muted ? '開聲' : '靜音';
}
if (el.hudMute) {
  el.hudMute.addEventListener('click', () => {
    if (typeof toggleMute === 'function') toggleMute();
    else refreshMuteButton();
    el.hudMute.blur();
  });
  refreshMuteButton();
}
