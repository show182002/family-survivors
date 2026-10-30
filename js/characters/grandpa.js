/** 爺爺 — cane elder chibi */
(function (global) {
  'use strict';
  const PAL = {
    K: '#1a120c', H: '#c8c8d0', P: '#909098',
    S: '#e8c098', D: '#c88858', W: '#fff8f0', E: '#2a2018',
    B: '#3a5a88', N: '#2a4068', A: '#d0a060', C: '#886040',
  };
  const down = [
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
  const side = [
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
  function boot() {
    if (!global.ArtChars || !global.ArtChars.registerSimple) return;
    global.ArtChars.registerSimple('grandpa', { PAL, scale: 3.2, down, side });
  }
  boot();
  global.addEventListener && global.addEventListener('DOMContentLoaded', boot);
})(window);
