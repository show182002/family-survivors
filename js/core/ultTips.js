/** v0.02221 · 大招就緒／爸爸掟人提示（唔洗每 frame spam） */
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
  if (isTouchPlay()) return '撳「招」掣';
  return p.slot === 0 ? '撳 H' : '撳 Num0';
}

function throwKeyHint(p) {
  if (isTouchPlay()) return '撳「招」掣去掟人';
  return p.slot === 0 ? '撳 H 去掟人' : '撳 Num0 去掟人';
}

/** 大招由 CD→就緒：彈一次 */
function noteUltReady(p) {
  if (!p || p.dead || p.ai || p.caged || p.carriedBy || p.ball) return;
  // 爸爸膊頭馬托住人時： downstream throw tip 處理
  if (p.charId === 'dad' && p.branch && p.branch[0] === '2.1' && p.carry) return;
  const who = slotLabel(p);
  const msg = who + ' ' + (p.name || '') + ' 大招好咗！' + ultKeyHint(p);
  if (typeof banner === 'function') banner(msg, p.color || '#ffe566', 2.2);
  addFloat(p.x, p.y - 100, '大招！', '#ffe566', true);
  p._ultReadyFlash = 1.2;
}

/** 爸爸托起之後：提醒可以掟 */
function noteDadThrowReady(p) {
  if (!p || p.dead || p.ai) return;
  const who = slotLabel(p);
  const msg = who + ' 可以' + throwKeyHint(p) + '了';
  if (typeof banner === 'function') banner(msg, '#ffe566', 2.6);
  addFloat(p.x, p.y - 110, '可掟！', '#ffe566', true);
  p._throwTipShown = true;
  p._throwTipT = 8; // 之後先至可以再溫柔提醒
}

function updateUltTips(dt) {
  if (!run) return;
  for (const p of run.players) {
    if (p.dead) continue;
    if (p._ultReadyFlash > 0) p._ultReadyFlash -= dt;
    if (p._throwTipT > 0) p._throwTipT -= dt;

    const prev = p._ultCdPrev;
    const now = p.ultCd;
    // 檢測跨越到就緒
    if (prev != null && prev > 0 && now <= 0) {
      noteUltReady(p);
    }
    p._ultCdPrev = now;

    // 爸爸托住：首次提示；之後每隔一段再輕提一次（唔 spam）
    if (p.charId === 'dad' && p.branch && p.branch[0] === '2.1' && p.carry && !p.ai) {
      if (!p._throwTipShown) noteDadThrowReady(p);
      else if (p._throwTipT <= 0) {
        addFloat(p.x, p.y - 95, throwKeyHint(p), '#ffe566', false);
        p._throwTipT = 10;
      }
    } else if (!p.carry) {
      p._throwTipShown = false;
    }
  }
}
