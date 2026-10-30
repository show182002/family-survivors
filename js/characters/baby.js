/** 寶寶 — tiny cute baby chibi */
(function (global) {
  'use strict';
  const PAL = {
    K: '#1a120c', H: '#f0e0a8', P: '#e8d090',
    S: '#f5d0b0', D: '#e0a878', W: '#fff8f0', E: '#2a2018',
    B: '#88ddff', N: '#60b0e0', R: '#ff8899', A: '#ffe0ee',
  };
  const down = [
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
  const side = [
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
  function boot() {
    if (!global.ArtChars || !global.ArtChars.registerSimple) return;
    global.ArtChars.registerSimple('baby', { PAL, scale: 2.4, down, side });
  }
  boot();
})(window);
