export const DAY_MS = 86400000;
/** Minutes east of UTC from an ISO 8601 time such as 2026-12-07T08:15:00+01:00. */
export function parseOffset(timestamp) {
  const m = /([+-])(\d\d):?(\d\d)$/.exec(String(timestamp));
  if (!m) return 0;
  const minutes = parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
  return m[1] === "-" ? -minutes : minutes;
}
/** The bar's local date for `nowMs` (UTC) and its offset: { year, month (1-12), day }. */
export function localDate(nowMs, offsetMin) {
  const d = new Date(nowMs + offsetMin * 60000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate()
  };
}
/**
* The "Test date" setting: pretend it is `testDay` December (1-25) of this
* season, keeping the real year. 0 or anything else keeps the real date.
*/
export function withTestDay(date, testDay) {
  if (!(testDay >= 1 && testDay <= 25)) return date;
  return {
    year: date.month === 1 && date.day <= 6 ? date.year - 1 : date.year,
    month: 12,
    day: testDay
  };
}
/** Reads the setting's value ("real", "1" ... "25") as a day, 0 for the real date. */
export function parseTestDay(value) {
  const n = parseInt(value, 10);
  return n >= 1 && n <= 25 ? n : 0;
}
/**
* Where we are in the season.
* - "countdown": before December (or after Epiphany); every door is locked.
* - "advent": December. Doors up to today open; the finale from the 25th.
* - "after": 1-6 January, everything stays open to look back on.
* `preview` unlocks every door, to try the app at any time of year.
*/
export function season(date, preview) {
  let mode;
  let year;
  let today;
  if (date.month === 12) {
    mode = "advent";
    year = date.year;
    today = Math.min(date.day, 25);
  } else if (date.month === 1 && date.day <= 6) {
    mode = "after";
    year = date.year - 1;
    today = 25;
  } else {
    mode = "countdown";
    year = date.year;
    today = 0;
  }
  const daysToAdvent = mode === "countdown" ? Math.round((Date.UTC(year, 11, 1) - Date.UTC(date.year, date.month - 1, date.day)) / DAY_MS) : 0;
  return {
    mode,
    year,
    today,
    unlocked: preview ? 25 : today,
    daysToAdvent,
    preview: !!preview
  };
}
/** Days until door `day` may be opened. */
export function daysUntil(s, day) {
  if (s.mode === "countdown") return s.daysToAdvent + day - 1;
  return Math.max(0, day - s.today);
}
/** The four Advent Sundays of `year`, as days of December (the first can be in November: 0 or less). */
export function adventSundays(year) {
  const fourth = 24 - new Date(Date.UTC(year, 11, 24)).getUTCDay();
  return [
    fourth - 21,
    fourth - 14,
    fourth - 7,
    fourth
  ];
}
/** Candles burning on the wreath on day `day` of December. */
export function candlesLit(year, day) {
  let n = 0;
  for (const sunday of adventSundays(year)) if (sunday <= day) n++;
  return n;
}
/** A fresh record: nothing opened yet this season. */
export function emptyRecord(year) {
  const opened = [];
  for (let d = 0; d <= 25; d++) opened.push(false);
  return {
    year,
    opened
  };
}
/** Reads the stored record, starting over when it is from another season. */
export function parseRecord(raw, year) {
  const record = emptyRecord(year);
  if (typeof raw !== "string") return record;
  const m = /^(\d{4}):([01]{25})$/.exec(raw);
  if (!m || parseInt(m[1], 10) !== year) return record;
  for (let d = 1; d <= 25; d++) record.opened[d] = m[2][d - 1] === "1";
  return record;
}
/** The record as "2026:1110000000000000000000000", short enough to write to flash rarely. */
export function serializeRecord(record) {
  let bits = "";
  for (let d = 1; d <= 25; d++) bits += record.opened[d] ? "1" : "0";
  return record.year + ":" + bits;
}
export function openedCount(record) {
  let n = 0;
  for (let d = 1; d <= 24; d++) if (record.opened[d]) n++;
  return n;
}
