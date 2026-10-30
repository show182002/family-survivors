/** 一家倖存 · 直機硬閘「請打橫」＋全螢幕掣（Fullscreen API） */
'use strict';

(function () {
  var portraitMq = null;
  try { portraitMq = window.matchMedia('(orientation: portrait)'); } catch (_) { portraitMq = null; }

  var rotateModal = document.getElementById('rotateModal');
  var fsBtn = document.getElementById('fsBtn');
  var fsFailTip = document.getElementById('fsFailTip');
  var fsFailTimer = null;
  var lastFsToggleAt = 0;

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

  function afterFsLayout() {
    if (typeof fitCanvas === 'function') fitCanvas();
    if (typeof layoutUltButtons === 'function') layoutUltButtons();
  }

  function updateRotateGate() {
    // 只喺戰鬥（play）先迫打橫；選角／選單直機可撳可碌
    var inBattle = (typeof mode !== 'undefined' && mode === 'play');
    var show = !!(inBattle && isPortraitGated());
    if (rotateModal) rotateModal.style.display = show ? 'flex' : 'none';
    afterFsLayout();
  }
  window.updateRotateGate = updateRotateGate;

  if (rotateModal) {
    rotateModal.addEventListener('touchstart', function (e) {
      e.preventDefault(); e.stopPropagation();
    }, { passive: false });
    rotateModal.addEventListener('touchmove', function (e) {
      e.preventDefault(); e.stopPropagation();
    }, { passive: false });
  }

  function isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.webkitCurrentFullScreenElement
    );
  }

  function syncFsBtnLabel() {
    if (!fsBtn) return;
    fsBtn.textContent = isFullscreen() ? '退' : '全';
    fsBtn.setAttribute('aria-label', isFullscreen() ? '退出全螢幕' : '全螢幕');
  }

  function showFsFailTip() {
    if (!fsFailTip) return;
    fsFailTip.style.display = 'block';
    if (fsFailTimer) clearTimeout(fsFailTimer);
    fsFailTimer = setTimeout(function () {
      fsFailTip.style.display = 'none';
      fsFailTimer = null;
    }, 4000);
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

  function hasFullscreenApi() {
    var node = document.documentElement;
    return !!(
      (node && (node.requestFullscreen || node.webkitRequestFullscreen || node.webkitRequestFullScreen)) ||
      document.exitFullscreen || document.webkitExitFullscreen || document.webkitCancelFullScreen
    );
  }

  function requestFsOn(node) {
    if (!node) return Promise.reject(new Error('no el'));
    var opts = { navigationUI: 'hide' };
    function call(fn, withOpts) {
      try {
        if (withOpts) {
          var r = fn.call(node, opts);
          return (r && typeof r.then === 'function') ? r : Promise.resolve(r);
        }
        var r2 = fn.call(node);
        return (r2 && typeof r2.then === 'function') ? r2 : Promise.resolve(r2);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    if (typeof node.requestFullscreen === 'function') {
      return call(node.requestFullscreen, true).catch(function () {
        return call(node.requestFullscreen, false);
      });
    }
    if (typeof node.webkitRequestFullscreen === 'function') {
      return call(node.webkitRequestFullscreen, true).catch(function () {
        return call(node.webkitRequestFullscreen, false);
      });
    }
    if (typeof node.webkitRequestFullScreen === 'function') {
      return call(node.webkitRequestFullScreen, false);
    }
    return Promise.reject(new Error('no fullscreen API'));
  }

  function exitFs() {
    if (typeof document.exitFullscreen === 'function') {
      var p = document.exitFullscreen();
      return (p && typeof p.then === 'function') ? p : Promise.resolve(p);
    }
    if (typeof document.webkitExitFullscreen === 'function') {
      var p2 = document.webkitExitFullscreen();
      return (p2 && typeof p2.then === 'function') ? p2 : Promise.resolve(p2);
    }
    if (typeof document.webkitCancelFullScreen === 'function') {
      var p3 = document.webkitCancelFullScreen();
      return (p3 && typeof p3.then === 'function') ? p3 : Promise.resolve(p3);
    }
    return Promise.reject(new Error('no exit'));
  }

  function onFsChange() {
    syncFsBtnLabel();
    updateRotateGate();
    setTimeout(updateRotateGate, 80);
    setTimeout(updateRotateGate, 250);
    setTimeout(updateRotateGate, 500);
  }
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);

  function fsTargets() {
    var list = [document.documentElement];
    var gameScreen = document.getElementById('screen-game');
    var canvas = document.getElementById('game');
    // 全域 el（dom.js）若已就緒，優先用同一引用
    try {
      if (typeof el !== 'undefined' && el) {
        if (el.game) gameScreen = el.game;
        if (el.canvas) canvas = el.canvas;
      }
    } catch (_) {}
    if (gameScreen && list.indexOf(gameScreen) < 0) list.push(gameScreen);
    if (canvas && list.indexOf(canvas) < 0) list.push(canvas);
    return list;
  }

  function toggleFullscreen(ev) {
    if (ev) {
      try { ev.preventDefault(); } catch (_) {}
      try { ev.stopPropagation(); } catch (_) {}
    }
    var now = Date.now();
    if (now - lastFsToggleAt < 450) return;
    lastFsToggleAt = now;

    if (!hasFullscreenApi()) { showFsFailTip(); return; }

    if (isFullscreen()) {
      exitFs().then(function () { onFsChange(); }).catch(function () { showFsFailTip(); });
      return;
    }

    var targets = fsTargets();
    function tryNext(i) {
      if (i >= targets.length) { showFsFailTip(); return; }
      requestFsOn(targets[i])
        .then(function () {
          tryLockLandscape();
          onFsChange();
          // 部分 WebKit 入去後先 settle
          setTimeout(function () {
            if (!isFullscreen()) tryNext(i + 1);
            else onFsChange();
          }, 120);
        })
        .catch(function () { tryNext(i + 1); });
    }
    tryNext(0);
  }
  window.toggleFullscreen = toggleFullscreen;

  function isTypingTarget(t) {
    if (!t || !t.tagName) return false;
    var tag = String(t.tagName).toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (t.isContentEditable) return true;
    return false;
  }

  // F／F11：桌面快捷鍵（打字中唔觸發）；F11 多數瀏覽器會自己全螢幕，我哋再 sync
  window.addEventListener('keydown', function (e) {
    if (!e) return;
    if (isTypingTarget(e.target)) return;
    var key = e.key || '';
    var code = e.code || '';
    var isF = (key === 'f' || key === 'F' || code === 'KeyF') && !e.ctrlKey && !e.metaKey && !e.altKey;
    var isF11 = (key === 'F11' || code === 'F11');
    if (!isF && !isF11) return;
    if (isF) {
      e.preventDefault();
      toggleFullscreen(e);
    } else if (isF11) {
      // 唔攔截系統 F11；稍後 sync 掣字同 layout
      setTimeout(onFsChange, 50);
      setTimeout(onFsChange, 200);
    }
  }, true);

  if (fsBtn) {
    if (hasFullscreenApi()) {
      fsBtn.style.display = 'block';
    } else {
      // 仍然顯示，撳完出「用 Safari 開啟」提示（WhatsApp 等）
      fsBtn.style.display = 'block';
    }
    fsBtn.addEventListener('click', function (e) {
      toggleFullscreen(e);
    });
    fsBtn.addEventListener('touchend', function (e) {
      // preventDefault 抑止後續 click，避免雙觸發；仍喺 user gesture 入面
      try { e.preventDefault(); } catch (_) {}
      try { e.stopPropagation(); } catch (_) {}
      toggleFullscreen(e);
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
