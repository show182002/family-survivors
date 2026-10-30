/** 一家倖存 · 暫停：次序、自動、每招特效 */
'use strict';

// ================= 暫停：技能次序 / 自動升級 / 每技能特效 =================
function renderPausePlayers() {
  const box = document.getElementById('pause-players');
  if (!box || !run) return;
  box.innerHTML = '';
  run.players.forEach((p) => {
    const col = document.createElement('div');
    col.className = 'pp-col';
    const c = getChar(p.charId);
    col.innerHTML = `<div class="pp-title" style="color:${c.color}">${p.slot === 0 ? '1P' : '2P'} ${c.name}</div>`;
    const auto = document.createElement('button');
    auto.type = 'button';
    auto.className = 'fx-btn' + (p.auto ? ' on' : '');
    auto.textContent = p.auto ? '小招自動升級：ON（跟次序，唔暫停）' : '小招自動升級：OFF（手動揀）';
    auto.onclick = () => { p.auto = !p.auto; charPref(p.charId).auto = p.auto; savePrefs(); renderPausePlayers(); refreshAutoButtons(true); };
    col.appendChild(auto);
    // 轉職招式特效開關
    [0, 1, 2].forEach((t) => {
      const bid = p.branch[t];
      if (!bid) return;
      const b = getBranch(bid), key = 'br' + bid;
      const row = document.createElement('div');
      row.className = 'pp-row branch-row';
      row.title = b.desc;
      row.innerHTML = `<span class="pp-n">⭐</span><span class="pp-ic">${b.icon}</span><span class="pp-name">${b.name}・${b.move}</span><span class="pp-lv">轉職</span>`;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'pp-btn ' + (skillFxOn(key) ? 'on' : '');
      btn.textContent = skillFxOn(key) ? '✨開' : '✨關';
      btn.onclick = () => { skillFx[key] = !skillFxOn(key); saveSkillFx(); renderPausePlayers(); };
      row.appendChild(btn);
      col.appendChild(row);
    });
    const hint = document.createElement('div');
    hint.className = 'pp-hint';
    hint.textContent = '次序＝升級優先（上面先）· ✨＝呢招特效';
    col.appendChild(hint);
    p.order.forEach((id, idx) => {
      const s = SKILLS.find((x) => x.id === id);
      const lv = skillLevel(p, id);
      const row = document.createElement('div');
      row.className = 'pp-row' + (lv ? '' : ' dim');
      row.title = s.desc + '（' + s.tags.join('·') + '）';
      row.innerHTML = `<span class="pp-n">${idx + 1}</span><span class="pp-ic">${s.icon}</span><span class="pp-name">${s.name}</span><span class="pp-lv">${lv ? 'Lv' + lv + '/' + s.max : '未學'}</span>`;
      const mk = (txt, fn, cls) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pp-btn ' + (cls || ''); b.textContent = txt; b.onclick = fn; row.appendChild(b); return b; };
      mk('▲', () => { if (idx > 0) { p.order.splice(idx - 1, 0, p.order.splice(idx, 1)[0]); savePrefs(); renderPausePlayers(); } });
      mk('▼', () => { if (idx < p.order.length - 1) { p.order.splice(idx + 1, 0, p.order.splice(idx, 1)[0]); savePrefs(); renderPausePlayers(); } });
      mk(skillFxOn(id) ? '✨開' : '✨關', () => { skillFx[id] = !skillFxOn(id); saveSkillFx(); renderPausePlayers(); }, skillFxOn(id) ? 'on' : '');
      col.appendChild(row);
    });
    box.appendChild(col);
  });
}
  // ================= v0.0200：升級曲線 =================
