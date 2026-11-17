// The built app on a pretend bar: what a person sees and hears when they use it.
import assert from "node:assert/strict";
import { before, test } from "node:test";
import { builtApp, launch } from "../tools/sim.mjs";

let app;
before(async () => {
  app = await builtApp();
});

const bits = (...days) => {
  let out = "";
  for (let d = 1; d <= 25; d++) out += days.includes(d) ? "1" : "0";
  return out;
};

test("Start opens today's door with a sound and a light, and remembers it", async () => {
  const bar = await launch(app, { date: "2026-12-05" });
  assert.equal(bar.text("title"), "December 5");
  assert.equal(bar.text("line"), "Press Start to open");
  assert.equal(bar.text("count"), "0 of 24 opened");
  assert.equal(bar.front.length, 16);
  assert.equal(bar.front[0].length, 72);

  const closed = bar.front.join("\n");
  await bar.press("start");
  await bar.advance(3000);
  assert.deepEqual(bar.sounds, ["shared/sounds/calendar_event_starts.snd"]);
  assert.equal(bar.lights.length, 1);
  assert.equal(bar.store.record, "2026:" + bits(5));
  assert.equal(bar.text("count"), "1 of 24 opened");
  assert.notEqual(bar.text("line"), "Press Start to open");
  assert.notEqual(bar.front.join("\n"), closed);
  assert.deepEqual(bar.errors, []);
});

test("an open door shows its scene's lines, and Start plays with it", async () => {
  const bar = await launch(app, { date: "2026-12-09" });
  assert.equal(bar.text("help2"), "Start: open  OK: today");
  assert.equal(bar.text("note"), " ");
  await bar.press("start");
  await bar.advance(8000);
  assert.equal(bar.text("line"), "Snow globe");
  assert.equal(bar.text("note"), "Give it a shake");
  assert.equal(bar.text("help2"), "Start: shake");

  const resting = bar.front.join("\n");
  await bar.press("start");
  await bar.advance(1000);
  assert.notEqual(bar.front.join("\n"), resting);
  assert.equal(bar.writes, 1);
  assert.deepEqual(bar.sounds.length, 1);
});

test("animations follow the clock when the bar draws slowly", async () => {
  const bar = await launch(app, { date: "2026-12-14", store: { record: "2026:" + bits(14) } });
  const early = bar.front.join("\n");
  // Ten seconds pass in one step: the train has moved on as far as it would have frame by frame.
  await bar.advance(10000);
  assert.notEqual(bar.front.join("\n"), early);
  assert.deepEqual(bar.errors, []);
});

test("a door of a later day stays locked", async () => {
  const bar = await launch(app, { date: "2026-12-05" });
  await bar.wheel(3);
  assert.equal(bar.text("title"), "December 8");
  assert.equal(bar.text("line"), "Opens in 3d");
  assert.equal(bar.text("help2"), "OK: today");
  await bar.press("start");
  await bar.advance(2000);
  assert.equal(bar.store.record, undefined);
  assert.deepEqual(bar.sounds, []);
  assert.equal(bar.text("line"), "Opens in 3d");
});

test("a missed door can be opened late, and OK goes back to today", async () => {
  const bar = await launch(app, { date: "2026-12-05" });
  await bar.wheel(-3);
  assert.equal(bar.text("title"), "December 2");
  await bar.press("start");
  assert.equal(bar.store.record, "2026:" + bits(2));
  await bar.press("ok");
  assert.equal(bar.text("title"), "December 5");
  assert.equal(bar.text("line"), "Press Start to open");
});

test("the wheel stops at door 1 and at Christmas Day", async () => {
  const bar = await launch(app, { date: "2026-12-05" });
  await bar.wheel(-10);
  assert.equal(bar.text("title"), "December 1");
  await bar.wheel(40);
  assert.equal(bar.text("title"), "Christmas Day");
  assert.equal(bar.text("line"), "Opens in 20d");
});

test("before December it counts the days and nothing opens", async () => {
  const bar = await launch(app, { date: "2026-11-17" });
  assert.equal(bar.text("title"), "Advent in 14 days");
  assert.equal(bar.text("help2"), " ");
  await bar.press("start");
  assert.equal(bar.store.record, undefined);
  await bar.wheel(1);
  assert.equal(bar.text("title"), "December 1");
  assert.equal(bar.text("line"), "Opens in 14d");
  await bar.press("start");
  assert.equal(bar.store.record, undefined);
});

test("the Test date setting behaves as that day of December", async () => {
  const bar = await launch(app, { date: "2026-11-17", settings: { test_day: "10" } });
  assert.equal(bar.text("title"), "December 10");
  assert.equal(bar.text("help1"), "Test date: 10 Dec");
  await bar.press("start");
  assert.equal(bar.store.record, "2026:" + bits(10));
  await bar.wheel(1);
  assert.equal(bar.text("line"), "Opens in 1d");
});

test("Unlock every door lets any door open at any time of year", async () => {
  const bar = await launch(app, { date: "2026-07-01", settings: { preview: true } });
  assert.equal(bar.text("title"), "December 1");
  await bar.wheel(24);
  assert.equal(bar.text("title"), "Christmas Day");
  await bar.press("start");
  assert.equal(bar.store.record, "2026:" + bits(25));
});

test("the sound can be switched off", async () => {
  const bar = await launch(app, { date: "2026-12-05", settings: { sound: false } });
  await bar.press("start");
  assert.equal(bar.store.record, "2026:" + bits(5));
  assert.deepEqual(bar.sounds, []);
});

test("this season's doors are kept, last year's are forgotten", async () => {
  const kept = await launch(app, { date: "2026-12-05", store: { record: "2026:" + bits(1, 2, 3) } });
  assert.equal(kept.text("count"), "3 of 24 opened");
  const fresh = await launch(app, { date: "2026-12-05", store: { record: "2025:" + bits(1, 2, 3, 4, 5) } });
  assert.equal(fresh.text("count"), "0 of 24 opened");
});

test("in the first week of January everything can still be opened", async () => {
  const bar = await launch(app, { date: "2027-01-03", store: { record: "2026:" + bits(1, 2) } });
  assert.equal(bar.text("title"), "Christmas Day");
  assert.equal(bar.text("count"), "2 of 24 opened");
  await bar.press("start");
  assert.equal(bar.store.record, "2026:" + bits(1, 2, 25));
});

test("an opened door is written to flash once, not on every frame", async () => {
  const bar = await launch(app, { date: "2026-12-05" });
  await bar.press("start");
  await bar.advance(10000);
  await bar.press("start");
  assert.equal(bar.writes, 1);
});

test("the display is asked again after it refuses a frame", async () => {
  const bar = await launch(app, { date: "2026-12-05", drawStatus: 500 });
  assert.equal(bar.front, null);
  bar.drawStatus = 200;
  await bar.advance(500);
  assert.equal(bar.text("title"), "December 5");
  assert.notEqual(bar.front, null);
});

test("Back quits: no timer or listener is left behind", async () => {
  const bar = await launch(app, { date: "2026-12-05" });
  assert.equal(bar.alive, true);
  await bar.press("back");
  assert.equal(bar.alive, false);
  const draws = bar.draws;
  await bar.advance(5000);
  assert.equal(bar.draws, draws);
  assert.deepEqual(bar.errors, []);
});
