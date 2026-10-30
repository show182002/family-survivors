/** 寶寶 — tiny cute baby chibi (crawl bob, no body jump) */
(function (global) {
  'use strict';
  const PAL = {
    K: '#1a120c', H: '#f0e0a8', P: '#e8d090',
    S: '#f5d0b0', D: '#e0a878', W: '#fff8f0', E: '#2a2018',
    B: '#88ddff', N: '#60b0e0', R: '#ff8899', A: '#ffe0ee',
  };
  const downIdle = [
    '................',
    '......HHHH......',
    '.....HSSSSH.....',
    '....HSSWWSSH....',
    '....HSSWESSH....',
    '....HSSRRSSH....',
    '.....HSSSSH.....',
    '......HSSH......',
    '.....HAAAHA.....',
    '....HABBBBAH....',
    '....HABNNBAH....',
    '.....HABBAH.....',
    '......H..H......',
    '......K..K......',
    '................',
    '................',
  ];
  // crawl: alternate feet only (last 2 solid rows)
  const downW1 = downIdle.slice();
  downW1[12] = '.....H...H......';
  downW1[13] = '.....K..........';
  const downW3 = downIdle.slice();
  downW3[12] = '......H...H.....';
  downW3[13] = '..........K.....';

  const sideIdle = [
    '................',
    '......HHHH......',
    '.....HSSSSH.....',
    '....HSSSWESH....',
    '....HSSSESSH....',
    '....HSSRSSH.....',
    '.....HSSSSH.....',
    '......HSSH......',
    '.....HAAAH......',
    '....HABBBAH.....',
    '....HABNNBH.....',
    '.....HABBAH.....',
    '......H.H.......',
    '......K.K.......',
    '................',
    '................',
  ];
  const sideW1 = sideIdle.slice();
  sideW1[12] = '.....H.H........';
  sideW1[13] = '.....K..........';
  const sideW3 = sideIdle.slice();
  sideW3[12] = '.......H.H......';
  sideW3[13] = '..........K.....';

  function pack(idle, w1, w3) {
    return { idle: idle.slice(), w1: w1.slice(), w2: idle.slice(), w3: w3.slice() };
  }

  function boot() {
    if (!global.ArtSprite || !global.ArtSprite.drawAnimAt) return;
    global.ArtChars = global.ArtChars || {};
    const PAL2 = Object.assign({}, PAL); PAL2._id = 'baby';
    const FRAMES = {
      down: pack(downIdle, downW1, downW3),
      side: pack(sideIdle, sideW1, sideW3),
    };
    FRAMES.up = FRAMES.down; FRAMES.ddr = FRAMES.side; FRAMES.dur = FRAMES.down;
    const scale = 2.5;
    function draw(g, sx, sy, state, sc) {
      global.ArtSprite.assertFrames(FRAMES);
      global.ArtSprite.drawAnimAt(g, FRAMES, PAL2, sx, sy, state, sc == null ? scale : sc);
    }
    global.ArtChars.drawBaby = draw;
    global.ArtChars.BABY_SCALE = scale;
    global.ArtChars._simple = global.ArtChars._simple || {};
    global.ArtChars._simple.baby = { draw, scale, FRAMES, PAL: PAL2 };
  }
  boot();
})(window);
