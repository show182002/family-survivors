/**
 * 原創 chibi pixel sprites（大頭細身、粗黑邊）
 * 風格參考：小 Q 版像素，NOT 任何現有 IP 角色
 * 每格為字串陣列：. 透明  # 黑邊  其餘字母對應 palette
 */
const SPRITE_PAL = {
  // shared
  K: '#0a0a0a', // outline
  W: '#fff8f0',
  // dad skin / clothes
  S: '#e8b888',
  D: '#c88858',
  B: '#2a5acc',
  N: '#1a3a88',
  H: '#3a2818',
  // mom
  M: '#f0c0a0',
  P: '#e84898',
  Q: '#b02868',
  R: '#ffe0f0',
  // daughter
  G: '#f5c8a0',
  T: '#38c070',
  U: '#1a8848',
  Y: '#ffe866',
  // grandpa sweater
  // (Y already gold)
  // dog fur uses D (tan)
  // baby bib uses R pink
  // brother hoodie — reuse X purple / Y accent
  // enemies
  E: '#6a3040',
  F: '#c05060',
  V: '#40c070',
  X: '#8848c0',
  Z: '#e8e040',
};

const SPRITES = {
  dad: [
    '....KKKK....',
    '...KHHHK...',
    '..KHSSHKK..',
    '..KSSSSSK..',
    '..KSDSDSK..',
    '..KSSSSSK..',
    '...KSSSK...',
    '...KBBBK...',
    '..KBNNBNK..',
    '..KBNNNBK..',
    '...KBBBK...',
    '...KN.NK...',
    '...KK.KK...',
  ],
  mom: [
    '.....KKKK.....',
    '....KHHHHK....',
    '...KHHHHHHK...',
    '..KHMMMMMMHK..',
    '..KHMWMMWMHK..',
    '..KHMMMMMMHK..',
    '...KHMMMMHK...',
    '....KPPPPK....',
    '...KPWRRWPK...',
    '...KPWWWWPK...',
    '...KPQQQQPK...',
    '....KPPPPK....',
    '....KQ..QK....',
    '....KK..KK....',
  ],
  daughter: [
    '..K..K..K..',
    '.KPPKPPKPK.',
    'KPYYYYYYYPK',
    'KYGGGGGGGYK',
    'KYGWGGWGGYK',
    'KYGGEGEGGYK',
    'KYGGRRGGGYK',
    '.KYGGGGGK..',
    '..KTTTTK...',
    '.KTUUUUTK..',
    '.KTUUUUTK..',
    '..KTTTTK...',
    '..KU..UK...',
    '..KK..KK...',
  ],
  grandpa: [
    '....KKKK....',
    '...KHHHHK...',
    '..KHSSSHHK..',
    '..KSWSSWSK..',
    '..KSSSSSSK..',
    '...KSSSSK...',
    '..KWWWWWWK..',
    '.KWYYYYYWK.',
    '.KWYYYYYWK.',
    '..KWWWWWK...',
    '...KH.HK...',
    '...KK.KK...',
  ],
  dog: [
    '..K....K..',
    '.KHK..KHK.',
    'KHSSKKSSHK',
    'KSWSSSSWSK',
    'KSSSESSSSK',
    '.KSSSSSSK.',
    '..KDDDDK..',
    '.KDDDDDDK.',
    '.KDDDDDDK.',
    '..KDDDDK..',
    '..KD..DK..',
    '..KK..KK..',
  ],
  baby: [
    '...KKKK...',
    '..KYYYYK..',
    '.KYGGGGYK.',
    '.KYGWGWYK.',
    '.KYGGGGYK.',
    '..KYRRYK..',
    '...KWWK...',
    '..KWWWWK..',
    '..KWRRWK..',
    '...KWWK...',
    '...KW.WK..',
    '...KK.KK..',
  ],
  brother: [
    '....KKKK....',
    '...KHHHHK...',
    '..KHSSSSHK..',
    '..KSWSSWSK..',
    '..KSSSSSSK..',
    '...KSSSK...',
    '...KXXXXK...',
    '..KXYYYYXK..',
    '..KXYXXYXK..',
    '...KXXXXK...',
    '...KX.XK...',
    '...KK.KK...',
  ],
  // 小怪：史萊姆
  slime: [
    '..KKKK..',
    '.KVVVVK.',
    'KVWWVVVK',
    'KVVVVVVK',
    'KVVVVVVK',
    '.KVVVK..',
    '.KK..KK.',
  ],
  // 蝙蝠
  bat: [
    'K..KK..K',
    'KKKXXKKK',
    '.KXWWXK.',
    '.KXXXXK.',
    '..KXXK..',
    '...KK...',
  ],
  // 幽靈
  ghost: [
    '..KKKK..',
    '.KWWWWK.',
    'KWKWKWWK',
    'KWWWWWWK',
    'KWWWWWWK',
    'KWKWKWK.',
    '.K.K.K..',
  ],
  // boss-ish
  brute: [
    '...KKKKKK...',
    '..KFFFFFFK..',
    '.KFFWFFWFFK.',
    '.KFFFFFFFFK.',
    '.KFFEFEFFK.',
    '..KFFFFFFK..',
    '...KFFFFK...',
    '..KFEEEEFK..',
    '..KFEEEEFK..',
    '...KFFFFK...',
    '...KF.FK...',
    '...KK.KK...',
  ],
};

const _cache = {};

function spriteToCanvas(key, scale = 3) {
  const cacheKey = key + '@' + scale;
  if (_cache[cacheKey]) return _cache[cacheKey];
  const rows = SPRITES[key];
  if (!rows) return null;
  const w = rows[0].length;
  const h = rows.length;
  const c = document.createElement('canvas');
  c.width = w * scale;
  c.height = h * scale;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (!ch || ch === '.') continue;
      let col;
      if (ch === 'K') col = SPRITE_PAL.K;
      else col = SPRITE_PAL[ch] || '#ff00ff';
      ctx.fillStyle = col;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  _cache[cacheKey] = c;
  return c;
}

function drawSprite(ctx, key, x, y, scale = 3, flipX = false) {
  const img = spriteToCanvas(key, scale);
  if (!img) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (flipX) {
    ctx.translate(x + img.width / 2, y - img.height / 2);
    ctx.scale(-1, 1);
    ctx.drawImage(img, -img.width / 2, 0);
  } else {
    ctx.drawImage(img, x - img.width / 2, y - img.height);
  }
  ctx.restore();
}

function spriteHeight(key, scale = 3) {
  const rows = SPRITES[key];
  return rows ? rows.length * scale : 24;
}
