// Everything on the displays that is not a scene: the doors, the opening, the countdown to December and the tree
// on the back display.
import {
  backdrop,
  blitSlice,
  createCanvas,
  fill,
  rect,
  set,
  sprite,
  text,
  textSprite,
  textWidth,
  xpmHeader,
  xpmRows,
} from "./canvas.js";
import { snow, snowGround, stars, twinkle } from "./scenery.js";

const W = 72;
const H = 16;
/** The bulbs run around the edge of a door: this many of them. */
const BULBS = 2 * (W + H) - 4;

const OPEN_BRIGHT = textSprite("OPEN", "Y");

/** The pixel of bulb `i`, counted clockwise from the top-left corner. */
function bulb(cv, i, c) {
  if (i < W) set(cv, i, 0, c);
  else if (i < W + H - 1) set(cv, W - 1, i - W + 1, c);
  else if (i < 2 * W + H - 2) set(cv, 2 * W + H - 3 - i, H - 1, c);
  else set(cv, 0, BULBS - i, c);
}

/** The part of a door that stands still: its colour, the day and, when locked, how long to wait. */
function doorBack(cv, day, opts) {
  const base = opts.locked ? "k" : day === 25 ? "g" : "r";
  fill(cv, base);
  const dim = opts.locked ? "k" : day === 25 ? "d" : "b";
  for (let i = 0; i < BULBS; i++) bulb(cv, i, opts.locked && i % 3 === 0 ? "K" : dim);

  const label = String(day);
  const numberX = (W >> 1) - (textWidth(label, 2) >> 1);
  text(cv, numberX, 3, label, opts.locked ? "K" : "w", 2);
  text(cv, 5, 6, "DEC", opts.locked ? "K" : "Y");
  if (opts.locked) {
    let wait = "IN " + opts.daysLeft + "D";
    if (67 - textWidth(wait) < numberX + textWidth(label, 2) + 3) wait = opts.daysLeft + "D";
    text(cv, 67 - textWidth(wait), 6, wait, "K");
  } else {
    text(cv, 52, 6, "OPEN", "y");
  }
}

/** The part of an unlocked door that moves: lights running around it, and OPEN blinking. */
function doorLights(cv, t) {
  for (let i = (3 - ((t >> 1) % 3)) % 3; i < BULBS; i += 3) bulb(cv, i, "y");
  if (t % 16 < 10) sprite(cv, 52, 6, OPEN_BRIGHT);
}

/**
 * Paints a closed door. `locked` doors are grey and say how long to wait (opts.daysLeft);
 * the others glow with running lights.
 */
export function drawDoor(cv, day, t, opts) {
  backdrop(cv, "door" + day + ":" + (opts.locked ? opts.daysLeft : "open"), (bg) => doorBack(bg, day, opts));
  if (!opts.locked) doorLights(cv, t);
}

/** Paints an unlocked door on a canvas of its own, to slide away while the scene shows behind it. */
export function paintDoor(cv, day, t) {
  doorBack(cv, day, { locked: false });
  doorLights(cv, t);
}

/** The opening: the door `doorCv` splits down the middle and its halves slide off `cv`. */
export function drawOpening(cv, doorCv, frame, frames) {
  const p = frame / frames;
  const off = Math.round((W >> 1) * p * p);
  blitSlice(cv, doorCv, 0, W >> 1, -off);
  blitSlice(cv, doorCv, W >> 1, W, off);
}

/** Before December: how many days until the first door. */
export function drawCountdown(cv, t, daysLeft) {
  backdrop(cv, "countdown" + daysLeft, (bg) => {
    fill(bg, "n");
    stars(bg, 10, 51, 9);
    snowGround(bg, 15);
    sprite(bg, 4, 7, ["  y  ", " yyy ", "  g  ", " ggg ", "ggggg", " ggg ", "ggggg", "  b  "]);
    text(bg, 16, 2, "ADVENT IN", "Y");
    text(bg, 16, 9, daysLeft === 1 ? "1 DAY" : daysLeft + " DAYS", "w");
  });
  twinkle(cv, t, 10, 51, 9);
  snow(cv, t, 10, 61);
}

