/** 一家倖存 · 選角畫面（單槽 carousel）＋按鍵分派 */
'use strict';

// ——— Select ———
let cursorP1 = 0;
let cursorP2 = 0;
let pickP1 = null;
let pickP2 = null;
let p2Joined = false;
let mode = 'select';

function isTouchUI() {
  return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
}

function charCount() {
  return CHARACTERS.length;
}

function applyMobileSelectHints() {
  const p1Hint = document.querySelector('#panel-p1 .hint');
  const p2Hint = document.querySelector('#panel-p2 .hint');
  const foot = document.querySelector('#screen-select .footer-note');
  const sticks = document.getElementById('select-sticks');
  if (isTouchUI()) {
    if (p1Hint) p1Hint.textContent = '左右掣／搖桿換角 · 點大圖或「確認」';
    if (p2Hint) p2Hint.textContent = '左右掣／搖桿換角 · 點大圖或「加入／確認」（可選）';
    if (foot) foot.textContent = '1P 必選 · 2P 可選 · 角色唔重複 · 左右換角 · 點「開始戰鬥」開打 · 開打後請打橫';
    if (sticks) {
      sticks.classList.add('on');
      sticks.setAttribute('aria-hidden', 'false');
    }
  } else if (sticks) {
    sticks.classList.remove('on');
    sticks.setAttribute('aria-hidden', 'true');
  }
}

function shiftCursor(player, dir) {
  const n = charCount();
  if (n < 1) return;
  const d = dir < 0 ? -1 : 1;
  if (player === 1) {
    cursorP1 = (cursorP1 + d + n) % n;
  } else {
    p2Joined = true;
    cursorP2 = (cursorP2 + d + n) % n;
  }
  refreshSelectUI();
}

function buildSelectCards() {
  el.cardsP1.innerHTML = '';
  el.cardsP2.innerHTML = '';
  el.cardsP1.appendChild(makeBigSlot(1));
  el.cardsP2.appendChild(makeBigSlot(2));
  bindCarouselChevs();
  bindConfirmButtons();
  bindCarouselSwipes();
  bindSelectSticks();
  applyMobileSelectHints();
  refreshSelectUI();
}

function makeBigSlot(player) {
  const wrap = document.createElement('div');
  wrap.className = 'char-slot';
  wrap.dataset.player = String(player);

  const canvas = document.createElement('canvas');
  canvas.className = 'portrait-lg';
  canvas.width = 192;
  canvas.height = 192;
  wrap.appendChild(canvas);

  const name = document.createElement('div');
  name.className = 'name';
  wrap.appendChild(name);

  const role = document.createElement('div');
  role.className = 'role';
  wrap.appendChild(role);

  const kit = document.createElement('div');
  kit.className = 'kit';
  wrap.appendChild(kit);

  const dots = document.createElement('div');
  dots.className = 'carousel-dots';
  wrap.appendChild(dots);

  bindSelectTap(wrap, () => {
    if (player === 1) confirmP1();
    else { p2Joined = true; confirmP2(); }
  });
  return wrap;
}

function paintBigSlot(player, cursorIdx) {
  const stage = player === 1 ? el.cardsP1 : el.cardsP2;
  if (!stage) return;
  const slot = stage.querySelector('.char-slot');
  if (!slot) return;
  const c = CHARACTERS[cursorIdx];
  if (!c) return;

  const canvas = slot.querySelector('canvas.portrait-lg');
  if (canvas) {
    const cctx = canvas.getContext('2d');
    cctx.imageSmoothingEnabled = false;
    cctx.fillStyle = '#0a0810';
    cctx.fillRect(0, 0, 192, 192);
    for (let y = 0; y < 192; y += 8)
      for (let x = 0; x < 192; x += 8)
        if ((x + y) % 16 === 0) {
          cctx.fillStyle = '#12101a';
          cctx.fillRect(x, y, 8, 8);
        }
    // larger stand-in portrait
    drawSprite(cctx, c.sprite, 96, 168, 8, false);
  }

  const name = slot.querySelector('.name');
  if (name) {
    name.textContent = c.name;
    name.style.color = c.color;
  }
  const role = slot.querySelector('.role');
  if (role) role.textContent = c.role;
  const kit = slot.querySelector('.kit');
  if (kit) {
    kit.innerHTML = (c.baseTags || []).map((t) => `<span class="tag-pill">${t}</span>`).join(' ') +
      '<br><b style="color:#ffe566">大招</b> ' + c.ultName;
  }

  const dots = slot.querySelector('.carousel-dots');
  if (dots) {
    dots.innerHTML = '';
    CHARACTERS.forEach((_, i) => {
      const d = document.createElement('span');
      d.className = 'dot' + (i === cursorIdx ? ' on' : '');
      dots.appendChild(d);
    });
  }

  const myPick = player === 1 ? pickP1 : pickP2;
  const otherPick = player === 1 ? pickP2 : pickP1;
  slot.classList.toggle('cursor-p1', player === 1);
  slot.classList.toggle('cursor-p2', player === 2 && p2Joined);
  slot.classList.toggle('picked-p1', player === 1 && myPick === c.id);
  slot.classList.toggle('picked-p2', player === 2 && myPick === c.id);
  slot.classList.toggle('taken', otherPick === c.id && myPick !== c.id);
}

