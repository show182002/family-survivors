/**
 * Compact ArtChars registrar — idle+walk for down/side.
 * Walk frames = same idle (ArtSprite.drawAnimAt already bobs); avoids footShift glitches.
 */
(function (global) {
  'use strict';

  function cloneRows(rows) { return rows.map((r) => r); }

  function packDir(idle) {
    const base = cloneRows(idle);
    return { idle: base, w1: cloneRows(idle), w2: cloneRows(idle), w3: cloneRows(idle) };
  }

  function registerSimple(id, opts) {
    opts = opts || {};
    const PAL = Object.assign({}, opts.PAL || {});
    PAL._id = id;
    const scale = opts.scale || 3;
    const down = packDir(opts.down);
    const side = opts.side ? packDir(opts.side) : down;
    const up = opts.up ? packDir(opts.up) : down;
    const FRAMES = { down, side, up, ddr: side, dur: up };

    function draw(g, sx, sy, state, sc) {
      if (!global.ArtSprite || !global.ArtSprite.drawAnimAt) return;
      global.ArtSprite.assertFrames(FRAMES);
      global.ArtSprite.drawAnimAt(g, FRAMES, PAL, sx, sy, state, sc == null ? scale : sc);
    }

    global.ArtChars = global.ArtChars || {};
    const pretty = id.replace(/(^|_)([a-z])/g, (_, __, c) => c.toUpperCase());
    global.ArtChars['draw' + pretty] = draw;
    global.ArtChars[id.toUpperCase() + '_SCALE'] = scale;
    global.ArtChars._simple = global.ArtChars._simple || {};
    global.ArtChars._simple[id] = { draw, scale, FRAMES, PAL };
    return draw;
  }

  global.ArtChars = global.ArtChars || {};
  global.ArtChars.registerSimple = registerSimple;
})(window);
