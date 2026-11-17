export const PALETTE = {
  ".": "#000000",
  n: "#0B1030",
  N: "#1A2350",
  w: "#FFFFFF",
  s: "#B8CCEE",
  g: "#1E7A34",
  G: "#3FCB5A",
  d: "#0C3D1C",
  r: "#C81E28",
  R: "#FF5A5A",
  y: "#FFC830",
  Y: "#FFF0A0",
  o: "#FF8A1E",
  b: "#5A3418",
  B: "#A8642C",
  k: "#34343E",
  K: "#8A8A9A",
  c: "#4AC8FF",
  p: "#FF6AC8",
  m: "#8A4AFF"
};
export const PALETTE_KEYS = Object.keys(PALETTE);
export const XPM_COLORS = PALETTE_KEYS.map((k) => k + " c " + PALETTE[k]).join("\n");
export function createCanvas(w, h) {
  const px = new Array(w * h);
  for (let i = 0; i < px.length; i++) px[i] = ".";
  return {
    w,
    h,
    px
  };
}
export function fill(cv, c) {
  const px = cv.px;
  for (let i = 0; i < px.length; i++) px[i] = c;
}
export function set(cv, x, y, c) {
  if (x < 0 || y < 0 || x >= cv.w || y >= cv.h) return;
  cv.px[(y | 0) * cv.w + (x | 0)] = c;
}
export function rect(cv, x, y, w, h, c) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(cv, i, j, c);
}
export function disc(cv, cx, cy, r, c) {
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + r * 0.6) set(cv, cx + i, cy + j, c);
}
/** Draws rows of palette characters; spaces are transparent. */
export function sprite(cv, x, y, rows) {
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c !== " ") set(cv, x + i, y + j, c);
    }
  }
}
/** Copies a horizontal slice [x0, x1) of `src` onto `dst`, shifted by dx. */
export function blitSlice(dst, src, x0, x1, dx) {
  for (let y = 0; y < src.h; y++) for (let x = x0; x < x1; x++) set(dst, x + dx, y, src.px[y * src.w + x]);
}
/** The canvas as an XPM2 bitmap for an `xpmbitmap` display element. */
export function toXpm(cv) {
  const rows = [];
  for (let y = 0; y < cv.h; y++) rows.push(cv.px.slice(y * cv.w, (y + 1) * cv.w).join(""));
  return "! XPM2\n" + cv.w + " " + cv.h + " " + PALETTE_KEYS.length + " 1\n" + XPM_COLORS + "\n" + rows.join("\n");
}
export const GLYPHS = {
  0: "###|#.#|#.#|#.#|###",
  1: ".#.|##.|.#.|.#.|###",
  2: "###|..#|###|#..|###",
  3: "###|..#|.##|..#|###",
  4: "#.#|#.#|###|..#|..#",
  5: "###|#..|###|..#|###",
  6: "###|#..|###|#.#|###",
  7: "###|..#|..#|.#.|.#.",
  8: "###|#.#|###|#.#|###",
  9: "###|#.#|###|..#|###",
  A: ".#.|#.#|###|#.#|#.#",
  B: "##.|#.#|##.|#.#|##.",
  C: ".##|#..|#..|#..|.##",
  D: "##.|#.#|#.#|#.#|##.",
  E: "###|#..|##.|#..|###",
  F: "###|#..|##.|#..|#..",
  G: ".##|#..|#.#|#.#|.##",
  H: "#.#|#.#|###|#.#|#.#",
  I: "###|.#.|.#.|.#.|###",
  J: "..#|..#|..#|#.#|.#.",
  K: "#.#|#.#|##.|#.#|#.#",
  L: "#..|#..|#..|#..|###",
  M: "#...#|##.##|#.#.#|#...#|#...#",
  N: "#..#|##.#|#.##|#..#|#..#",
  O: ".#.|#.#|#.#|#.#|.#.",
  P: "##.|#.#|##.|#..|#..",
  Q: ".#.|#.#|#.#|##.|.##",
  R: "##.|#.#|##.|#.#|#.#",
  S: ".##|#..|.#.|..#|##.",
  T: "###|.#.|.#.|.#.|.#.",
  U: "#.#|#.#|#.#|#.#|###",
  V: "#.#|#.#|#.#|#.#|.#.",
  W: "#...#|#...#|#.#.#|##.##|#...#",
  X: "#.#|#.#|.#.|#.#|#.#",
  Y: "#.#|#.#|.#.|.#.|.#.",
  Z: "###|..#|.#.|#..|###",
  " ": "..|..|..|..|..",
  "!": "#|#|#|.|#",
  ".": ".|.|.|.|#",
  ":": ".|#|.|#|.",
  "-": "...|...|###|...|...",
  "?": "##.|..#|.#.|...|.#.",
  "/": "..#|..#|.#.|#..|#.."
};
export const FONT = {};
for (const ch in GLYPHS) FONT[ch] = GLYPHS[ch].split("|");
/** Width in pixels of `str` at `scale`. */
export function textWidth(str, scale = 1) {
  let w = 0;
  for (let i = 0; i < str.length; i++) {
    const g = FONT[str[i]] || FONT["?"];
    w += (g[0].length + 1) * scale;
  }
  return Math.max(0, w - scale);
}
/** Draws `str` with its top-left at (x, y). `color` may be a function of the letter index. */
export function text(cv, x, y, str, color, scale = 1) {
  let cx = x;
  for (let n = 0; n < str.length; n++) {
    const g = FONT[str[n]] || FONT["?"];
    const c = typeof color === "function" ? color(n) : color;
    for (let j = 0; j < 5; j++) for (let i = 0; i < g[j].length; i++) if (g[j][i] === "#") rect(cv, cx + i * scale, y + j * scale, scale, scale, c);
    cx += (g[0].length + 1) * scale;
  }
  return cx;
}
/** A repeatable pseudo-random number in [0, 1) for an integer seed. */
export function rnd(i) {
  return (Math.imul(i + 1, 2654435761) >>> 0) % 9973 / 9973;
}
export function snow(cv, t, count, seed) {
  for (let i = 0; i < count; i++) {
    const speed = 0.18 + rnd(i * 7 + seed) * 0.3;
    const y = Math.floor((rnd(i * 3 + seed) * 18 + t * speed) % 18) - 1;
    set(cv, Math.floor(rnd(i + seed) * cv.w + Math.sin(t * 0.12 + i) * 1.2 + cv.w) % cv.w, y, i % 3 ? "w" : "s");
  }
}
export function stars(cv, t, count, seed, maxY) {
  for (let i = 0; i < count; i++) set(cv, Math.floor(rnd(i * 5 + seed) * cv.w), Math.floor(rnd(i * 11 + seed) * maxY), (t + i * 7) % 29 < 2 ? "K" : i % 4 ? "s" : "w");
}
export function snowGround(cv, top) {
  for (let x = 0; x < cv.w; x++) {
    const bump = Math.sin(x * 0.21) + Math.sin(x * 0.07 + 1) > 0.9 ? 1 : 0;
    for (let y = top - bump; y < cv.h; y++) set(cv, x, y, y === top - bump ? "w" : "s");
  }
}
export const PINE = [
  "  w  ",
  " wgw ",
  "  g  ",
  " ggg ",
  "ggggg",
  "  b  "
];
export const HOUSE = [
  "    w    ",
  "   www   ",
  "  wwwww  ",
  " rrrrrrr ",
  "rrrrrrrrr",
  " BBBBBBB ",
  " ByBBByB ",
  " BBBbBBB ",
  " BBBbBBB "
];
export const TREE = [
  "     y     ",
  "    yyy    ",
  "     g     ",
  "    ggg    ",
  "   ggggg   ",
  "    ggg    ",
  "   ggggg   ",
  "  ggggggg  ",
  "   ggggg   ",
  "  ggggggg  ",
  " ggggggggg ",
  "ggggggggggg",
  "     b     ",
  "     b     "
];
export const LIGHTS = [
  "r",
  "y",
  "c",
  "p"
];
export function lightTree(cv, x, y, t) {
  sprite(cv, x, y, TREE);
  for (let j = 2; j < 12; j++) for (let i = 0; i < 11; i++) if (TREE[j][i] === "g" && (i * 7 + j * 3) % 5 === 0) set(cv, x + i, y + j, LIGHTS[(i + j + (t >> 2)) % 4]);
  set(cv, x + 5, y + 1, t % 8 < 4 ? "Y" : "y");
}
/** Draws a day number on a dark plate in the top-left corner. */
export function badge(cv, day) {
  const label = String(day);
  rect(cv, 0, 0, textWidth(label) + 2, 7, "n");
  text(cv, 1, 1, label, "Y");
}
export function village(cv, t) {
  fill(cv, "n");
  stars(cv, t, 10, 3, 8);
  disc(cv, 64, 3, 2, "Y");
  sprite(cv, 5, 5, HOUSE);
  sprite(cv, 26, 5, HOUSE);
  sprite(cv, 49, 5, HOUSE);
  if ((t >> 4) % 5 === 2) set(cv, 32, 11, "b");
  if ((t >> 3) % 7 === 4) set(cv, 51, 11, "b");
  sprite(cv, 17, 8, PINE);
  sprite(cv, 39, 8, PINE);
  sprite(cv, 61, 8, PINE);
  snowGround(cv, 14);
  snow(cv, t, 16, 1);
}
/** Week of Advent: candles burn for every Advent Sunday so far. */
export function wreath(cv, t, ctx) {
  fill(cv, "n");
  stars(cv, t, 6, 9, 5);
  const colors = [
    "m",
    "m",
    "p",
    "m"
  ];
  const xs = [
    20,
    30,
    40,
    50
  ];
  for (let i = 0; i < 4; i++) {
    const x = xs[i];
    rect(cv, x, 6, 3, 7, colors[i]);
    set(cv, x + 2, 6, "w");
    set(cv, x + 1, 5, "k");
    if (i < ctx.candles) {
      const sway = ((t >> 1) + i * 2) % 5 === 0 ? 1 : (t + i) % 7 === 0 ? -1 : 0;
      set(cv, x + 1, 4, "o");
      set(cv, x + 1, 3, "y");
      set(cv, x + 1 + sway, 2, (t + i) % 3 ? "Y" : "y");
    }
  }
  rect(cv, 17, 12, 38, 1, "d");
  rect(cv, 14, 13, 44, 2, "g");
  rect(cv, 17, 15, 38, 1, "d");
  for (let x = 15; x < 57; x += 2) set(cv, x, 13 + (x % 3 === 0 ? 1 : 0), "G");
  for (let x = 17; x < 57; x += 6) set(cv, x, 14, "r");
}
export const SNOWMAN = [
  "   kkk   ",
  "   kkk   ",
  "  kkkkk  ",
  "   www   ",
  "  w.w.w  ",
  "  wwoww  ",
  "  rrrrr  ",
  " wwwwrww ",
  "wwww.wwww",
  "wwwwwwwww",
  "wwww.wwww",
  " wwwwwww "
];
export function snowman(cv, t) {
  fill(cv, "n");
  stars(cv, t, 9, 21, 9);
  sprite(cv, 6, 8, PINE);
  sprite(cv, 60, 8, PINE);
  snowGround(cv, 14);
  const x = 31;
  sprite(cv, x, 2, SNOWMAN);
  if (t % 40 < 2) {
    set(cv, 34, 6, "w");
    set(cv, 36, 6, "w");
  }
  set(cv, x, 10, "b");
  set(cv, x - 1, 9, "b");
  set(cv, x - 2, 8, "b");
  const up = (t >> 2) % 2 === 0;
  set(cv, 39, 10, "b");
  set(cv, 40, up ? 9 : 10, "b");
  set(cv, 41, up ? 8 : 9, "b");
  snow(cv, t, 14, 5);
}
export function treeScene(cv, t) {
  fill(cv, "n");
  stars(cv, t, 10, 13, 9);
  snowGround(cv, 15);
  lightTree(cv, 30, 1, t);
  rect(cv, 23, 12, 5, 3, "r");
  rect(cv, 25, 12, 1, 3, "y");
  rect(cv, 43, 11, 6, 4, "c");
  rect(cv, 45, 11, 1, 4, "w");
  rect(cv, 43, 12, 6, 1, "w");
  snow(cv, t, 12, 8);
}
export function gift(cv, t) {
  fill(cv, "n");
  stars(cv, t, 8, 17, 6);
  rect(cv, 0, 15, 72, 1, "b");
  const f = t % 40;
  const shake = f >= 20 && f < 28 ? f % 2 ? 1 : -1 : 0;
  const lift = f >= 28 ? [
    1,
    3,
    5,
    6,
    6,
    6,
    5,
    4,
    3,
    2,
    1,
    0
  ][f - 28] : 0;
  rect(cv, 28 + shake, 8, 16, 7, "r");
  rect(cv, 35 + shake, 8, 2, 7, "y");
  rect(cv, 28 + shake, 11, 16, 1, "y");
  const ly = 6 - lift;
  rect(cv, 27 + shake, ly, 18, 2, "R");
  rect(cv, 35 + shake, ly, 2, 2, "y");
  sprite(cv, 32 + shake, ly - 2, ["yy  yy", " yyyy "]);
  if (lift > 0) {
    const r = (f - 27) * 1.3;
    for (let k = 0; k < 10; k++) {
      const a = k / 10 * Math.PI * 2;
      set(cv, Math.round(36 + Math.cos(a) * r * 1.8), Math.round(7 + Math.sin(a) * r * 0.7), LIGHTS[k % 4]);
    }
  }
}
export const REINDEER = [[
  "     . .",
  "      ..",
  "      ...",
  " ......",
  "......",
  " .  . ."
], [
  "     . .",
  "      ..",
  "      ...",
  " ......",
  "......",
  "  . . ."
]];
export const SLEIGH = [
  "    ..     ",
  "   ....    ",
  ".  ......  ",
  "........... ",
  " ........  ",
  " ........."
];
export function sleigh(cv, t) {
  fill(cv, "n");
  stars(cv, t, 14, 29, 13);
  disc(cv, 36, 8, 7, "Y");
  set(cv, 33, 5, "y");
  set(cv, 38, 10, "y");
  set(cv, 39, 6, "y");
  set(cv, 34, 11, "y");
  const x = t % 120 - 34 | 0;
  const y = 4 + Math.round(Math.sin(t * 0.2));
  sprite(cv, x, y + 1, SLEIGH);
  for (let i = 11; i < 16; i++) set(cv, x + i, y + 4, ".");
  sprite(cv, x + 15, y, REINDEER[(t >> 1) % 2]);
  sprite(cv, x + 24, y - 1, REINDEER[((t >> 1) + 1) % 2]);
  set(cv, x + 32, y + 1, t % 6 < 3 ? "R" : "r");
  for (let x2 = 0; x2 < 72; x2++) {
    const h = 15 - Math.round(1 + Math.sin(x2 * 0.13) + Math.sin(x2 * 0.05 + 2));
    for (let y2 = h; y2 < 16; y2++) set(cv, x2, y2, "d");
  }
}
export const GINGER = [
  "    BBB    ",
  "   BBBBB   ",
  "   BwBwB   ",
  "   BwwwB   ",
  "    BBB    ",
  "wBBBBBBBBBw",
  "   BBrBB   ",
  "   BBBBB   ",
  "   BBrBB   ",
  "   BB BB   ",
  "  BBB BBB  ",
  "  www www  "
];
export const GINGER_WAVE = GINGER.slice();
GINGER_WAVE[4] = "    BBB  Bw";
GINGER_WAVE[5] = "wBBBBBBBB  ";
export function gingerbread(cv, t) {
  fill(cv, "N");
  for (let y = 13; y < 16; y++) for (let x = 0; x < 72; x++) set(cv, x, y, ((x >> 1) + (y >> 1)) % 2 ? "r" : "w");
  sprite(cv, 30, 1 - ((t >> 2) % 4 === 1 ? 1 : 0), (t >> 3) % 2 ? GINGER_WAVE : GINGER);
  for (const cx of [11, 60]) {
    disc(cv, cx, 9, 3, "B");
    set(cv, cx - 1, 8, "b");
    set(cv, cx + 1, 10, "b");
    set(cv, cx + 2, 8, "b");
  }
  set(cv, t * 3 % 72, 2, "w");
}
export function aurora(cv, t) {
  fill(cv, "n");
  stars(cv, t, 12, 41, 12);
  const band = [
    "m",
    "c",
    "G",
    "G",
    "g"
  ];
  for (let x = 0; x < 72; x++) {
    const c = 5 + 2.4 * Math.sin(x * 0.18 + t * 0.12) + 1.2 * Math.sin(x * 0.07 - t * 0.05);
    for (let k = 0; k < band.length; k++) {
      if ((x + k + (t >> 1)) % 9 === 0 && k === 0) continue;
      set(cv, x, Math.round(c) + k - 2, band[k]);
    }
  }
  for (let x = 0; x < 72; x++) {
    const h = 15 - Math.round(1.5 + 1.2 * Math.sin(x * 0.09) + Math.sin(x * 0.23 + 1));
    for (let y = h; y < 16; y++) set(cv, x, y, ".");
  }
  for (const px of [
    9,
    27,
    52,
    66
  ]) sprite(cv, px, 9, [
    "  .  ",
    " ... ",
    "  .  ",
    " ... ",
    ".....",
    "  .  "
  ]);
}
export const SCENES = [
  {
    draw: village,
    caption: "First snow"
  },
  {
    draw: wreath,
    caption: "Advent wreath"
  },
  {
    draw: snowman,
    caption: "A snowman"
  },
  {
    draw: treeScene,
    caption: "Tree lights"
  },
  {
    draw: gift,
    caption: "A gift"
  },
  {
    draw: sleigh,
    caption: "Sleigh at night"
  },
  {
    draw: gingerbread,
    caption: "Gingerbread"
  },
  {
    draw: aurora,
    caption: "Northern lights"
  }
];
export function finale(cv, t) {
  fill(cv, "n");
  snow(cv, t, 12, 77);
  lightTree(cv, 3, 1, t);
  text(cv, 18, 2, "MERRY", (i) => (i + (t >> 2)) % 2 ? "y" : "R");
  text(cv, 18, 9, "CHRISTMAS", "w");
  const f = t % 24;
  const r = f * 0.5;
  if (f < 12) for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2;
    set(cv, Math.round(64 + Math.cos(a) * r), Math.round(6 + Math.sin(a) * r), LIGHTS[(k + (t >> 3)) % 4]);
  }
  else if (f < 16) set(cv, 64, 6 + (16 - f), "Y");
}
/** The caption of a day, for the back display. */
export function caption(day) {
  if (day === 25) return "Merry Christmas!";
  return SCENES[(day - 1) % SCENES.length].caption;
}
/** Paints the scene behind door `day` (1-25). ctx: { candles } */
export function drawScene(cv, day, t, ctx) {
  if (day === 25) finale(cv, t);
  else SCENES[(day - 1) % SCENES.length].draw(cv, t, ctx);
  badge(cv, day);
}
/**
* Paints a closed door. `locked` doors are grey and say how long to wait;
* open-able ones glow with running lights.
*/
export function drawDoor(cv, day, t, opts) {
  const finaleDoor = day === 25;
  const base = opts.locked ? "k" : finaleDoor ? "g" : "r";
  const ink = opts.locked ? "K" : "w";
  fill(cv, base);
  let i = 0;
  const lit = opts.locked ? "K" : "y";
  const dim = opts.locked ? "k" : finaleDoor ? "d" : "b";
  const bulb = (x, y) => {
    set(cv, x, y, (i + (opts.locked ? 0 : t >> 1)) % 3 === 0 ? lit : dim);
    i++;
  };
  for (let x = 0; x < 72; x++) bulb(x, 0);
  for (let y = 1; y < 16; y++) bulb(71, y);
  for (let x = 70; x >= 0; x--) bulb(x, 15);
  for (let y = 14; y > 0; y--) bulb(0, y);
  const label = String(day);
  const numberX = 36 - (textWidth(label, 2) >> 1);
  text(cv, numberX, 3, label, ink, 2);
  text(cv, 5, 6, "DEC", opts.locked ? "K" : "Y");
  if (opts.locked) {
    let wait = "IN " + opts.daysLeft + "D";
    if (67 - textWidth(wait) < numberX + textWidth(label, 2) + 3) wait = opts.daysLeft + "D";
    text(cv, 67 - textWidth(wait), 6, wait, "K");
  } else text(cv, 52, 6, "OPEN", t % 16 < 10 ? "Y" : "y");
}
/** The opening animation: the door splits down the middle and slides away. */
export function drawOpening(cv, doorCv, frame, frames) {
  const p = frame / frames;
  const off = Math.round(36 * p * p);
  blitSlice(cv, doorCv, 0, 36, -off);
  blitSlice(cv, doorCv, 36, 72, off);
}
export function drawCountdown(cv, t, daysLeft) {
  fill(cv, "n");
  stars(cv, t, 10, 51, 9);
  snowGround(cv, 15);
  sprite(cv, 4, 7, [
    "  y  ",
    " yyy ",
    "  g  ",
    " ggg ",
    "ggggg",
    " ggg ",
    "ggggg",
    "  b  "
  ]);
  snow(cv, t, 10, 61);
  text(cv, 16, 2, "ADVENT IN", "Y");
  text(cv, 16, 9, daysLeft === 1 ? "1 DAY" : daysLeft + " DAYS", "w");
}
export const TIERS = [
  {
    top: 8,
    rows: 12,
    w0: 2,
    w1: 16
  },
  {
    top: 16,
    rows: 14,
    w0: 8,
    w1: 26
  },
  {
    top: 27,
    rows: 17,
    w0: 12,
    w1: 36
  },
  {
    top: 40,
    rows: 22,
    w0: 16,
    w1: 46
  }
];
export const ORN_ROWS = [
  12,
  18,
  23,
  28,
  33,
  38,
  43,
  48,
  53,
  58
];
export const ORN_COUNT = [
  1,
  2,
  2,
  3,
  2,
  3,
  3,
  3,
  3,
  2
];
export const ORN_COLORS = [
  "r",
  "y",
  "c",
  "p",
  "R",
  "m"
];
export function halfWidthAt(y) {
  let hw = 0;
  for (const tier of TIERS) {
    if (y < tier.top || y >= tier.top + tier.rows) continue;
    const p = (y - tier.top) / (tier.rows - 1);
    hw = Math.max(hw, (tier.w0 + (tier.w1 - tier.w0) * p) / 2);
  }
  return hw;
}
/** Positions of the 24 ornaments on the tree, door 1 at the top. */
export const ORNAMENTS = (() => {
  const out = [];
  for (let r = 0; r < ORN_ROWS.length; r++) {
    const y = ORN_ROWS[r];
    const n = ORN_COUNT[r];
    const span = Math.max(0, halfWidthAt(y) * 2 - 6);
    for (let k = 0; k < n; k++) {
      const x = n === 1 ? 48 / 2 : 48 / 2 - span / 2 + span * k / (n - 1);
      out.push({
        x: Math.round(x) - 1,
        y
      });
    }
  }
  return out;
})();
/**
* The tree on the back display: an ornament for every opened door, the star
* once Christmas comes. `selected` gets a ring.
*/
export function drawTree(cv, opened, selected) {
  fill(cv, ".");
  for (let y = 0; y < 72; y++) {
    const hw = halfWidthAt(y);
    if (hw <= 0) continue;
    for (let x = Math.round(48 / 2 - hw); x < Math.round(48 / 2 + hw); x++) set(cv, x, y, (x + y * 3) % 7 === 0 ? "d" : "g");
  }
  rect(cv, 21, 62, 6, 8, "b");
  const star = opened[25] ? "y" : "k";
  rect(cv, 23, 1, 2, 7, star);
  rect(cv, 20, 3, 8, 2, star);
  for (let d = 1; d <= 24; d++) {
    const o = ORNAMENTS[d - 1];
    if (d === selected) rect(cv, o.x - 1, o.y - 1, 4, 4, "w");
    rect(cv, o.x, o.y, 2, 2, opened[d] ? ORN_COLORS[d % ORN_COLORS.length] : "k");
  }
  if (selected === 25) {
    rect(cv, 19, 0, 10, 1, "w");
    rect(cv, 19, 8, 10, 1, "w");
  }
}
