/** 一家倖存 · HUD（v0.02203 超簡：血條＋stick 旁細招） */
'use strict';

function updateHud() {
  const left = Math.max(0, WIN_TIME - run.time);
  const m = Math.floor(left / 60);
  const s = Math.floor(left % 60);
  el.timer.textContent = m + ':' + String(s).padStart(2, '0');
  el.kills.textContent = '殺 ' + run.kills;
  el.xpBar.style.width = ((run.xp / run.xpToNext) * 100) + '%';
  el.levelLabel.textContent = 'Lv.' + run.level;
  refreshAutoButtons();
  refreshUltButtons();
  layoutUltButtons();

  run.players.forEach((p, i) => {
    const chip = i === 0 ? el.hpP1 : el.hpP2;
    const c = getChar(p.charId);
    const pct = Math.max(0, p.hp / p.maxHp) * 100;
    if (!chip._main || chip._slot !== i) {
      chip.innerHTML = '<div class="hp-main"></div><div class="hp-skills"></div>';
      chip._main = chip.firstChild; chip._skills = chip.lastChild; chip._slot = i; chip._sig = '';
    }
    chip._main.innerHTML =
      `<div class="hp-name" style="color:${c.color}">${i === 0 ? '1P' : '2P'}${p.dead ? '💀' : ''}</div>` +
      `<div class="hp-bar-wrap"><div class="hp-bar" style="width:${pct}%;background:${c.color}"></div></div>`;
    chip._skills.innerHTML = '';
    chip._sig = '';
  });
}

function endRun(win) {
  mode = 'end';
  if (typeof updateRotateGate === 'function') updateRotateGate();
  cancelAnimationFrame(animId);
  el.end.classList.remove('hidden');
  el.endTitle.textContent = win ? '勝' : '敗';
  el.endTitle.style.color = win ? '#7dff9a' : '#ff6a6a';
  el.endStats.textContent =
    `${formatTime(run.time)} · 殺 ${run.kills} · Lv${run.level}`;
  draw();
}
function formatTime(t) {
  return Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
}

// ================= HUD 技能等級（暫停選單用；戰鬥 HUD 唔再畫）=================
function renderHudSkills(p, chip) {
  if (!chip || !chip._skills) return;
  chip._skills.innerHTML = '';
  chip._sig = '';
}

// ================= v0.0200：頂部左上 自動／手動選技掣 =================
function buildAutoButtons() {
  const box = document.getElementById('auto-btns');
  if (!box || !run) return;
  box.innerHTML = '';
  run.players.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fx-chip auto-chip';
    b.dataset.slot = p.slot;
    b.title = '自／手：小招自動或手動（轉職仍會停）';
    b.addEventListener('click', () => {
      p.auto = !p.auto;
      charPref(p.charId).auto = p.auto;
      savePrefs();
      b.blur();
      refreshAutoButtons(true);
    });
    box.appendChild(b);
  });
  refreshAutoButtons(true);
}
function refreshAutoButtons(force) {
  const box = document.getElementById('auto-btns');
  if (!box || !run) return;
  box.querySelectorAll('button').forEach((b) => {
    const p = run.players[+b.dataset.slot];
    if (!p) return;
    const sig = p.auto ? 'a' : 'm';
    if (!force && b._sig === sig) return;
    b._sig = sig;
    b.textContent = (p.slot === 0 ? '1' : '2') + (p.auto ? '自' : '手');
    b.classList.toggle('manual', !p.auto);
  });
}

// ================= v0.02203：細招掣（stick 右邊） =================
function refreshUltButtons() {
  if (!run) return;
  const btns = [el.btnUltP1, el.btnUltP2];
  run.players.forEach((p, i) => {
    const b = btns[i];
    if (!b) return;
    b.classList.remove('hidden'); // player slot exists; visibility = .press-show
    const ready = p.ultCd <= 0 && !p.dead && !p.carriedBy && !p.ball;
    if (ready) {
      b.disabled = false;
      b.classList.remove('cd');
      b.textContent = (typeof ultLabel === 'function' ? ultLabel(p) : '招');
    } else {
      b.disabled = true;
      b.classList.add('cd');
      b.textContent = p.dead ? '—' : (p.ultCd > 0 ? String(Math.ceil(p.ultCd)) : '…');
    }
  });
  if (run.players.length < 2 && el.btnUltP2) {
    el.btnUltP2.classList.add('hidden');
    el.btnUltP2.classList.remove('press-show');
  }
  if (typeof syncTouchControlsVisibility === 'function') syncTouchControlsVisibility();
  else layoutUltButtons();
}

/** 把 HTML 招掣擺喺 canvas 虛擬搖桿基座右邊 */
function layoutUltButtons() {
  if (!el.canvas || !el.game) return;
  const btns = [
    { btn: el.btnUltP1, stick: typeof sticks !== 'undefined' ? sticks.p1 : null },
    { btn: el.btnUltP2, stick: typeof sticks !== 'undefined' ? sticks.p2 : null },
  ];
  const rect = el.canvas.getBoundingClientRect();
  const gameRect = el.game.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;
  const scale = Math.min(rect.width / STAGE_W, rect.height / STAGE_H);
  const m = typeof stickMetrics === 'function' ? stickMetrics() : { radius: 100 };
  const btnSize = 48;

  btns.forEach(({ btn, stick }) => {
    if (!btn || !stick) return;
    if (btn.classList.contains('hidden')) return;
    // 閒置時都預先計位，撳出嚟先唔會跳
    const def = typeof defaultStickBase === 'function'
      ? defaultStickBase(stick)
      : { x: stick === sticks.p1 ? STAGE_W * 0.18 : STAGE_W * 0.82, y: STAGE_H * 0.78 };
    const cx = rect.left + (def.x / STAGE_W) * rect.width;
    const cy = rect.top + (def.y / STAGE_H) * rect.height;
    const radiusPx = (m.radius || 100) * scale;
    const left = cx + radiusPx + 6 - gameRect.left;
    const top = cy - btnSize / 2 - gameRect.top;
    btn.style.left = Math.round(left) + 'px';
    btn.style.top = Math.round(top) + 'px';
  });
}
window.layoutUltButtons = layoutUltButtons;
