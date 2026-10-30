/** 一家倖存 · 直機硬閘「請打橫」＋全螢幕掣（art-demo shell） */
'use strict';

(function () {
  var portraitMq = null;
  try { portraitMq = window.matchMedia('(orientation: portrait)'); } catch (_) { portraitMq = null; }

  var rotateModal = document.getElementById('rotateModal');
  var fsBtn = document.getElementById('fsBtn');
  var fsFailTip = document.getElementById('fsFailTip');
  var fsFailTimer = null;

  function isTouchDevice() {
    return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
  }

  function isPortrait() {
    if (portraitMq && typeof portraitMq.matches === 'boolean') return portraitMq.matches;
    return (window.innerHeight || 0) > (window.innerWidth || 0);
  }

  function isPortraitGated() {
    return !!(isTouchDevice() && isPortrait());
  }
  window.isPortraitGated = isPortraitGated;

  function updateRotateGate() {
    var show = isPortraitGated();
    if (rotateModal) rotateModal.style.display = show ? 'flex' : 'none';
    if (typeof fitCanvas === 'function') fitCanvas();
  }

  if (rotateModal) {
    rotateModal.addEventListener('touchstart', function (e) {
      e.preventDefault(); e.stopPropagation();
    }, { passive: false });
    rotateModal.addEventListener('touchmove', function (e) {
      e.preventDefault(); e.stopPropagation();
    }, { passive: false });
  }

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }
  function syncFsBtnLabel() {
    if (!fsBtn) return;
    fsBtn.textContent = isFullscreen() ? '退出' : '全螢幕';
  }
  function showFsFailTip() {
    if (!fsFailTip) return;
    fsFailTip.style.display = 'block';
    if (fsFailTimer) clearTimeout(fsFailTimer);
    fsFailTimer = setTimeout(function () {
      fsFailTip.style.display = 'none';
      fsFailTimer = null;
    }, 3500);
  }
  function tryLockLandscape() {
    try {
      var o = screen.orientation || screen.mozOrientation || screen.msOrientation;
      if (o && typeof o.lock === 'function') {
        var p = o.lock('landscape');
        if (p && typeof p.catch === 'function') {
          p.catch(function () { try { o.lock('landscape-primary'); } catch (_) {} });
        }
      }
    } catch (_) {}
  }
  function requestFsOn(el) {
    if (!el) return Promise.reject(new Error('no el'));
    if (typeof el.requestFullscreen === 'function') return el.requestFullscreen();
    if (typeof el.webkitRequestFullscreen === 'function') return el.webkitRequestFullscreen();
    if (typeof el.webkitRequestFullScreen === 'function') return el.webkitRequestFullScreen();
    return Promise.reject(new Error('no fullscreen API'));
  }
  function exitFs() {
    if (typeof document.exitFullscreen === 'function') return document.exitFullscreen();
    if (typeof document.webkitExitFullscreen === 'function') return document.webkitExitFullscreen();
    if (typeof document.webkitCancelFullScreen === 'function') return document.webkitCancelFullScreen();
    return Promise.reject(new Error('no exit'));
  }
  function onFsChange() {
    syncFsBtnLabel();
    try {
      if (el && el.canvas) { el.canvas.style.width = ''; el.canvas.style.height = ''; }
    } catch (_) {}
    updateRotateGate();
    setTimeout(updateRotateGate, 80);
    setTimeout(updateRotateGate, 250);
    setTimeout(updateRotateGate, 500);
  }
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);

  function toggleFullscreen(ev) {
    if (ev) {
      try { ev.preventDefault(); } catch (_) {}
      try { ev.stopPropagation(); } catch (_) {}
    }
    if (isFullscreen()) { exitFs().catch(function () {}); return; }
    var targets = [document.documentElement];
    if (el && el.game) targets.push(el.game);
    function tryNext(i) {
      if (i >= targets.length) { showFsFailTip(); return; }
      var p;
      try { p = requestFsOn(targets[i]); } catch (err) { tryNext(i + 1); return; }
      if (!p || typeof p.then !== 'function') {
        setTimeout(function () {
          if (isFullscreen()) { tryLockLandscape(); onFsChange(); }
          else tryNext(i + 1);
        }, 100);
        return;
      }
      p.then(function () { tryLockLandscape(); onFsChange(); })
        .catch(function () { tryNext(i + 1); });
    }
    tryNext(0);
  }

  if (fsBtn) {
    fsBtn.style.display = 'block';
    fsBtn.addEventListener('click', toggleFullscreen);
    fsBtn.addEventListener('touchend', function (e) {
      e.preventDefault(); e.stopPropagation(); toggleFullscreen(e);
    }, { passive: false });
    fsBtn.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });
  }
  syncFsBtnLabel();

  window.addEventListener('resize', updateRotateGate);
  window.addEventListener('orientationchange', updateRotateGate);
  if (window.visualViewport) visualViewport.addEventListener('resize', updateRotateGate);
  if (portraitMq) {
    try {
      if (typeof portraitMq.addEventListener === 'function') portraitMq.addEventListener('change', updateRotateGate);
      else if (typeof portraitMq.addListener === 'function') portraitMq.addListener(updateRotateGate);
    } catch (_) {}
  }
  updateRotateGate();
})();
