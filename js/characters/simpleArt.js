/**
 * Compact ArtChars registrar — idle+walk for down/side only (other dirs fall back).
 * New roster chars call ArtChars.registerSimple(...)
 */
(function (global) {
  'use strict';

  function cloneRows(rows) { return rows.map((r) => r); }

  /** Shift last 3 rows horizontally for a cheap walk bob */
  function footShift(rows, dx) {
    const out = rows.map((r) => r);
    const h = out.length;
    for (let i = Math.max(0, h - 3); i < h; i++) {
      const s = out[i];
      if (dx > 0) out[i] = s.slice(dx) + '.'.repeat(Math.min(dx, s.length));
      else if (dx < 0) {
        const n = -dx;
        out[i] = '.'.repeat(Math.min(n, s.length)) + s.slice(0, Math.max(0, s.length - n));
      }
      if (out[i].length < s.length) out[i] = out[i] + '.'.repeat(s.length - out[i].length);
      if (out[i].length > s.length) out[i] = out[i].slice(0, s.length);
    }
    return out;
  }

  function packDir(idle) {
    return {
      idle: cloneRows(idle),
      w1: footShift(idle, -1),
      w2: cloneRows(idle),
      w3: footShift(idle, 1),
    };
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
    const drawName = 'draw' + id.charAt(0).toUpperCase() + id.slice(1);
    // grandpa -> drawGrandpa; dog -> drawDog
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
