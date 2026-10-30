/** 阿公 — cane elder chibi (stable frames, cane bob only) */
(function (global) {
  'use strict';
  const PAL = {
    K: '#1a120c', H: '#c8c8d0', P: '#909098',
    S: '#e8c098', D: '#c88858', W: '#fff8f0', E: '#2a2018',
    B: '#3a5a88', N: '#2a4068', A: '#d0a060', C: '#886040',
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
    '.....HBBBBH.....',
    '....HBNNNNBH....',
    '....HBNNNNBH....',
    '.....HBBBBH.....',
    '.....HN..NH.....',
    '.....HK..KH.....',
    '............A...',
    '...........ACC..',
    '..........AC....',
    '................',
  ];
  // cane tip bob only (rows 14-16)
  const downW1 = downIdle.slice(); downW1[14]='...........A....'; downW1[15]='..........ACC...'; downW1[16]='.........AC.....';
  const downW3 = downIdle.slice(); downW3[14]='.............A..'; downW3[15]='............ACC.'; downW3[16]='...........AC...';
  const sideIdle = [
    '......HHHH......',
    '.....HHHHHH.....',
    '....HHSSSSSH....',
    '...HSSSWWESSH...',
    '...HSSSSESSSH...',
    '...HSSSSSSSSH...',
    '....HSSDDSSH....',
    '.....HSSSSH.....',
    '.....HBBBBH.....',
    '....HBNNNNH.....',
    '....HBNNNNH.....',
    '.....HBBBBH.....',
    '......HN.H......',
    '......HK.K......',
    '........A.......',
    '.......ACC......',
    '......AC........',
    '................',
  ];
  const sideW1 = sideIdle.slice(); sideW1[14]='.......A........'; sideW1[15]='......ACC.......'; sideW1[16]='.....AC.........';
  const sideW3 = sideIdle.slice(); sideW3[14]='.........A......'; sideW3[15]='........ACC.....'; sideW3[16]='.......AC.......';

  function pack(idle, w1, w3) {
    return { idle: idle.slice(), w1: w1.slice(), w2: idle.slice(), w3: w3.slice() };
  }

  function boot() {
    if (!global.ArtSprite || !global.ArtSprite.drawAnimAt) return;
    global.ArtChars = global.ArtChars || {};
    const PAL2 = Object.assign({}, PAL); PAL2._id = 'grandpa';
    const FRAMES = {
      down: pack(downIdle, downW1, downW3),
      side: pack(sideIdle, sideW1, sideW3),
    };
    FRAMES.up = FRAMES.down; FRAMES.ddr = FRAMES.side; FRAMES.dur = FRAMES.down;
    const scale = 3.2;
    function draw(g, sx, sy, state, sc) {
      global.ArtSprite.assertFrames(FRAMES);
      global.ArtSprite.drawAnimAt(g, FRAMES, PAL2, sx, sy, state, sc == null ? scale : sc);
    }
    global.ArtChars = global.ArtChars || {};
    global.ArtChars.drawGrandpa = draw;
    global.ArtChars.GRANDPA_SCALE = scale;
    global.ArtChars._simple = global.ArtChars._simple || {};
    global.ArtChars._simple.grandpa = { draw, scale, FRAMES, PAL: PAL2 };
  }
  boot();
})(window);
