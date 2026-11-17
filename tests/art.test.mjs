import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PALETTE,
  caption,
  createCanvas,
  drawCountdown,
  drawDoor,
  drawOpening,
  drawScene,
  drawTree,
  toXpm,
} from "../src/art.js";

const KEYS = new Set(Object.keys(PALETTE));

function assertPalette(cv, what) {
  assert.equal(cv.px.length, cv.w * cv.h, what + ": canvas size changed");
  for (let i = 0; i < cv.px.length; i++) {
    if (!KEYS.has(cv.px[i])) assert.fail(what + ": pixel " + i + " is " + JSON.stringify(cv.px[i]));
  }
}

test("every scene draws only palette colours, on every frame", () => {
  const cv = createCanvas(72, 16);
  for (let day = 1; day <= 25; day++) {
    for (let candles = 0; candles <= 4; candles += 4) {
      for (let t = 0; t < 260; t++) {
        drawScene(cv, day, t, { candles });
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
      drawScene(cv, day, t, { candles: 2 });
      seen.add(cv.px.join(""));
    }
    assert.ok(seen.size >= 4, "day " + day + " shows only " + seen.size + " different frames");
  }
});

test("every day has a caption that fits the back display", () => {
  for (let day = 1; day <= 25; day++) {
    const line = caption(day);
    assert.match(line, /^[\x20-\x7e]+$/, "day " + day);
    assert.ok(line.length <= 22, "day " + day + ": " + line);
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
    drawDoor(door, day, 0, { locked: false });
    for (let frame = 0; frame <= 12; frame++) {
      drawScene(cv, day, frame, { candles: 1 });
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
  const cv = createCanvas(48, 72);
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
  drawScene(cv, 1, 0, { candles: 1 });
  const lines = toXpm(cv).split("\n");
  assert.equal(lines[0], "! XPM2");
  assert.equal(lines[1], "72 16 " + KEYS.size + " 1");
  assert.equal(lines.length, 2 + KEYS.size + 16);
  for (const row of lines.slice(2 + KEYS.size)) assert.equal(row.length, 72);
});
