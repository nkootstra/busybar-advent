// Writes previews/advent-simulator.html: the app's own code running against a pretend bar in a browser.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "./bundle.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "previews/advent-simulator.html");
const marker = '/*APP_CODE*/ ""';

const page = readFileSync(resolve(root, "tools/sim-page.html"), "utf8");
if (!page.includes(marker)) throw new Error("tools/sim-page.html has no " + marker);
const code = await bundle(resolve(root, "src/main.js"));

mkdirSync(dirname(out), { recursive: true });
// A function as the replacement keeps `$` in the code from being read as a pattern.
writeFileSync(out, page.replace(marker, () => JSON.stringify(code)));
console.log("wrote " + out);
