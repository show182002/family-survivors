/** 金魚 — bowl pet fish chibi */
(function (global) {
  'use strict';
  const PAL = {
    K: '#1a120c', H: '#ea580c', P: '#c2410c',
    S: '#fb923c', D: '#f97316', W: '#fff8f0', E: '#2a2018',
    B: '#7dd3fc', N: '#38bdf8', A: '#e0f2fe', R: '#fda4af',
  };
  // facing "down" = toward camera (round fish body)
  const down = [
    '................',
    '......HHHH......',
    '.....HSSSSSH....',
    '....HSSWWSSSH...',
    '....HSSWESSSH...',
    '....HSSSRSSSH...',
    '.....HSSSSSH....',
    '......HSSSH.....',
    '.....HBHBHBH....',
    '....HBAAAAABH...',
    '....HBAANAABH...',
    '....HBAAAAABH...',
    '.....HBBBBH.....',
    '......H..H......',
    '................',
    '................',
  ];
  const side = [
    '................',
    '....HH..........',
    '...HSSHH........',
    '..HSSWESSH.H....',
    '..HSSSESSHHSH...',
    '..HSSSRSSSSSH...',
    '...HSSSSSSSH....',
    '....HSSSSSH.....',
    '....HBAAAABH....',
    '...HBAAAAAABH...',
    '...HBAANAAABH...',
    '....HBAAAAAH....',
    '.....HBBBBH.....',
    '......H..H......',
    '................',
    '................',
  ];
  function boot() {
    if (!global.ArtChars || !global.ArtChars.registerSimple) return;
    global.ArtChars.registerSimple('goldfish', { PAL, scale: 2.6, down, side });
  }
  boot();
})(window);
