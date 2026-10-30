/** 一家倖存 · 自製 BGM／SE（Web Audio 程序音，無版權素材）v0.02207 */
'use strict';

const MUTE_KEY = 'family-survivors-mute';
let audioCtx = null;
let masterGain = null;
let audioMuted = false;
try { audioMuted = localStorage.getItem(MUTE_KEY) === '1'; } catch (_) {}
let bgmTimer = null;
let bgmStep = 0;
let audioReady = false;
let lastHitSfx = 0;
let lastKillSfx = 0;
let lastXpSfx = 0;

function ensureAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) {
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = audioMuted ? 0 : 0.55;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function unlockAudio() {
  const ctx = ensureAudio();
  if (!ctx) return;
  audioReady = true;
  // 靜音短脈衝解鎖 iOS
  try {
    const b = ctx.createBuffer(1, 1, 22050);
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.connect(masterGain || ctx.destination);
    s.start(0);
  } catch (_) {}
  if (!audioMuted) startBgm();
  if (typeof refreshMuteButton === 'function') refreshMuteButton();
}

function isMuted() { return !!audioMuted; }

function setMuted(m) {
  audioMuted = !!m;
  try { localStorage.setItem(MUTE_KEY, audioMuted ? '1' : '0'); } catch (_) {}
  const ctx = ensureAudio();
  if (masterGain && ctx) {
    const now = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(audioMuted ? 0 : 0.55, now, 0.05);
  }
  if (audioMuted) stopBgm();
  else if (audioReady) startBgm();
  if (typeof refreshMuteButton === 'function') refreshMuteButton();
}

function toggleMute() { setMuted(!audioMuted); }

function envGain(g, t0, a, s, r, peak) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + a);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * 0.55), t0 + a + s);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + s + r);
}

function beep(freq, dur, type, peak, when) {
  const ctx = ensureAudio();
  if (!ctx || !masterGain || audioMuted) return;
  const t0 = when != null ? when : ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  envGain(g, t0, 0.01, Math.max(0.02, dur * 0.45), Math.max(0.04, dur * 0.5), peak || 0.12);
  o.connect(g); g.connect(masterGain);
  o.start(t0);
  o.stop(t0 + dur + 0.08);
}

function noiseBurst(dur, peak, when, band) {
  const ctx = ensureAudio();
  if (!ctx || !masterGain || audioMuted) return;
  const t0 = when != null ? when : ctx.currentTime;
  const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  envGain(g, t0, 0.005, dur * 0.25, dur * 0.7, peak || 0.08);
  if (band) {
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = band;
    f.Q.value = 1.2;
    src.connect(f); f.connect(g);
  } else {
    src.connect(g);
  }
  g.connect(masterGain);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

function sfxHit() {
  const now = performance.now();
  if (now - lastHitSfx < 45) return;
  lastHitSfx = now;
  const ctx = ensureAudio();
  if (!ctx || audioMuted) return;
  const f = 420 + Math.random() * 180;
  beep(f, 0.05, 'square', 0.05);
  noiseBurst(0.04, 0.035, null, 900);
}

function sfxKill() {
  const now = performance.now();
  if (now - lastKillSfx < 55) return;
  lastKillSfx = now;
  const ctx = ensureAudio();
  if (!ctx || audioMuted) return;
  const t0 = ctx.currentTime;
  beep(320, 0.07, 'triangle', 0.07, t0);
  beep(180, 0.11, 'sawtooth', 0.045, t0 + 0.04);
  noiseBurst(0.08, 0.05, t0, 500);
}

function sfxXp() {
  const now = performance.now();
  if (now - lastXpSfx < 70) return;
  lastXpSfx = now;
  beep(880 + Math.random() * 120, 0.045, 'sine', 0.035);
}

function sfxLevel() {
  const ctx = ensureAudio();
  if (!ctx || audioMuted) return;
  const t0 = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => beep(f, 0.14, 'triangle', 0.09, t0 + i * 0.08));
}

function sfxUlt() {
  const ctx = ensureAudio();
  if (!ctx || audioMuted) return;
  const t0 = ctx.currentTime;
  noiseBurst(0.28, 0.12, t0, 280);
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(90, t0);
  o.frequency.exponentialRampToValueAtTime(40, t0 + 0.35);
  envGain(g, t0, 0.02, 0.12, 0.25, 0.14);
  o.connect(g); g.connect(masterGain);
  o.start(t0); o.stop(t0 + 0.4);
  beep(660, 0.12, 'square', 0.06, t0 + 0.05);
  beep(990, 0.1, 'square', 0.045, t0 + 0.12);
}

function stopBgm() {
  if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
}

function startBgm() {
  if (audioMuted) return;
  const ctx = ensureAudio();
  if (!ctx || !masterGain) return;
  if (bgmTimer) return;
  // 輕柔循環：低 pad + 稀疏琶音（約 92 BPM）
  const beat = 60000 / 92;
  bgmStep = 0;
  const root = [130.81, 164.81, 196.0, 246.94]; // C3 E3 G3 B3
  const high = [523.25, 659.25, 783.99, 987.77];
  bgmTimer = setInterval(() => {
    if (audioMuted || !audioCtx) return;
    if (audioCtx.state === 'suspended') return;
    const t0 = audioCtx.currentTime + 0.02;
    const i = bgmStep % 8;
    const bass = root[i % 4];
    beep(bass, 0.42, 'sine', 0.045, t0);
    if (i % 2 === 0) beep(bass * 2, 0.35, 'triangle', 0.022, t0 + 0.02);
    if (i === 0 || i === 4) beep(high[(bgmStep >> 1) % 4], 0.18, 'sine', 0.028, t0 + 0.08);
    if (i === 3 || i === 7) noiseBurst(0.05, 0.012, t0, 2200);
    bgmStep++;
  }, beat / 2);
}

(function bindAudioUnlock() {
  const once = () => {
    unlockAudio();
  };
  window.addEventListener('pointerdown', once, { passive: true });
  window.addEventListener('keydown', once, { passive: true });
  window.addEventListener('touchstart', once, { passive: true });
})();
