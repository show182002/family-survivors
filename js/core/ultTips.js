/** v0.02226 · 大招就緒／爸爸掟人提示（一次即清，唔 spam） */
'use strict';

function isTouchPlay() {
  try {
    if (typeof prefs !== 'undefined' && prefs && prefs.inputModality === 'touch') return true;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
  } catch (e) {}
  return false;
}

function slotLabel(p) {
  return p.slot === 0 ? '1P' : (p.slot === 1 ? '2P' : ('P' + (p.slot + 1)));
}

function ultKeyHint(p) {
  if (isTouchPlay()) return '撳螢幕「招」掣';
  return p.slot === 0 ? '按 H' : '按 Num0';
}

/** Exact copy:「1P 可以按 H 去掟人了」／「2P 可以按 Num0…」；touch 加螢幕招掣 */
function dadThrowTipText(p) {
  const who = slotLabel(p);
  if (isTouchPlay()) return who + ' 可以撳螢幕「招」掣去掟人了';
  if (p.slot === 0) return '1P 可以按 H 去掟人了';
  if (p.slot === 1) return '2P 可以按 Num0 去掟人了';
  return who + ' 可以按大招掣去掟人了';
}

/** 大招由 CD→就緒：彈一次 */
function noteUltReady(p) {
  if (!p || p.dead || p.ai || p.caged || p.carriedBy || p.ball) return;
  // 爸爸膊頭馬托住人時： throw tip 處理，唔重複大招提示
  if (p.charId === 'dad' && p.branch && p.branch[0] === '2.1' && p.carry) return;
  const who = slotLabel(p);
  const msg = who + ' ' + (p.name || '') + ' 大招好咗！' + ultKeyHint(p);
  if (typeof banner === 'function') banner(msg, p.color || '#ffe566', 2.2);
  addFloat(p.x, p.y - 100, '大招！', '#ffe566', true);
  p._ultReadyFlash = 1.2;
}

/** 爸爸托起之後：只提示一次（掟出／放手後先重置） */
function noteDadThrowReady(p) {
  if (!p || p.dead || p.ai) return;
  if (p._throwTipShown) return;
  const msg = dadThrowTipText(p);
  if (typeof banner === 'function') banner(msg, '#ffe566', 2.8);
  addFloat(p.x, p.y - 110, '可掟！', '#ffe566', true);
  p._throwTipShown = true;
}

function updateUltTips(dt) {
  if (!run) return;
  for (const p of run.players) {
    if (p.dead) continue;
    if (p._ultReadyFlash > 0) p._ultReadyFlash -= dt;

    const prev = p._ultCdPrev;
    const now = p.ultCd;
    // 檢測跨越到就緒 → 只彈一次
    if (prev != null && prev > 0 && now <= 0) {
      noteUltReady(p);
    }
    p._ultCdPrev = now;

    // 爸爸托住：首次提示一次
    if (p.charId === 'dad' && p.branch && p.branch[0] === '2.1' && p.carry && !p.ai) {
      if (!p._throwTipShown) noteDadThrowReady(p);
    } else if (!p.carry) {
      p._throwTipShown = false;
    }
  }
}
