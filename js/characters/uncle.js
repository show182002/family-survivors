/** 叔叔 — fireworks / firecracker uncle chibi */
(function (global) {
  'use strict';
  const PAL = {
    K: '#1a120c', H: '#3a2818', P: '#2a1a10',
    S: '#e8b888', D: '#c88858', W: '#fff8f0', E: '#2a2018',
    B: '#dc2626', N: '#991b1b', A: '#fef2f2', Y: '#fbbf24',
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
    '.....HBBBBBH....',
    '....HBAAAAABH...',
    '....HBAYAYABH...',
    '....HBAAAAABH...',
    '.....HBBBBH.....',
    '.....HN..NH.....',
    '.....HK..KH.....',
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
    '.....HBBBBBH....',
    '....HBAAAAAH....',
    '....HBAYAAAH....',
    '....HBAAAAAH....',
    '.....HBBBBH.....',
    '......HN.H......',
    '......HK.K......',
    '................',
  ];
  function boot() {
    if (!global.ArtChars || !global.ArtChars.registerSimple) return;
    global.ArtChars.registerSimple('uncle', { PAL, scale: 3.1, down, side });
  }
  boot();
})(window);
