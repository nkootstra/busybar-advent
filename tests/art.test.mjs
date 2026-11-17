import assert from "node:assert/strict";
import { test } from "node:test";
import { PALETTE, createCanvas, toXpm } from "../src/canvas.js";
import { DOORS, drawScene, sceneOf } from "../src/scenes.js";
import { TREE_H, TREE_W, drawCountdown, drawDoor, drawOpening, drawTree, paintDoor } from "../src/screens.js";

const KEYS = new Set(Object.keys(PALETTE));

function assertPalette(cv, what) {
  assert.equal(cv.px.length, cv.w * cv.h, what + ": canvas size changed");
  for (let i = 0; i < cv.px.length; i++) {
    if (!KEYS.has(cv.px[i])) assert.fail(what + ": pixel " + i + " is " + JSON.stringify(cv.px[i]));
  }
}

test("every scene draws only palette colours, on every frame", () => {
  const cv = createCanvas(72, 16);
  for (let day = 1; day <= DOORS; day++) {
    for (const candles of [0, 4]) {
      for (let t = 0; t < 260; t++) {
        // Start is pressed at frame 100.
        drawScene(cv, day, t, { candles, poke: t < 100 ? 9999 : t - 100 });
        assertPalette(cv, "day " + day + " frame " + t);
      }
    }
  }
});

test("every scene moves", () => {
  const cv = createCanvas(72, 16);
  for (let day = 1; day <= 25; day++) {
    const seen = new Set();
    for (let t = 0; t < 64; t++) {
      drawScene(cv, day, t, { candles: 2, poke: 9999 });
      seen.add(cv.px.join(""));
    }
    assert.ok(seen.size >= 4, "day " + day + " shows only " + seen.size + " different frames");
  }
});

test("there are 24 doors and Christmas Day, each with a scene of its own", () => {
  assert.equal(DOORS, 25);
  const captions = new Set();
  for (let day = 1; day <= DOORS; day++) captions.add(sceneOf(day).caption);
  assert.equal(captions.size, 25);
});

test("every day's lines fit the back display", () => {
  for (let day = 1; day <= DOORS; day++) {
    const scene = sceneOf(day);
    for (const line of [scene.caption, scene.note, "Start: " + (scene.action || "replay")]) {
      assert.match(line, /^[\x20-\x7e]+$/, "day " + day);
      assert.ok(line.length <= 20, "day " + day + ": " + line);
    }
  }
});

test("a scene with something to do answers to Start", () => {
  const cv = createCanvas(72, 16);
  for (let day = 1; day <= DOORS; day++) {
    if (!sceneOf(day).action) continue;
    let differs = false;
    for (let t = 200; t < 212 && !differs; t++) {
      drawScene(cv, day, t, { candles: 2, poke: 9999 });
      const idle = cv.px.join("");
      drawScene(cv, day, t, { candles: 2, poke: t - 200 });
      differs = cv.px.join("") !== idle;
    }
    assert.ok(differs, "day " + day + " ignores Start");
  }
});

test("doors, the opening and the countdown draw only palette colours", () => {
  const cv = createCanvas(72, 16);
  const door = createCanvas(72, 16);
  for (let day = 1; day <= 25; day++) {
    for (let t = 0; t < 20; t++) {
      drawDoor(cv, day, t, { locked: false });
      assertPalette(cv, "door " + day);
      drawDoor(cv, day, t, { locked: true, daysLeft: 37 });
      assertPalette(cv, "locked door " + day);
    }
    paintDoor(door, day, 0);
    assertPalette(door, "sliding door " + day);
    for (let frame = 0; frame <= 12; frame++) {
      drawScene(cv, day, frame, { candles: 1, poke: 9999 });
      drawOpening(cv, door, frame, 12);
      assertPalette(cv, "opening " + day);
    }
  }
  for (const days of [1, 14, 328]) {
    drawCountdown(cv, 3, days);
    assertPalette(cv, "countdown " + days);
  }
});

test("the tree gets an ornament per opened door and a star at Christmas", () => {
  const cv = createCanvas(TREE_W, TREE_H);
  const none = [];
  const all = [];
  for (let d = 0; d <= 25; d++) {
    none.push(false);
    all.push(true);
  }
  drawTree(cv, none, 0);
  assertPalette(cv, "empty tree");
  const bare = cv.px.join("");
  drawTree(cv, all, 25);
  assertPalette(cv, "full tree");
  assert.notEqual(cv.px.join(""), bare);
  assert.ok(cv.px.includes("y"), "the star is lit");
});

test("the bitmap is XPM2 with one character per pixel", () => {
  const cv = createCanvas(72, 16);
  drawScene(cv, 1, 0, { candles: 1, poke: 9999 });
  const lines = toXpm(cv).split("\n");
  assert.equal(lines[0], "! XPM2");
  assert.equal(lines[1], "72 16 " + KEYS.size + " 1");
  assert.equal(lines.length, 2 + KEYS.size + 16);
  for (const row of lines.slice(2 + KEYS.size)) assert.equal(row.length, 72);
});