// ------------------------------------------------------------------------------------- the back display's tree

const TREE_W = 48;
const TREE_H = 72;
/** Rows painted at a time; TREE_H is a multiple of it. */
const TREE_BAND = 12;
const MID = TREE_W / 2;
/** The four tiers of the tree: the row each starts at, how many rows, and its width at the top and the bottom. */
const TIERS = [
  { top: 8, rows: 12, w0: 2, w1: 16 },
  { top: 16, rows: 14, w0: 8, w1: 26 },
  { top: 27, rows: 17, w0: 12, w1: 36 },
  { top: 40, rows: 22, w0: 16, w1: 46 },
];
/** The rows ornaments hang on, and how many on each: 24 in all. */
const ORN_ROWS = [12, 18, 23, 28, 33, 38, 43, 48, 53, 58];
const ORN_COUNT = [1, 2, 2, 3, 2, 3, 3, 3, 3, 2];
const ORN_COLORS = ["r", "y", "c", "p", "R", "m"];
const STAR = ["   yy   ", "   yy   ", "yyyyyyyy", " yyyyyy ", "  yyyy  ", " yy  yy "];
const STAR_OFF = STAR.map((row) => row.replace(/y/g, "k"));

function halfWidthAt(y) {
  let hw = 0;
  for (const tier of TIERS) {
    if (y < tier.top || y >= tier.top + tier.rows) continue;
    const p = (y - tier.top) / (tier.rows - 1);
    hw = Math.max(hw, (tier.w0 + (tier.w1 - tier.w0) * p) / 2);
  }
  return hw;
}

/** Where ornament `door` (1-24) hangs: door 1 at the top, the rest row by row. */
function ornamentAt(door) {
  let first = 1;
  for (let r = 0; r < ORN_ROWS.length; r++) {
    const n = ORN_COUNT[r];
    if (door < first + n) {
      const y = ORN_ROWS[r];
      const span = Math.max(0, halfWidthAt(y) * 2 - 6);
      const x = n === 1 ? MID : MID - span / 2 + (span * (door - first)) / (n - 1);
      return { x: Math.round(x) - 1, y };
    }
    first += n;
  }
  return null;
}

/** Paints the rows of the tree from `top` down onto `cv`, as many as it is high. */
function drawTreeBand(cv, top, opened, selected) {
  fill(cv, ".");
  for (let y = top; y < top + cv.h; y++) {
    const hw = halfWidthAt(y);
    if (hw <= 0) continue;
    const row = (y - top) * cv.w;
    for (let x = Math.round(MID - hw); x < Math.round(MID + hw); x++) cv.px[row + x] = (x + y * 3) % 7 === 0 ? "d" : "g";
  }
  rect(cv, 21, 62 - top, 6, 8, "b");
  sprite(cv, 20, 2 - top, opened[25] ? STAR : STAR_OFF);
  for (let d = 1; d <= 24; d++) {
    const at = ornamentAt(d);
    if (d === selected) rect(cv, at.x - 1, at.y - 1 - top, 4, 4, "w");
    rect(cv, at.x, at.y - top, 2, 2, opened[d] ? ORN_COLORS[d % ORN_COLORS.length] : "k");
  }
  if (selected === 25) {
    rect(cv, 19, 0 - top, 10, 1, "w");
    rect(cv, 19, 9 - top, 10, 1, "w");
  }
}

/**
 * The tree on the back display, as an XPM2 bitmap: an ornament for every opened door, the star once Christmas
 * comes, and a ring around `selected`. It is painted a band at a time, so that the bar never holds the whole
 * picture as a canvas: memory is the scarce thing there.
 */
export function treeXpm(opened, selected) {
  const band = createCanvas(TREE_W, TREE_BAND);
  const rows = [xpmHeader(TREE_W, TREE_H)];
  for (let top = 0; top < TREE_H; top += TREE_BAND) {
    drawTreeBand(band, top, opened, selected);
    xpmRows(band, rows);
  }
  return rows.join("\n");
}
