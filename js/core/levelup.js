/** 一家倖存 · 經驗、升級、自動選技、轉職選卡排隊 */
'use strict';

// ——— Level / XP (shared) + per-player points ———
function addXp(amount, fromPlayer) {
  const gain = fromPlayer ? amount * (sm(fromPlayer).xpGain || 1) : amount;
  run.xp += gain;
  while (run.xp >= run.xpToNext) {
    run.xp -= run.xpToNext;
    run.level++;
    if (typeof sfxLevel === 'function') sfxLevel();
    run.xpToNext = xpNeed(run.level);
    levelupQueue++;
    if (BRANCH_LEVELS.includes(run.level)) run.branchQueue.push(BRANCH_LEVELS.indexOf(run.level));
  }
  if (levelupQueue > 0 && mode === 'play') beginLevelUps();
}

function beginLevelUps() {
  if (levelupQueue <= 0) return;
  // Each queued level → each living player gets POINTS_PER_LEVEL picks
  while (levelupQueue > 0) {
    levelupQueue--;
    if (run.branchQueue.length) {
      const tier = run.branchQueue.shift();
      for (const p of run.players) if (!p.dead) pickQueue.push({ slot: p.slot, branch: tier });
    }
    for (const p of run.players) {
      if (p.dead) continue;
      pickQueue.push({ slot: p.slot, pointsLeft: POINTS_PER_LEVEL });
    }
  }
  openNextPick();
}

function openNextPick() {
  // 自動升級玩家：唔暫停，跟次序揀
  while (pickQueue.length) {
    const q = pickQueue[0];
    const ap = run.players[q.slot];
    if (!ap || ap.dead) { pickQueue.shift(); continue; }
    if (q.branch != null) {
      q.tier = firstOpenTier(ap, q.branch);
      if (q.tier < 0 || !branchOptions(ap, q.tier).length) { pickQueue.shift(); continue; }
      break;
    }
    if (!ap.auto) break;
    while (q.pointsLeft > 0) {
      const s = autoPickForPlayer(ap);
      if (!s) break;
      learnSkill(ap, s.id);
      addFloat(ap.x, ap.y - 50, s.icon + ' ' + s.name + ' Lv' + skillLevel(ap, s.id), '#ffe566', true);
      q.pointsLeft--;
    }
    pickQueue.shift();
    run.magnetPulse = 0.6;
  }
  if (!pickQueue.length) {
    currentPick = null;
    el.levelup.classList.add('hidden');
    if (mode !== 'play') {
      mode = 'play';
      if (typeof updateRotateGate === 'function') updateRotateGate();
      lastTs = 0;
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(frame);
    }
    return;
  }
  currentPick = pickQueue[0];
  const p = run.players[currentPick.slot];
  if (!p || p.dead) {
    pickQueue.shift();
    openNextPick();
    return;
  }
  if (currentPick.branch != null) { openBranchPick(p); return; }
  pendingChoices = pickUpgradeChoicesForPlayer(p, 3);
  if (!pendingChoices.length) {
    pickQueue.shift();
    openNextPick();
    return;
  }
  upgradeFocus = 0;
  mode = 'levelup';
  if (typeof updateRotateGate === 'function') updateRotateGate();
  el.levelup.classList.remove('hidden');
  const who = (p.slot === 0 ? '1P' : '2P');
  if (el.levelupTitle) el.levelupTitle.textContent = '選 · ' + who;
  if (el.levelupSub) {
    el.levelupSub.textContent = '點' + currentPick.pointsLeft;
  }
  renderUpgradeCards(p);
}

function renderUpgradeCards(p) {
  el.upgrades.innerHTML = '';
  const have = getOwnedTags(p);
  pendingChoices.forEach((u, i) => {
    const div = document.createElement('div');
    div.className = 'upgrade-card' + (i === upgradeFocus ? ' focused' : '');
    const tagHtml = (u.tags || []).map((t) => {
      const neu = !have.has(t);
      return `<span class="tag-pill${neu ? ' new' : ''}">${t}</span>`;
    }).join('');
    // preview which rules would unlock
    let unlock = '';
    if (u.tags && u.tags.length) {
      const pretend = new Set(have);
      u.tags.forEach((t) => pretend.add(t));
      const news = TAG_RULES.filter((r) =>
        r.need.every((t) => pretend.has(t)) && !r.need.every((t) => have.has(t))
      );
      if (news.length) unlock = '<div class="u-unlock">解鎖：' + news.map((n) => n.name).join('、') + '</div>';
    }
    div.innerHTML =
      `<div class="u-icon">${u.icon}</div>` +
      `<div class="u-name">${u.name} <span class="u-lv">Lv${skillLevel(p, u.id)}→${skillLevel(p, u.id) + 1}/${u.max || 5}</span></div>` +
      `<div class="u-tags">${tagHtml || '<span class="tag-pill dim">被動</span>'}</div>` +
      `<div class="u-desc">${u.desc}</div>` + unlock;
    div.addEventListener('click', () => chooseUpgrade(i));
    el.upgrades.appendChild(div);
  });
  if (el.activeTags) {
    const tags = [...have].join('·') || '—';
    el.activeTags.textContent = 'TAG ' + tags;
  }
}

function moveUpgradeFocus(dir) {
  if (!pendingChoices.length) return;
  upgradeFocus = (upgradeFocus + dir + pendingChoices.length) % pendingChoices.length;
  const p = run.players[currentPick.slot];
  if (currentPick.branch != null) { renderBranchCards(p); return; }
  renderUpgradeCards(p);
}

function chooseUpgrade(i) {
  if (!currentPick) return;
  const u = pendingChoices[i];
  if (!u) return;
  const p = run.players[currentPick.slot];
  if (currentPick.branch != null) {
    applyBranch(p, u);
    pickQueue.shift();
    openNextPick();
    return;
  }
  const beforeHp = p.maxHp;
  learnSkill(p, u.id);
  if (u.id === 'vitality' && !p.dead) {
    p.hp = Math.min(p.maxHp, p.hp + Math.max(0, p.maxHp - beforeHp));
  }
  run.magnetPulse = 0.6;
  currentPick.pointsLeft--;
  if (currentPick.pointsLeft > 0) {
    pendingChoices = pickUpgradeChoicesForPlayer(p, 3);
    upgradeFocus = 0;
    if (el.levelupSub) {
      el.levelupSub.textContent = '點' + currentPick.pointsLeft;
    }
    renderUpgradeCards(p);
    return;
  }
  pickQueue.shift();
  openNextPick();
}

// 目標：Lv5≈1:00、Lv10≈2:30、Lv15≈4:00
function xpNeed(level) {
  return Math.floor(XP_BASE * Math.pow(XP_GROW, level - 1));
}
