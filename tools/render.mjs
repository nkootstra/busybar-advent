// Writes previews/scenes-<n>.png: every door's scene at a few moments, enlarged, to look at while drawing.
// Usage: node tools/render.mjs [first day] [last day]
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PALETTE, createCanvas } from "../src/canvas.js";
import { DOORS, drawScene } from "../src/scenes.js";
import { encodePng } from "./png.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCALE = 5;
const GAP = 6;
/** The moments shown, in frames; the last one is just after Start was pressed. */
const MOMENTS = [0, 21, 37];
const POKED = 8;

const first = Number(process.argv[2] || 1);
const last = Number(process.argv[3] || DOORS);
const columns = MOMENTS.length + 1;
const width = columns * (72 * SCALE + GAP) + GAP;
const height = (last - first + 1) * (16 * SCALE + GAP) + GAP;
const image = new Uint8Array(width * height * 4);
for (let i = 0; i < image.length; i += 4) image.set([40, 40, 44, 255], i);

const rgb = {};
for (const key in PALETTE) rgb[key] = [1, 3, 5].map((at) => parseInt(PALETTE[key].slice(at, at + 2), 16));

const cv = createCanvas(72, 16);
for (let day = first; day <= last; day++) {
  for (let column = 0; column < columns; column++) {
    const poked = column === MOMENTS.length;
    drawScene(cv, day, poked ? 60 + POKED : MOMENTS[column], { candles: 3, poke: poked ? POKED : 9999 });
    const left = GAP + column * (72 * SCALE + GAP);
    const top = GAP + (day - first) * (16 * SCALE + GAP);
    for (let y = 0; y < 16 * SCALE; y++) {
      for (let x = 0; x < 72 * SCALE; x++) {
        const c = rgb[cv.px[Math.floor(y / SCALE) * 72 + Math.floor(x / SCALE)]];
        image.set([c[0], c[1], c[2], 255], ((top + y) * width + left + x) * 4);
      }
    }
  }
}
const out = resolve(root, "previews/scenes-" + first + "-" + last + ".png");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, encodePng(width, height, image));
console.log("wrote " + out);