/** iOS 有時 click 唔穩：touchend／pointerup 一齊綁，preventDefault 避免雙觸發 */
function bindSelectTap(node, fn) {
  if (!node || typeof fn !== 'function') return;
  let locked = false;
  const fire = (e) => {
    if (locked) return;
    locked = true;
    try { if (e && e.preventDefault) e.preventDefault(); } catch (_) {}
    try { if (e && e.stopPropagation) e.stopPropagation(); } catch (_) {}
    try { fn(e); } finally {
      setTimeout(() => { locked = false; }, 320);
    }
  };
  node.addEventListener('click', fire);
  node.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') return;
    fire(e);
  });
  node.addEventListener('touchend', fire, { passive: false });
}

function bindCarouselChevs() {
  document.querySelectorAll('.carousel-chev').forEach((btn) => {
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    bindSelectTap(btn, () => {
      const p = Number(btn.dataset.player) || 1;
      const d = Number(btn.dataset.dir) || 1;
      shiftCursor(p, d);
    });
  });
}

function bindConfirmButtons() {
  const b1 = document.getElementById('btn-confirm-p1');
  const b2 = document.getElementById('btn-confirm-p2');
  if (b1 && b1.dataset.bound !== '1') {
    b1.dataset.bound = '1';
    bindSelectTap(b1, () => confirmP1());
  }
  if (b2 && b2.dataset.bound !== '1') {
    b2.dataset.bound = '1';
    bindSelectTap(b2, () => { p2Joined = true; confirmP2(); });
  }
}

