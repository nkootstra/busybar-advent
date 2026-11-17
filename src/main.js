// Advent Calendar: a door a day on the front display, a tree that fills up on the back.
//
// The wheel browses the doors, Start opens the one shown (or plays with an open one), OK returns to today and Back
// quits. One timer drives everything: it paints a frame, sends it only if it differs from the last one, and waits
// for the bar's answer before the next.
import manifest from "./appmeta/manifest.json";
import {
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
} from "./calendar.js";
import { createCanvas, toXpm } from "./canvas.js";
import { drawScene, sceneOf } from "./scenes.js";
import { TREE_H, TREE_W, drawCountdown, drawDoor, drawOpening, drawTree, paintDoor } from "./screens.js";

const APP = manifest.id;
const API = "http://localhost/api/";
/** One frame of animation. The bar may draw fewer: animations follow the clock, not the number of frames drawn. */
const FRAME_MS = 125;
/** How long a door takes to slide open, and a locked one to rattle, in frames. */
const OPEN_FRAMES = 12;
const RATTLE_FRAMES = 6;
/** The bar's zone can change with daylight saving: ask again this often. */
const TIME_REFRESH_MS = 30 * 60000;
/** `ctx.poke` when Start was not pressed on the open door. */
const NEVER = 9999;
const OPEN_SOUND = "shared/sounds/calendar_event_starts.snd";
const OPEN_LIGHT = "#FFC830FF";
const STORE_KEY = "record";

// ------------------------------------------------------------------------------------------------- the bar

function call(method, path, body) {
  const init =
    body === undefined
      ? { method }
      : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
  return fetch(API + path, init).then((res) =>
    res.text().then((txt) => {
      if (!res.ok) throw new Error(method + " " + path + ": HTTP " + res.status);
      return txt ? JSON.parse(txt) : null;
    }),
  );
}

function report(err) {
  console.error(APP + ": " + (err && err.message ? err.message : String(err)));
}

function loadSettings() {
  return call("GET", "apps/settings?app_id=" + encodeURIComponent(APP)).then(
    (doc) => (doc && doc.values) || {},
    (err) => {
      report(err);
      return {};
    },
  );
}

/** The bar's zone, in minutes east of UTC. */
function loadOffset() {
  return call("GET", "time").then(
    (answer) => parseOffset(answer && answer.timestamp),
    (err) => {
      report(err);
      return 0;
    },
  );
}

function readStore() {
  try {
    if (typeof localStorage !== "undefined") return localStorage.getItem(STORE_KEY);
  } catch (e) {}
  return null;
}

function writeStore(value) {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(STORE_KEY, value);
  } catch (e) {}
}

// --------------------------------------------------------------------------------------------------- state

const front = createCanvas(72, 16);
/** The door that is sliding open, while it does. */
let doorCv = null;

let settings = { sound: true, preview: false, testDay: 0 };
let offset = 0;
let offsetAt = 0;
/** Which doors were opened this season, and where the season stands today. */
let record = null;
let s = null;
/** The door on show: 1-25, or 0 for the countdown before December. */
let selected = 0;

/** Moments, in ms: when the door came on show, was opened, was refused, and when Start last played with it. */
let shownAt = 0;
let openedAt = 0;
let refusedAt = 0;
let pokedAt = 0;

let led = null;
let stopped = false;
let timer = 0;
let sending = false;
/** What the displays show, so that only changes are sent. */
let shownFront = null;
let shownBack = null;
let unbind = null;

/** Frames of animation since the moment `at`. */
function framesSince(at, now) {
  return Math.floor((now - at) / FRAME_MS);
}

// --------------------------------------------------------------------------------------------------- doors

function todaySelection() {
  if (s.mode !== "countdown") return s.today;
  if (!s.preview) return 0;
  // Out of season with every door unlocked: the first one still closed.
  for (let d = 1; d <= 25; d++) if (!record.opened[d]) return d;
  return 25;
}

function refreshSeason() {
  s = season(withTestDay(localDate(Date.now(), offset), settings.testDay), settings.preview);
  if (!record || record.year !== s.year) {
    record = parseRecord(readStore(), s.year);
    show(todaySelection());
  }
}

/** Puts door `day` on show. */
function show(day) {
  selected = day;
  shownAt = Date.now();
  openedAt = refusedAt = pokedAt = 0;
  doorCv = null;
}

function select(day) {
  const first = s.mode === "countdown" && !s.preview ? 0 : 1;
  const next = Math.max(first, Math.min(25, day));
  if (next !== selected) show(next);
}

/** Start: opens the door on show, rattles it when it is locked, or plays with the scene behind an open one. */
function start() {
  if (selected < 1) return;
  const now = Date.now();
  if (record.opened[selected]) {
    pokedAt = now;
    return;
  }
  if (selected > s.unlocked) {
    refusedAt = now;
    return;
  }
  doorCv = createCanvas(72, 16);
  paintDoor(doorCv, selected, framesSince(shownAt, now));
  record.opened[selected] = true;
  writeStore(serializeRecord(record));
  openedAt = shownAt = now;
  led = OPEN_LIGHT;
  if (settings.sound) call("POST", "audio/play", { application_name: APP, stock_path: OPEN_SOUND }).catch(report);
}

// -------------------------------------------------------------------------------------------------- frames

