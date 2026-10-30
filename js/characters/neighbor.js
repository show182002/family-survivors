/** 鄰居 — gossip + slipper chibi (stable frames, feet bob only) */
(function (global) {
  'use strict';
  const PAL = {
    K: '#1a120c', H: '#6a4030', P: '#4a2818',
    S: '#f0c8a8', D: '#e0a878', W: '#fff8f0', E: '#2a2018',
    B: '#fb923c', N: '#c2410c', A: '#fed7aa', T: '#fef3c7',
  };
  const downIdle = [
    '......HHHH......',
    '.....HHHHHH.....',
    '....HHSSSSHH....',
    '...HSSWWSSWWH...',
    '...HSSWESSEWH...',
    '...HSSSSSSSSH...',
    '....HSSDDSSH....',
    '.....HSSSSH.....',
    '.....HBBBBBH....',
    '....HBAAAAABH...',
    '....HBATATABH...',
    '....HBAAAAABH...',
    '.....HBBBBH.....',
    '.....HN..NH.....',
    '.....HK..KH.....',
    '................',
  ];
  // feet bob only — body rows unchanged
  const downW1 = downIdle.slice();
  downW1[13] = '....HN...NH.....';
  downW1[14] = '....HK..........';
  const downW3 = downIdle.slice();
  downW3[13] = '.....HN...NH....';
  downW3[14] = '..........KH....';

  const sideIdle = [
    '......HHHH......',
    '.....HHHHHH.....',
    '....HHSSSSSH....',
    '...HSSSWWESSH...',
    '...HSSSSESSSH...',
    '...HSSSSSSSSH...',
    '....HSSDDSSH....',
    '.....HSSSSH.....',
    '.....HBBBBBH....',
    '....HBAAAAAH....',
    '....HBATATAH....',
    '....HBAAAAAH....',
    '.....HBBBBH.....',
    '......HN.H......',
    '......HK.K......',
    '................',
  ];
  const sideW1 = sideIdle.slice();
  sideW1[13] = '.....HN.H.......';
  sideW1[14] = '.....HK.........';
  const sideW3 = sideIdle.slice();
  sideW3[13] = '.......HN.H.....';
  sideW3[14] = '.........K......';

  function pack(idle, w1, w3) {
    return { idle: idle.slice(), w1: w1.slice(), w2: idle.slice(), w3: w3.slice() };
  }

  function boot() {
    if (!global.ArtSprite || !global.ArtSprite.drawAnimAt) return;
    global.ArtChars = global.ArtChars || {};
    const PAL2 = Object.assign({}, PAL); PAL2._id = 'neighbor';
    const FRAMES = {
      down: pack(downIdle, downW1, downW3),
      side: pack(sideIdle, sideW1, sideW3),
    };
    FRAMES.up = FRAMES.down; FRAMES.ddr = FRAMES.side; FRAMES.dur = FRAMES.down;
    const scale = 3.05;
    function draw(g, sx, sy, state, sc) {
      global.ArtSprite.assertFrames(FRAMES);
      global.ArtSprite.drawAnimAt(g, FRAMES, PAL2, sx, sy, state, sc == null ? scale : sc);
    }
    global.ArtChars.drawNeighbor = draw;
    global.ArtChars.NEIGHBOR_SCALE = scale;
    global.ArtChars._simple = global.ArtChars._simple || {};
    global.ArtChars._simple.neighbor = { draw, scale, FRAMES, PAL: PAL2 };
  }
  boot();
})(window);
