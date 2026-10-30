/** 一家倖存 · 玩家／一局 run 狀態、開局、暫停 */
'use strict';

// ——— Run ———
let run = null;
let lastTs = 0;
let animId = 0;
let upgradeFocus = 0;
let pendingChoices = [];
let levelupQueue = 0; // shared levels waiting
let pickQueue = []; // { slot, pointsLeft }
let currentPick = null;
let screenShake = 0;

function makePlayer(charId, slot) {
  const c = getChar(charId);
  const cx = MAP_W / 2 + (slot === 0 ? -40 : 40);
  const cy = MAP_H / 2;
  const p = {
    slot,
    charId,
    name: c.name,
    sprite: c.sprite,
    color: c.color,
    x: cx,
    y: cy,
    facing: 1,
    hp: c.maxHp,
    maxHp: c.maxHp,
    speed: c.speed,
    pickupRadius: c.pickupRadius,
    dead: false,
    invuln: 0,
    shield: 0,
    tAura: 0,
    tSlam: 0,
    tCalm: 0,
    tRage: 0,
    tShot: 0,
    tFireAura: 0,
    ultCd: 0,
    ultMax: c.ult.cooldown,
    flash: 0,
    baseTags: (c.baseTags || []).slice(),
    skills: [],
    skillMods: emptySkillMods(),
    tagEffects: {},
    activeRules: [],
    actT: {},
    orbitAng: 0,
    orbitTick: 0,
    branch: {},
    bt: {},
    bSpeed: 1,
    bDmg: 1,
    atkBuff: 0,
    hist: [],
    art: { dir: 'down', flipX: false, walkT: 0, moving: false },
  };
  const cp = charPref(charId);
  p.order = cp.order; // 共用同一 array → 暫停畫面改次序即生效
  p.auto = cp.auto;
  for (const sid of c.startSkills || []) p.skills.push(sid);
  rebuildPlayerPower(p);
  return p;
}

function startRun() {
  if (!pickP1) return;
  const players = [makePlayer(pickP1, 0)];
  if (pickP2) players.push(makePlayer(pickP2, 1));

  run = {
    players,
    enemies: [],
    gems: [],
    projectiles: [],
    fx: [],
    floats: [],
    cams: { x: MAP_W / 2 - STAGE_W / 2, y: MAP_H / 2 - STAGE_H / 2 },
    time: 0,
    kills: 0,
    xp: 0,
    level: 1,
    xpToNext: xpNeed(1),
    spawnAcc: 0,
    magnetPulse: 0,
    zones: [],
    summons: [],
    ebul: [],
    warns: [],
    banner: null,
    nextEvent: 25,
    eventIdx: 0,
    elite0Done: false,
    eliteDone: false,
    elite3Done: false,
    elite2Done: false,
    bossDone: false,
    tier: -1,
    structs: [],
    trails: [],
    minis: [],
    balls: [],
    trailTick: 0,
    branchQueue: [],
  };

  el.select.classList.add('hidden');
  el.game.classList.remove('hidden');
  el.end.classList.add('hidden');
  el.pause.classList.add('hidden');
  el.levelup.classList.add('hidden');
  el.hpP2.classList.toggle('hidden', players.length < 2);
  el.hpP1._main = null; el.hpP2._main = null;
  if (typeof rebuildTrees === 'function') rebuildTrees();
  buildAutoButtons();
  mode = 'play';
  if (typeof updateRotateGate === 'function') updateRotateGate();
  levelupQueue = 0;
  pickQueue = [];
  currentPick = null;
  screenShake = 0;
  fitCanvas();
  lastTs = 0;
  cancelAnimationFrame(animId);
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(frame);
}

function backToSelect() {
  mode = 'select';
  if (typeof updateRotateGate === 'function') updateRotateGate();
  cancelAnimationFrame(animId);
  el.game.classList.add('hidden');
  el.select.classList.remove('hidden');
  el.end.classList.add('hidden');
  el.pause.classList.add('hidden');
  el.levelup.classList.add('hidden');
  run = null;
}

function pauseGame() {
  if (mode !== 'play') return;
  mode = 'pause';
  if (typeof updateRotateGate === 'function') updateRotateGate();
  el.pause.classList.remove('hidden');
  refreshFxButtons();
  renderPausePlayers();
}
function resumeGame() {
  if (mode !== 'pause') return;
  mode = 'play';
  if (typeof updateRotateGate === 'function') updateRotateGate();
  el.pause.classList.add('hidden');
  lastTs = 0;
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(frame);
}
