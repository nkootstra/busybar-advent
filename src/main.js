import manifest from "./appmeta/manifest.json";
import {
  caption,
  createCanvas,
  drawCountdown,
  drawDoor,
  drawOpening,
  drawScene,
  drawTree,
  toXpm,
} from "./art.js";
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

const APP = manifest.id;
const API = "http://localhost/api/";
const FRAME_MS = 125;
const OPEN_FRAMES = 12;
const TIME_REFRESH_MS = 30 * 60000;
const OPEN_SOUND = "shared/sounds/calendar_event_starts.snd";
const OPEN_LIGHT = "#FFC830FF";
const STORE_KEY = "record";
function call(method, path, body) {
  const init = body === undefined ? { method } : {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
  return fetch(API + path, init).then((res) => res.text().then((txt) => {
    if (!res.ok) throw new Error(method + " " + path + ": HTTP " + res.status);
    return txt ? JSON.parse(txt) : null;
  }));
}
function report(err) {
  console.error(APP + ": " + (err && err.message ? err.message : String(err)));
}
function loadSettings() {
  return call("GET", "apps/settings?app_id=" + encodeURIComponent(APP)).then((doc) => doc && doc.values || {}, (err) => {
    report(err);
    return {};
  });
}
function loadOffset() {
  return call("GET", "time").then((answer) => parseOffset(answer && answer.timestamp), (err) => {
    report(err);
    return 0;
  });
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
const front = createCanvas(72, 16);
const doorCv = createCanvas(72, 16);
const treeCv = createCanvas(48, 72);
let settings = {
  sound: true,
  preview: false,
  testDay: 0
};
let offset = 0;
let offsetAt = 0;
let record = null;
let s = null;
let selected = 0;
let t = 0;
let opening = -1;
let shake = 0;
let led = null;
let stopped = false;
let timer = 0;
let sending = false;
let shownFront = null;
let shownBack = null;
let unbind = null;
function todaySelection() {
  if (s.mode === "countdown" && !s.preview) return 0;
  if (s.preview && s.mode === "countdown") {
    for (let d = 1; d <= 25; d++) if (!record.opened[d]) return d;
    return 25;
  }
  return s.today;
}
function refreshSeason() {
  s = season(withTestDay(localDate(Date.now(), offset), settings.testDay), settings.preview);
  if (!record || record.year !== s.year) {
    record = parseRecord(readStore(), s.year);
    selected = todaySelection();
  }
}
function select(day) {
  const min = s.mode === "countdown" && !s.preview ? 0 : 1;
  const next = Math.max(min, Math.min(25, day));
  if (next === selected) return;
  selected = next;
  t = 0;
  opening = -1;
  shake = 0;
}
function open() {
  if (selected < 1) return;
  if (record.opened[selected]) {
    t = 0;
    return;
  }
  if (selected > s.unlocked) {
    shake = 6;
    return;
  }
  drawDoor(doorCv, selected, t, { locked: false });
  record.opened[selected] = true;
  writeStore(serializeRecord(record));
  opening = 0;
  t = 0;
  led = OPEN_LIGHT;
  if (settings.sound) call("POST", "audio/play", {
    application_name: APP,
    stock_path: OPEN_SOUND
  }).catch(report);
}
function paintFront() {
  if (selected === 0) {
    drawCountdown(front, t, s.daysToAdvent);
    return;
  }
  const ctx = { candles: candlesLit(s.year, Math.min(selected, 24)) };
  if (opening >= 0) {
    drawScene(front, selected, t, ctx);
    drawOpening(front, doorCv, opening, OPEN_FRAMES);
    return;
  }
  if (record.opened[selected]) {
    drawScene(front, selected, t, ctx);
    return;
  }
  const locked = selected > s.unlocked;
  drawDoor(front, selected, t, {
    locked,
    daysLeft: daysUntil(s, selected)
  });
  if (shake > 0) {
    const dx = shake % 2 ? 1 : -1;
    const copy = front.px.slice();
    for (let y = 0; y < 16; y++) for (let x = 0; x < 72; x++) {
      const sx = Math.min(71, Math.max(0, x - dx));
      front.px[y * 72 + x] = copy[y * 72 + sx];
    }
  }
}
function backText(id, value, y, color) {
  return {
    id,
    type: "text",
    text: value,
    x: 58,
    y,
    font: "small",
    color,
    align: "top_left",
    display: "back"
  };
}
function backElements() {
  let title;
  let line;
  if (selected === 0) {
    title = "Advent in " + s.daysToAdvent + (s.daysToAdvent === 1 ? " day" : " days");
    line = "Starts 1 December";
  } else {
    title = selected === 25 ? "Christmas Day" : "December " + selected;
    if (record.opened[selected]) line = caption(selected);
    else if (selected > s.unlocked) line = "Opens in " + daysUntil(s, selected) + "d";
    else line = "Press Start to open";
  }
  const count = openedCount(record) + " of 24 opened";
  const key = [
    selected,
    serializeRecord(record),
    title,
    line
  ].join("|");
  if (key === shownBack) return [];
  shownBack = key;
  drawTree(treeCv, record.opened, selected);
  return [
    {
      id: "tree",
      type: "xpmbitmap",
      data: toXpm(treeCv),
      x: 4,
      y: 4,
      align: "top_left",
      display: "back"
    },
    backText("title", title, 8, "#FFFFFFFF"),
    backText("line", line, 22, "#C8C8C8FF"),
    backText("count", count, 40, "#C8C8C8FF"),
    backText("help1", settings.testDay ? "Test date: " + settings.testDay + " Dec" : "Wheel: browse", 58, "#808080FF"),
    backText("help2", "Start: open  OK: today", 68, "#808080FF")
  ];
}
function frame() {
  paintFront();
  const elements = [];
  const xpm = toXpm(front);
  if (xpm !== shownFront) {
    shownFront = xpm;
    elements.push({
      id: "front",
      type: "xpmbitmap",
      data: xpm,
      x: 0,
      y: 0,
      align: "top_left"
    });
  }
  const back = backElements();
  for (let i = 0; i < back.length; i++) elements.push(back[i]);
  return elements;
}
function send(elements) {
  const body = {
    application_name: APP,
    priority: 50,
    elements
  };
  if (led) {
    body.led_notification_color = led;
    led = null;
  }
  return fetch("http://localhost/api/display/draw", {
    method: "POST",
    body: JSON.stringify(body)
  }).then((res) => {
    if (res && res.status !== 200) shownFront = shownBack = null;
  }, (err) => {
    shownFront = shownBack = null;
    report(err);
  });
}
function tick() {
  timer = 0;
  if (stopped) return;
  const started = Date.now();
  if (started - offsetAt > TIME_REFRESH_MS) {
    offsetAt = started;
    loadOffset().then((o) => offset = o);
  }
  refreshSeason();
  let pending = null;
  if (!sending) {
    const elements = frame();
    if (elements.length) {
      sending = true;
      pending = send(elements).then(() => sending = false);
    }
  }
  t++;
  if (opening >= 0 && ++opening > OPEN_FRAMES) opening = -1;
  if (shake > 0) shake--;
  const schedule = () => {
    if (stopped) return;
    timer = setTimeout(tick, Math.max(10, FRAME_MS - (Date.now() - started)));
  };
  if (pending) pending.then(schedule);
  else schedule();
}
function quit() {
  stopped = true;
  if (timer) clearTimeout(timer);
  setTimeout(() => unbind && unbind(), 0);
}
function onInput(event) {
  if (stopped || !s) return;
  if (event.key === "encoder") select(selected + event.delta);
  else if (event.action !== "short") return;
  else if (event.key === "start") open();
  else if (event.key === "ok") select(todaySelection());
  else if (event.key === "back") quit();
}
function main() {
  unbind = listen("input", onInput);
  Promise.all([loadSettings(), loadOffset()]).then(([values, o]) => {
    settings = {
      sound: values.sound !== false,
      preview: values.preview === true,
      testDay: parseTestDay(values.test_day)
    };
    offset = o;
    offsetAt = Date.now();
    refreshSeason();
    tick();
  }, report);
}
main();
