/** 一家倖存 · HUD、技能 icon、左上自動／手動掣 */
'use strict';

function updateHud() {
  const left = Math.max(0, WIN_TIME - run.time);
  const m = Math.floor(left / 60);
  const s = Math.floor(left % 60);
  el.timer.textContent = m + ':' + String(s).padStart(2, '0');
  el.kills.textContent = '擊殺 ' + run.kills;
  el.xpBar.style.width = ((run.xp / run.xpToNext) * 100) + '%';
  const nextM = BRANCH_LEVELS.find((l) => l > run.level);
  el.levelLabel.textContent = 'Lv.' + run.level + '（共享經驗' + (nextM ? ' · 下次轉職 Lv' + nextM : ' · 已全轉職') + '）';
  refreshAutoButtons();
  refreshUltButtons();

  run.players.forEach((p, i) => {
    const chip = i === 0 ? el.hpP1 : el.hpP2;
    const c = getChar(p.charId);
    const ultReady = p.ultCd <= 0;
    const ultKey = i === 0 ? 'H' : 'Num0';
    const pct = Math.max(0, p.hp / p.maxHp) * 100;
    const rules = (p.activeRules || []).slice(0, 3).map((r) => r.name).join('·') || '—';
    if (!chip._main || chip._slot !== i) {
      chip.innerHTML = '<div class="hp-main"></div><div class="hp-skills"></div>';
      chip._main = chip.firstChild; chip._skills = chip.lastChild; chip._slot = i; chip._sig = '';
    }
    chip._main.innerHTML =
      `<div class="hp-name" style="color:${c.color}">${i === 0 ? '1P' : '2P'} ${c.name}${p.dead ? ' 💀' : ''}</div>` +
      `<div class="hp-bar-wrap"><div class="hp-bar" style="width:${pct}%;background:${c.color}"></div></div>` +
      `<div class="hp-num">${Math.ceil(p.hp)}/${p.maxHp}${p.shield > 0 ? ' 🛡' + Math.ceil(p.shield) : ''}</div>` +
      `<div class="hp-ult">${ultLabel(p)}[${ultKey}] ${ultReady ? '<b style="color:#ffe566">就緒</b>' : Math.ceil(p.ultCd) + 's'}</div>` +
      `<div class="hp-rules">${rules}</div>` +
      `<div class="hp-auto">${branchPath(p)}</div>`;
    renderHudSkills(p, chip);
  });
}

function endRun(win) {
  mode = 'end';
  if (typeof updateRotateGate === 'function') updateRotateGate();
  cancelAnimationFrame(animId);
  el.end.classList.remove('hidden');
  el.endTitle.textContent = win ? '勝利！生存 5 分鐘' : '全滅…';
  el.endTitle.style.color = win ? '#7dff9a' : '#ff6a6a';
  el.endStats.textContent =
    `時間 ${formatTime(run.time)} · 擊殺 ${run.kills} · 等級 ${run.level}`;
  draw();
}
function formatTime(t) {
  return Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
}

// ================= HUD 技能等級（icon 先，hover 出字）=================
function renderHudSkills(p, chip) {
  const owned = (p.order || []).filter((id) => skillLevel(p, id) > 0);
  PASSIVES.forEach((s) => { if (skillLevel(p, s.id) > 0) owned.push(s.id); });
  const sig = owned.map((id) => id + skillLevel(p, id)).join(',');
  if (chip._sig === sig) return;
  chip._sig = sig;
  chip._skills.innerHTML = owned.map((id) => {
    const s = findSkillOrPassive(id);
    const lv = skillLevel(p, id);
    const max = s.max || 5;
    const tip = `${s.name}  Lv${lv}/${max}\n${(s.tags || []).join('·')}\n${s.desc}`;
    return `<span class="hs${lv >= max ? ' max' : ''}" title="${tip.replace(/"/g, '&quot;')}">${s.icon}<b>${lv >= max ? 'MAX' : lv}</b></span>`;
  }).join('');
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
    b.title = '自動＝普通技能跟次序自動升（唔暫停）；手動＝自己揀。轉職（Lv5／10／15）一定會停低俾你揀';
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
    b.textContent = (p.slot === 0 ? '1P ' : '2P ') + p.name + '：' + (p.auto ? '小招自動✔' : '小招手動✋');
    b.classList.toggle('manual', !p.auto);
  });
}

// ================= v0.02100：大招觸控掣狀態 =================
function refreshUltButtons() {
  if (!run) return;
  const btns = [el.btnUltP1, el.btnUltP2];
  run.players.forEach((p, i) => {
    const b = btns[i];
    if (!b) return;
    b.classList.remove('hidden');
    const ready = p.ultCd <= 0 && !p.dead && !p.carriedBy && !p.ball;
    const label = ultLabel(p);
    const key = i === 0 ? 'H' : '0';
    if (ready) {
      b.disabled = false;
      b.classList.remove('cd');
      b.innerHTML = label + '<span class="ult-cd">就緒 · ' + key + '</span>';
    } else {
      b.disabled = true;
      b.classList.add('cd');
      const sec = p.dead ? '—' : (p.ultCd > 0 ? Math.ceil(p.ultCd) + 's' : '…');
      b.innerHTML = label + '<span class="ult-cd">' + sec + '</span>';
    }
  });
  if (run.players.length < 2 && el.btnUltP2) el.btnUltP2.classList.add('hidden');
}