function paintFront(now) {
  const t = framesSince(shownAt, now);
  if (selected === 0) {
    drawCountdown(front, t, s.daysToAdvent);
    return;
  }
  if (record.opened[selected]) {
    const poke = pokedAt ? framesSince(pokedAt, now) : NEVER;
    drawScene(front, selected, t, { candles: candlesLit(s.year, Math.min(selected, 24)), poke });
    if (doorCv) {
      const frame = framesSince(openedAt, now);
      if (frame <= OPEN_FRAMES) drawOpening(front, doorCv, frame, OPEN_FRAMES);
      else doorCv = null;
    }
    return;
  }
  const locked = selected > s.unlocked;
  drawDoor(front, selected, t, { locked, daysLeft: daysUntil(s, selected) });
  const rattle = refusedAt ? framesSince(refusedAt, now) : RATTLE_FRAMES;
  if (rattle < RATTLE_FRAMES) nudge(front, rattle % 2 ? 1 : -1);
}

/** Shifts the picture one pixel sideways, for a locked door that is tried. */
function nudge(cv, dx) {
  const from = cv.px.slice();
  for (let y = 0; y < cv.h; y++) {
    const row = y * cv.w;
    for (let x = 0; x < cv.w; x++) cv.px[row + x] = from[row + Math.min(cv.w - 1, Math.max(0, x - dx))];
  }
}

function backText(id, value, y, color) {
  return { id, type: "text", text: value, x: 58, y, font: "small", color, align: "top_left", display: "back" };
}

/** The back display's elements, or none when it already shows them. */
function backElements() {
  const opened = selected > 0 && record.opened[selected];
  const scene = opened ? sceneOf(selected) : null;
  let title;
  let line;
  if (selected === 0) {
    title = "Advent in " + s.daysToAdvent + (s.daysToAdvent === 1 ? " day" : " days");
    line = "Starts 1 December";
  } else {
    title = selected === 25 ? "Christmas Day" : "December " + selected;
    if (opened) line = scene.caption;
    else if (selected > s.unlocked) line = "Opens in " + daysUntil(s, selected) + "d";
    else line = "Press Start to open";
  }
  const count = openedCount(record);
  const key = selected + "|" + count + "|" + (record.opened[25] ? 1 : 0) + "|" + title + "|" + line;
  if (key === shownBack) return [];
  shownBack = key;

  // The tree is drawn on a canvas of its own that is let go at once: it is needed only when a door changes.
  const treeCv = createCanvas(TREE_W, TREE_H);
  drawTree(treeCv, record.opened, selected);
  const play = opened && scene.action ? scene.action : opened ? "replay" : "open";
  return [
    { id: "tree", type: "xpmbitmap", data: toXpm(treeCv), x: 4, y: 4, align: "top_left", display: "back" },
    backText("title", title, 8, "#FFFFFFFF"),
    backText("line", line, 22, "#C8C8C8FF"),
    backText("note", opened ? scene.note : " ", 32, "#808080FF"),
    backText("count", count + " of 24 opened", 46, "#C8C8C8FF"),
    backText("help1", settings.testDay ? "Test date: " + settings.testDay + " Dec" : "Wheel: browse", 58, "#808080FF"),
    backText("help2", "Start: " + play, 68, "#808080FF"),
  ];
}

function frame(now) {
  paintFront(now);
  const elements = [];
  const xpm = toXpm(front);
  if (xpm !== shownFront) {
    shownFront = xpm;
    elements.push({ id: "front", type: "xpmbitmap", data: xpm, x: 0, y: 0, align: "top_left" });
  }
  const back = backElements();
  for (let i = 0; i < back.length; i++) elements.push(back[i]);
  return elements;
}

function send(elements) {
  const body = { application_name: APP, priority: 50, elements };
  if (led) {
    body.led_notification_color = led;
    led = null;
  }
  return fetch(API + "display/draw", { method: "POST", body: JSON.stringify(body) }).then(
    (res) => {
      // A refused frame is forgotten, so that the next one is sent whole.
      if (res && res.status !== 200) shownFront = shownBack = null;
    },
    (err) => {
      shownFront = shownBack = null;
      report(err);
    },
  );
}

function tick() {
  timer = 0;
  if (stopped) return;
  const started = Date.now();
  if (started - offsetAt > TIME_REFRESH_MS) {
    offsetAt = started;
    loadOffset().then((o) => (offset = o));
  }
  refreshSeason();

  let pending = null;
  if (!sending) {
    const elements = frame(started);
    if (elements.length) {
      sending = true;
      pending = send(elements).then(() => (sending = false));
    }
  }
  const schedule = () => {
    if (stopped) return;
    timer = setTimeout(tick, Math.max(10, FRAME_MS - (Date.now() - started)));
  };
  if (pending) pending.then(schedule);
  else schedule();
}

// --------------------------------------------------------------------------------------------------- input

function quit() {
  stopped = true;
  if (timer) clearTimeout(timer);
  // The listener is the last thing keeping the app alive: let this handler return before it goes.
  setTimeout(() => unbind && unbind(), 0);
}

function onInput(event) {
  if (stopped || !s) return;
  if (event.key === "encoder") select(selected + event.delta);
  else if (event.action !== "short") return;
  else if (event.key === "start") start();
  else if (event.key === "ok") select(todaySelection());
  else if (event.key === "back") quit();
}

function main() {
  unbind = listen("input", onInput);
  Promise.all([loadSettings(), loadOffset()]).then(([values, o]) => {
    settings = {
      sound: values.sound !== false,
      preview: values.preview === true,
      testDay: parseTestDay(values.test_day),
    };
    offset = o;
    offsetAt = Date.now();
    refreshSeason();
    tick();
  }, report);
}

main();
