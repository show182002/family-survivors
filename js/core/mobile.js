/** 一家倖存 · 直機硬閘「請打橫」＋全螢幕掣（Fullscreen API · iOS Safari 優先） */
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
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled
    );
  }

  /** 喺同一個 user gesture 入面同步發起；唔用 setTimeout（Safari 會丟 activation） */
  function requestFsOn(node) {
    if (!node) return Promise.reject(new Error('no el'));
    var fn = null;
    var kind = '';
    if (typeof node.requestFullscreen === 'function') {
      fn = node.requestFullscreen; kind = 'std';
    } else if (typeof node.webkitRequestFullscreen === 'function') {
      fn = node.webkitRequestFullscreen; kind = 'webkit';
    } else if (typeof node.webkitRequestFullScreen === 'function') {
      fn = node.webkitRequestFullScreen; kind = 'webkitOld';
    } else {
      return Promise.reject(new Error('no fullscreen API'));
    }

    function invoke(withOpts) {
      try {
        var r;
        if (withOpts && kind === 'std') r = fn.call(node, { navigationUI: 'hide' });
        else if (withOpts && kind === 'webkit') {
          // Safari：有啲版本唔收 options，有啲收
          try { r = fn.call(node, Element.ALLOW_KEYBOARD_INPUT); }
          catch (_) { r = fn.call(node); }
        } else {
          r = fn.call(node);
        }
        return (r && typeof r.then === 'function') ? r : Promise.resolve(r);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    // 先試 navigationUI hide（桌面／iPad），失敗即無 options 再試——同一 gesture 微任務鏈
    if (kind === 'std') {
      return invoke(true).catch(function () { return invoke(false); });
    }
    return invoke(false);
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
    try {
      if (typeof el !== 'undefined' && el) {
        if (el.game) gameScreen = el.game;
        if (el.canvas) canvas = el.canvas;
      }
    } catch (_) {}
    // body 有時比 html 更穩（部分 WebKit）
    if (document.body && list.indexOf(document.body) < 0) list.push(document.body);
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

    if (isFullscreen()) {
      exitFs().then(function () { onFsChange(); }).catch(function () { onFsChange(); });
      return;
    }

    if (!hasFullscreenApi()) { showFsFailTip(); return; }

    var targets = fsTargets();
    // 關鍵：第一下一定同步 call requestFullscreen（保留 iOS Safari user gesture）
    var first = targets[0];
    var started = null;
    try {
      started = requestFsOn(first);
    } catch (err) {
      started = Promise.reject(err);
    }

    function chain(i, p) {
      return p.then(function () {
        tryLockLandscape();
        onFsChange();
        // 成功就完；若 promise resolve 但實際未入 FS，喺微任務內試下一個（仍盡量貼住 gesture）
        if (isFullscreen()) return;
        if (i + 1 >= targets.length) { showFsFailTip(); return; }
        return chain(i + 1, requestFsOn(targets[i + 1]));
      }).catch(function () {
        if (i + 1 >= targets.length) { showFsFailTip(); return; }
        return chain(i + 1, requestFsOn(targets[i + 1]));
      });
    }
    chain(0, started);
  }
  window.toggleFullscreen = toggleFullscreen;

  function isTypingTarget(t) {
    if (!t || !t.tagName) return false;
    var tag = String(t.tagName).toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (t.isContentEditable) return true;
    return false;
  }

  // F／F11：桌面快捷鍵（打字中唔觸發）
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
      setTimeout(onFsChange, 50);
      setTimeout(onFsChange, 200);
    }
  }, true);

  if (fsBtn) {
    fsBtn.style.display = 'block';
    // 阻遊戲 stick 搶 touch；全螢幕一定走 click（iOS Safari user activation 最穩）
    fsBtn.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });
    fsBtn.addEventListener('touchend', function (e) { e.stopPropagation(); }, { passive: true });
    fsBtn.addEventListener('click', function (e) {
      toggleFullscreen(e);
    });
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
