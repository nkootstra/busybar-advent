// The app the benchmark runs on the bar: it paints and sends frames of every screen the way the calendar does,
// and logs how long a frame takes. tools/bench.mjs builds it next to the real sources and reads the log.
import { bitmap, draw } from "./bar.js";
import { createCanvas, toXpm } from "./canvas.js";
import { DOORS, drawScene } from "./scenes.js";
import { drawCountdown, drawDoor } from "./screens.js";

const APP = "io.kootstra.advent.bench";
const FRAMES = 10;
const front = createCanvas(72, 16);

/** Every screen the calendar can show: the 25 scenes, a closed door and the countdown. */
const SCREENS = [];
for (let day = 1; day <= DOORS; day++) {
  SCREENS.push({ name: "scene" + day, paint: (t) => drawScene(front, day, t, { candles: 3, poke: t < 5 ? 9999 : t - 5 }) });
}
SCREENS.push({ name: "door", paint: (t) => drawDoor(front, 7, t, { locked: false }) });
SCREENS.push({ name: "countdown", paint: (t) => drawCountdown(front, t, 14) });

let total = 0;
function run(index) {
  if (index === SCREENS.length) {
    console.log("bench frame_ms " + (total / SCREENS.length).toFixed(1));
    return;
  }
  const screen = SCREENS[index];
  // The first frame paints the backdrop: it is what a turn of the wheel costs, and is timed apart.
  let started = Date.now();
  let first = 0;
  const step = (t) => {
    if (t === FRAMES + 1) {
      const frame = (Date.now() - started) / FRAMES;
      total += frame;
      console.log("bench " + screen.name + " " + frame.toFixed(1) + " first " + first);
      setTimeout(() => run(index + 1), 0);
      return;
    }
    screen.paint(t * 3);
    draw(APP, [bitmap("front", toXpm(front), 0, 0, "front")]).then(() => {
      if (t === 0) {
        first = Date.now() - started;
        started = Date.now();
      }
      step(t + 1);
    });
  };
  step(0);
}

run(0);
