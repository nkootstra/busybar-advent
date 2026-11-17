import assert from "node:assert/strict";
import { test } from "node:test";
import {
  adventSundays,
  candlesLit,
  daysUntil,
  localDate,
  openedCount,
  parseOffset,
  parseRecord,
  parseTestDay,
  season,
  serializeRecord,
  withTestDay,
} from "../src/calendar.js";

const on = (year, month, day, preview = false) => season({ year, month, day }, preview);

test("the bar's offset is read from its timestamp", () => {
  assert.equal(parseOffset("2026-12-07T08:15:00+01:00"), 60);
  assert.equal(parseOffset("2026-12-07T08:15:00-05:30"), -330);
  assert.equal(parseOffset("2026-12-07T08:15:00+0200"), 120);
  assert.equal(parseOffset("2026-12-07T08:15:00Z"), 0);
  assert.equal(parseOffset(undefined), 0);
});

test("the local date follows the bar's zone across midnight", () => {
  const lateEvening = Date.UTC(2026, 10, 30, 23, 30);
  assert.deepEqual(localDate(lateEvening, 0), { year: 2026, month: 11, day: 30 });
  assert.deepEqual(localDate(lateEvening, 60), { year: 2026, month: 12, day: 1 });
  assert.deepEqual(localDate(Date.UTC(2027, 0, 1, 2, 0), -300), { year: 2026, month: 12, day: 31 });
});

test("before December the calendar counts down and every door is locked", () => {
  const s = on(2026, 11, 17);
  assert.equal(s.mode, "countdown");
  assert.equal(s.daysToAdvent, 14);
  assert.equal(s.unlocked, 0);
  assert.equal(daysUntil(s, 1), 14);
  assert.equal(daysUntil(s, 24), 37);
  assert.equal(on(2026, 11, 30).daysToAdvent, 1);
});

test("in December doors open up to today, and the finale from the 25th", () => {
  const s = on(2026, 12, 7);
  assert.equal(s.mode, "advent");
  assert.equal(s.unlocked, 7);
  assert.equal(daysUntil(s, 7), 0);
  assert.equal(daysUntil(s, 3), 0);
  assert.equal(daysUntil(s, 10), 3);
  assert.equal(on(2026, 12, 24).unlocked, 24);
  assert.equal(on(2026, 12, 25).unlocked, 25);
  assert.equal(on(2026, 12, 31).unlocked, 25);
});

test("the first week of January still belongs to last December", () => {
  const s = on(2027, 1, 6);
  assert.equal(s.mode, "after");
  assert.equal(s.year, 2026);
  assert.equal(s.unlocked, 25);
  const next = on(2027, 1, 7);
  assert.equal(next.mode, "countdown");
  assert.equal(next.year, 2027);
  assert.equal(next.daysToAdvent, 328);
});

test("unlocking every door does not change the date", () => {
  const s = on(2026, 11, 17, true);
  assert.equal(s.mode, "countdown");
  assert.equal(s.unlocked, 25);
  assert.equal(s.today, 0);
});

test("the test date replaces the day and keeps the season's year", () => {
  assert.deepEqual(withTestDay({ year: 2026, month: 11, day: 17 }, 10), { year: 2026, month: 12, day: 10 });
  assert.deepEqual(withTestDay({ year: 2027, month: 1, day: 3 }, 24), { year: 2026, month: 12, day: 24 });
  assert.deepEqual(withTestDay({ year: 2026, month: 11, day: 17 }, 0), { year: 2026, month: 11, day: 17 });
  assert.equal(parseTestDay("real"), 0);
  assert.equal(parseTestDay("25"), 25);
  assert.equal(parseTestDay("26"), 0);
  assert.equal(parseTestDay(undefined), 0);
});

test("Advent Sundays are the four before Christmas", () => {
  // 2026: 29 November, then 6, 13 and 20 December.
  assert.deepEqual(adventSundays(2026), [-1, 6, 13, 20]);
  // 2023: Christmas Eve is the fourth Sunday.
  assert.deepEqual(adventSundays(2023), [3, 10, 17, 24]);
  // 2028: Christmas Eve is also a Sunday.
  assert.deepEqual(adventSundays(2028), [3, 10, 17, 24]);
  assert.deepEqual(adventSundays(2027), [-2, 5, 12, 19]);
});

test("a candle burns for every Advent Sunday so far", () => {
  assert.equal(candlesLit(2026, 1), 1);
  assert.equal(candlesLit(2026, 5), 1);
  assert.equal(candlesLit(2026, 6), 2);
  assert.equal(candlesLit(2026, 19), 3);
  assert.equal(candlesLit(2026, 24), 4);
  assert.equal(candlesLit(2023, 2), 0);
});

test("the record survives a round trip and starts over in a new season", () => {
  const record = parseRecord(null, 2026);
  assert.equal(openedCount(record), 0);
  record.opened[1] = record.opened[7] = record.opened[25] = true;
  const stored = serializeRecord(record);
  assert.equal(stored, "2026:1000001000000000000000001");
  const again = parseRecord(stored, 2026);
  assert.deepEqual(again, record);
  assert.equal(openedCount(again), 2);
  assert.equal(openedCount(parseRecord(stored, 2027)), 0);
  assert.equal(openedCount(parseRecord("2026:garbage", 2026)), 0);
  assert.equal(openedCount(parseRecord(42, 2026)), 0);
});
