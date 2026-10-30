/** 鄰居 — gossip + slipper chibi */
(function (global) {
  'use strict';
  const PAL = {
    K: '#1a120c', H: '#6a4030', P: '#4a2818',
    S: '#f0c8a8', D: '#e0a878', W: '#fff8f0', E: '#2a2018',
    B: '#fb923c', N: '#c2410c', A: '#fed7aa', T: '#fef3c7',
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
    '....HBATATABH...',
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
    '....HBATATAH....',
    '....HBAAAAAH....',
    '.....HBBBBH.....',
    '......HN.H......',
    '......HK.K......',
    '................',
  ];
  function boot() {
    if (!global.ArtChars || !global.ArtChars.registerSimple) return;
    global.ArtChars.registerSimple('neighbor', { PAL, scale: 3.05, down, side });
  }
  boot();
})(window);
