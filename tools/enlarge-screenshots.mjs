// Writes docs/screenshots: the screenshots enlarged, every pixel a crisp square, for the README.
// The catalog takes the ones in screenshots/ at the displays' own size, 72x16 and 160x80, which is small on a page.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { decodePng, encodePng } from "./png.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const from = resolve(root, "screenshots");
const to = resolve(root, "docs/screenshots");
/** How many times larger: the front display's pixels are big on the bar, the back's are fine. */
const SCALE = { front: 8, back: 3 };

mkdirSync(to, { recursive: true });
for (const name of readdirSync(from).filter((file) => file.endsWith(".png"))) {
  const scale = SCALE[name.split("-")[0]];
  if (!scale) continue;
  const { width, height, rgba } = decodePng(readFileSync(resolve(from, name)));
  const large = new Uint8Array(width * scale * height * scale * 4);
  for (let y = 0; y < height * scale; y++) {
    for (let x = 0; x < width * scale; x++) {
      const source = (Math.floor(y / scale) * width + Math.floor(x / scale)) * 4;
      large.set(rgba.subarray(source, source + 4), (y * width * scale + x) * 4);
    }
  }
  writeFileSync(resolve(to, name), encodePng(width * scale, height * scale, large));
}
console.log("wrote " + to);
