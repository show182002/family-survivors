/** 一家倖存 · 選角畫面＋按鍵分派 */
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

function applyMobileSelectHints() {
  const p1Hint = document.querySelector('#panel-p1 .hint');
  const p2Hint = document.querySelector('#panel-p2 .hint');
  const foot = document.querySelector('#screen-select .footer-note');
  if (isTouchUI()) {
    if (p1Hint) p1Hint.textContent = '點角色選角';
    if (p2Hint) p2Hint.textContent = '點角色加入／選角（可選）';
    if (foot) foot.textContent = '1P 必選 · 2P 可選 · 角色唔重複 · 點「開始戰鬥」開打 · 開打後請打橫 · 左／右搖桿 · 大招掣';
  }
}

function buildSelectCards() {
  el.cardsP1.innerHTML = '';
  el.cardsP2.innerHTML = '';
  CHARACTERS.forEach((c, i) => {
    el.cardsP1.appendChild(makeCard(c, i, 1));
    el.cardsP2.appendChild(makeCard(c, i, 2));
  });
  applyMobileSelectHints();
  refreshSelectUI();
}

function makeCard(c, i, player) {
  const div = document.createElement('div');
  div.className = 'char-card';
  div.dataset.idx = i;
  div.dataset.player = player;
  const canvas = document.createElement('canvas');
  canvas.className = 'portrait';
  canvas.width = 96;
  canvas.height = 96;
  const cctx = canvas.getContext('2d');
  cctx.imageSmoothingEnabled = false;
  cctx.fillStyle = '#0a0810';
  cctx.fillRect(0, 0, 96, 96);
  for (let y = 0; y < 96; y += 8)
    for (let x = 0; x < 96; x += 8)
      if ((x + y) % 16 === 0) {
        cctx.fillStyle = '#12101a';
        cctx.fillRect(x, y, 8, 8);
      }
  drawSprite(cctx, c.sprite, 48, 88, 5, false);
  div.appendChild(canvas);
  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = c.name;
  name.style.color = c.color;
  div.appendChild(name);
  const role = document.createElement('div');
  role.className = 'role';
  role.textContent = c.role;
  div.appendChild(role);
  const tags = document.createElement('div');
  tags.className = 'kit';
  tags.innerHTML = (c.baseTags || []).map((t) => `<span class="tag-pill">${t}</span>`).join(' ') +
    '<br><b style="color:#ffe566">大招</b> ' + c.ultName;
  div.appendChild(tags);
  const pick = () => {
    if (player === 1) { cursorP1 = i; confirmP1(); }
    else { cursorP2 = i; p2Joined = true; confirmP2(); }
  };
  bindSelectTap(div, pick);
  return div;
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

function refreshSelectUI() {
  const cards1 = el.cardsP1.querySelectorAll('.char-card');
  const cards2 = el.cardsP2.querySelectorAll('.char-card');
  cards1.forEach((card, i) => {
    card.classList.toggle('cursor-p1', i === cursorP1);
    card.classList.toggle('picked-p1', pickP1 === CHARACTERS[i].id);
    card.classList.toggle('taken', pickP2 === CHARACTERS[i].id);
  });
  cards2.forEach((card, i) => {
    card.classList.toggle('cursor-p2', p2Joined && i === cursorP2);
    card.classList.toggle('picked-p2', pickP2 === CHARACTERS[i].id);
    card.classList.toggle('taken', pickP1 === CHARACTERS[i].id && pickP2 !== CHARACTERS[i].id);
  });
  el.readyP1.textContent = pickP1 ? '已選：' + getChar(pickP1).name : '未選';
  el.readyP1.classList.toggle('on', !!pickP1);
  if (!p2Joined) {
    el.readyP2.textContent = isTouchUI() ? '未加入（點角色加入）' : '未加入（方向鍵移動 · Enter/Num0 確認加入）';
    el.readyP2.classList.remove('on');
  } else {
    el.readyP2.textContent = pickP2 ? '已選：' + getChar(pickP2).name : '已加入・未確認';
    el.readyP2.classList.toggle('on', !!pickP2);
  }
  el.btnStart.disabled = !pickP1;
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
    if (e.code === 'KeyA' || e.code === 'KeyW') { cursorP1 = (cursorP1 + 2) % 3; refreshSelectUI(); }
    if (e.code === 'KeyD' || e.code === 'KeyS') { cursorP1 = (cursorP1 + 1) % 3; refreshSelectUI(); }
    if (e.code === 'Space') confirmP1();
    if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') { p2Joined = true; cursorP2 = (cursorP2 + 2) % 3; refreshSelectUI(); }
    if (e.code === 'ArrowRight' || e.code === 'ArrowDown') { p2Joined = true; cursorP2 = (cursorP2 + 1) % 3; refreshSelectUI(); }
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
