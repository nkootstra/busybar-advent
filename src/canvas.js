/** The colours of every drawing: one character per colour, as the XPM2 bitmap sent to the bar wants them. */
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
  m: "#8A4AFF",
  f: "#F2B48C"
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
/** Copies a horizontal slice [x0, x1) of `src` onto `dst`, shifted by dx. Pixels pushed off the edge are dropped. */
export function blitSlice(dst, src, x0, x1, dx) {
  const w = src.w;
  const from = Math.max(x0, -dx);
  const to = Math.min(x1, w - dx);
  for (let y = 0; y < src.h; y++) {
    const row = y * w;
    for (let x = from; x < to; x++) dst.px[row + x + dx] = src.px[row + x];
  }
}
/**
 * The canvas as an XPM2 bitmap for an `xpmbitmap` display element. One join over the whole canvas and a substring
 * per row: the bar's runtime is slow at allocating, and this allocates the least.
 */
export function toXpm(cv) {
  const all = cv.px.join("");
  const rows = ["! XPM2", cv.w + " " + cv.h + " " + PALETTE_KEYS.length + " 1", XPM_COLORS];
  for (let y = 0; y < cv.h; y++) rows.push(all.substring(y * cv.w, (y + 1) * cv.w));
  return rows.join("\n");
}
let layer = null;
let layerKey = "";
/**
 * Starts a frame on `cv` from a backdrop that is painted once. `paint(bg)` runs only when `key` differs from the
 * last call's; every call after that copies the stored backdrop, which costs the bar far less than repainting it.
 * One backdrop is kept at a time: it is whatever the front display shows now.
 */
export function backdrop(cv, key, paint) {
  if (key !== layerKey) {
    if (!layer) layer = createCanvas(cv.w, cv.h);
    paint(layer);
    layerKey = key;
  }
  cv.px = layer.px.slice();
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
