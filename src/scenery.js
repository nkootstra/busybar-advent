// The pieces scenes are built from: weather, ground and the sprites more than one scene uses.
import { rnd, set } from "./canvas.js";

export const W = 72;
export const LIGHTS = ["r", "y", "c", "p"];

/** Snow falling over the whole scene. */
export function snow(cv, t, count, seed) {
  for (let i = 0; i < count; i++) {
    const speed = 0.18 + rnd(i * 7 + seed) * 0.3;
    const y = Math.floor((rnd(i * 3 + seed) * 18 + t * speed) % 18) - 1;
    const x = Math.floor(rnd(i + seed) * W + Math.sin(t * 0.12 + i) * 1.2 + W) % W;
    set(cv, x, y, i % 3 ? "w" : "s");
  }
}

/** Stars for a backdrop. */
export function stars(cv, count, seed, maxY) {
  for (let i = 0; i < count; i++) {
    set(cv, Math.floor(rnd(i * 5 + seed) * W), Math.floor(rnd(i * 11 + seed) * maxY), i % 4 ? "s" : "w");
  }
}

/** Dims the stars of `stars()` in turn, so they twinkle. */
export function twinkle(cv, t, count, seed, maxY) {
  for (let i = 0; i < count; i++) {
    if ((t + i * 7) % 29 < 2) set(cv, Math.floor(rnd(i * 5 + seed) * W), Math.floor(rnd(i * 11 + seed) * maxY), "K");
  }
}

/** Snow on the ground from row `top` down, with a few drifts. */
export function snowGround(cv, top) {
  for (let x = 0; x < W; x++) {
    const bump = Math.sin(x * 0.21) + Math.sin(x * 0.07 + 1) > 0.9 ? 1 : 0;
    for (let y = top - bump; y < cv.h; y++) set(cv, x, y, y === top - bump ? "w" : "s");
  }
}

/** Dark hills along the bottom. */
export function hills(cv, base, c) {
  for (let x = 0; x < W; x++) {
    const top = 15 - Math.round(base + Math.sin(x * 0.13) + Math.sin(x * 0.05 + 2));
    for (let y = top; y < 16; y++) set(cv, x, y, c);
  }
}

/** A sprite facing the other way. */
export function mirror(rows) {
  return rows.map((row) => row.split("").reverse().join(""));
}

export const PINE = ["  w  ", " wgw ", "  g  ", " ggg ", "ggggg", "  b  "];
export const DARK_PINE = ["  .  ", "  .  ", " ... ", " ... ", ".....", "....."];
export const HOUSE = [
  "    w    ",
  "   www   ",
  "  wwwww  ",
  " rrrrrrr ",
  "rrrrrrrrr",
  " BBBBBBB ",
  " ByBBByB ",
  " BBBbBBB ",
  " BBBbBBB ",
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
  "     b     ",
];
/** Where the fairy lights sit on TREE. */
export const TREE_LIGHTS = [];
for (let j = 2; j < 12; j++) {
  for (let i = 0; i < 11; i++) if (TREE[j][i] === "g" && (i * 7 + j * 3) % 5 === 0) TREE_LIGHTS.push([i, j]);
}

/** The lights of a TREE drawn at (x, y): they run through four colours, and the star on top blinks. */
export function treeLights(cv, x, y, t) {
  for (let k = 0; k < TREE_LIGHTS.length; k++) {
    const at = TREE_LIGHTS[k];
    set(cv, x + at[0], y + at[1], LIGHTS[(at[0] + at[1] + (t >> 2)) % 4]);
  }
  set(cv, x + 5, y + 1, t % 8 < 4 ? "Y" : "y");
}