function bindCarouselSwipes() {
  [1, 2].forEach((player) => {
    const stage = player === 1 ? el.cardsP1 : el.cardsP2;
    if (!stage || stage.dataset.swipeBound === '1') return;
    stage.dataset.swipeBound = '1';
    let sx = 0, sy = 0, active = false, moved = false;
    const onStart = (x, y) => { sx = x; sy = y; active = true; moved = false; };
    const onMove = (x, y) => {
      if (!active) return;
      const dx = x - sx, dy = y - sy;
      if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        // 向左滑／撥 = 上一個；向右 = 下一個（同 ◀▶／搖桿）
        shiftCursor(player, dx < 0 ? -1 : 1);
        sx = x; sy = y;
        moved = true;
        active = false; // one shift per gesture; release to swipe again
      }
    };
    const onEnd = () => { active = false; };
    stage.addEventListener('touchstart', (e) => {
      if (!e.touches || !e.touches[0]) return;
      onStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    stage.addEventListener('touchmove', (e) => {
      if (!e.touches || !e.touches[0]) return;
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    stage.addEventListener('touchend', onEnd);
    stage.addEventListener('touchcancel', onEnd);
    // prevent accidental confirm right after swipe
    stage.addEventListener('click', (e) => {
      if (moved) {
        moved = false;
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  });
}

function bindSelectSticks() {
  const root = document.getElementById('select-sticks');
  if (!root || root.dataset.bound === '1') return;
  root.dataset.bound = '1';

  function wireStick(elStick) {
    if (!elStick) return;
    const player = Number(elStick.dataset.player) || 1;
    const pad = elStick.querySelector('.select-stick-pad');
    const knob = elStick.querySelector('.select-stick-knob');
    if (!pad) return;
    let pid = null;
    let ox = 0, oy = 0;
    let fired = false;
    const THRESH = 28;
    const KNOB_MAX = 36;

    function setKnob(dx, dy) {
      if (!knob) return;
      const len = Math.hypot(dx, dy) || 1;
      const s = Math.min(1, KNOB_MAX / len);
      knob.style.transform = `translate(calc(-50% + ${dx * s}px), calc(-50% + ${dy * s}px))`;
    }
    function resetKnob() {
      if (knob) knob.style.transform = 'translate(-50%, -50%)';
    }
    function onDown(id, x, y) {
      if (pid != null) return;
      pid = id;
      fired = false;
      const r = pad.getBoundingClientRect();
      ox = r.left + r.width / 2;
      oy = r.top + r.height / 2;
      setKnob(x - ox, y - oy);
    }
    function onMove(id, x, y) {
      if (pid !== id) return;
      const dx = x - ox;
      const dy = y - oy;
      setKnob(dx, dy);
      if (Math.abs(dx) < THRESH * 0.45) {
        fired = false; // 回中再撥可以再換
      } else if (!fired && Math.abs(dx) >= THRESH && Math.abs(dx) > Math.abs(dy) * 1.15) {
        fired = true;
        shiftCursor(player, dx < 0 ? -1 : 1);
      }
    }
    function onUp(id) {
      if (pid !== id) return;
      pid = null;
      fired = false;
      resetKnob();
    }

    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      pad.setPointerCapture(e.pointerId);
      onDown(e.pointerId, e.clientX, e.clientY);
    });
    pad.addEventListener('pointermove', (e) => {
      onMove(e.pointerId, e.clientX, e.clientY);
    });
    pad.addEventListener('pointerup', (e) => onUp(e.pointerId));
    pad.addEventListener('pointercancel', (e) => onUp(e.pointerId));
    pad.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: true });
  }

  wireStick(document.getElementById('select-stick-p1'));
  wireStick(document.getElementById('select-stick-p2'));
}

function refreshSelectUI() {
  paintBigSlot(1, cursorP1);
  paintBigSlot(2, cursorP2);

  el.readyP1.textContent = pickP1 ? '已選：' + getChar(pickP1).name : '未選';
  el.readyP1.classList.toggle('on', !!pickP1);
  if (!p2Joined) {
    el.readyP2.textContent = isTouchUI() ? '未加入（左右換角或確認加入）' : '未加入（方向鍵移動 · Enter/Num0 確認加入）';
    el.readyP2.classList.remove('on');
  } else {
    el.readyP2.textContent = pickP2 ? '已選：' + getChar(pickP2).name : '已加入・未確認';
    el.readyP2.classList.toggle('on', !!pickP2);
  }
  el.btnStart.disabled = !pickP1;

  const b1 = document.getElementById('btn-confirm-p1');
  const b2 = document.getElementById('btn-confirm-p2');
  if (b1) {
    b1.textContent = pickP1 === CHARACTERS[cursorP1].id ? '已確認 ✓' : '確認';
    b1.classList.toggle('on', !!pickP1 && pickP1 === CHARACTERS[cursorP1].id);
  }
  if (b2) {
    if (!p2Joined) b2.textContent = '加入／確認';
    else if (pickP2 === CHARACTERS[cursorP2].id) b2.textContent = '已確認 ✓';
    else b2.textContent = '確認';
    b2.classList.toggle('on', !!pickP2 && pickP2 === CHARACTERS[cursorP2].id);
  }
}

function confirmP1() {
  const id = CHARACTERS[cursorP1].id;
  if (pickP2 === id) return;
  pickP1 = id;
  refreshSelectUI();
}
function confirmP2() {
  p2Joined = true;
  const id = CHARACTERS[cursorP2].id;
  if (pickP1 === id) return;
  pickP2 = id;
  refreshSelectUI();
}

function onKeyDown(e) {
  if (mode === 'select') {
    if (e.code === 'KeyA' || e.code === 'KeyW') { shiftCursor(1, -1); }
    if (e.code === 'KeyD' || e.code === 'KeyS') { shiftCursor(1, 1); }
    if (e.code === 'Space') confirmP1();
    if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') { shiftCursor(2, -1); }
    if (e.code === 'ArrowRight' || e.code === 'ArrowDown') { shiftCursor(2, 1); }
    if (e.code === 'Numpad0') { p2Joined = true; confirmP2(); }
    if (e.code === 'Enter') {
      if (p2Joined && !pickP2) confirmP2();
      else if (pickP1 && !el.btnStart.disabled) startRun();
      else if (!pickP1) confirmP1();
    }
    return;
  }
  if (mode === 'play') {
    if (e.code === 'Escape') pauseGame();
    if (e.code === 'KeyH') tryUlt(0);
    if (e.code === 'Numpad0') tryUlt(1);
    return;
  }
  if (mode === 'levelup') {
    if (e.code === 'Digit1' || e.code === 'Numpad1') chooseUpgrade(0);
    if (e.code === 'Digit2' || e.code === 'Numpad2') chooseUpgrade(1);
    if ((e.code === 'Digit3' || e.code === 'Numpad3') && !(currentPick && currentPick.branch != null)) chooseUpgrade(2);
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveUpgradeFocus(-1);
    if (e.code === 'KeyD' || e.code === 'ArrowRight') moveUpgradeFocus(1);
    if (e.code === 'Space' || e.code === 'Enter') chooseUpgrade(upgradeFocus);
    return;
  }
  if (mode === 'pause' && e.code === 'Escape') resumeGame();
}
