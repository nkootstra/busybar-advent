// A pretend BUSY Bar for tests: runs the built app (dist/*.tgz) with the bar's globals replaced by fakes,
// and a clock that only moves when a test says so.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "./bundle.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const API = "http://localhost/api/";
const flush = () => new Promise((done) => setImmediate(done));

/**
 * The code of the built app as one script. The package is unpacked and its `scripts/main.js` joined with the
 * modules it imports, so the tests run what `busy-cli build` produced, not the sources.
 */
export async function builtApp() {
  const dist = join(root, "dist");
  const archive = existsSync(dist) && readdirSync(dist).find((name) => name.endsWith(".tgz"));
  if (!archive) throw new Error("no package in dist/: run `npm run build` first");
  const dir = mkdtempSync(join(tmpdir(), "advent-sim-"));
  try {
    execFileSync("tar", ["xzf", join(dist, archive), "-C", dir]);
    return await bundle(join(dir, readdirSync(dir)[0], "scripts", "main.js"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const pad = (n) => String(n).padStart(2, "0");

/** An XPM2 bitmap as rows of palette characters. */
export function xpmRows(data) {
  const lines = data.split("\n");
  const [, height, colors] = lines[1].split(" ").map(Number);
  return lines.slice(2 + colors, 2 + colors + height);
}

/**
 * Starts `code` on a pretend bar.
 * @param {string} code - the app as one script, from `builtApp()`.
 * @param {object} [options]
 * @param {string} [options.date] - the bar's local date, YYYY-MM-DD.
 * @param {string} [options.time] - the bar's local time, HH:MM.
 * @param {number} [options.offsetMin] - the bar's zone, minutes east of UTC.
 * @param {object} [options.settings] - values of the app's settings.
 * @param {object} [options.store] - what localStorage holds at launch.
 * @param {number} [options.drawStatus] - HTTP status the display answers with.
 */
export async function launch(code, options = {}) {
  const { date = "2026-12-01", time = "08:00", offsetMin = 60, settings = {}, store = {}, drawStatus = 200 } = options;
  let now = Date.parse(date + "T" + time + ":00Z") - offsetMin * 60000;
  let nextTimer = 1;
  const timers = new Map();

  const bar = {
    /** The front display's bitmap as rows of palette characters, or null. */
    front: null,
    /** The back display's elements by id. */
    back: {},
    sounds: [],
    lights: [],
    errors: [],
    /** How many draw requests reached the display. */
    draws: 0,
    /** Writes to localStorage since launch. */
    writes: 0,
    store: { ...store },
    settings: { ...settings },
    drawStatus,
    handler: null,
    /** Whether anything still keeps the app alive. */
    get alive() {
      return bar.handler !== null || timers.size > 0;
    },
    /** A line of text on the back display. */
    text(id) {
      return bar.back[id] ? bar.back[id].text : null;
    },
    /** Lets `ms` of the bar's time pass, running the timers that fall due. */
    async advance(ms) {
      const end = now + ms;
      for (;;) {
        await flush();
        let due = null;
        for (const [id, timer] of timers) if (timer.at <= end && (!due || timer.at < due.at)) due = { id, ...timer };
        if (!due) break;
        timers.delete(due.id);
        now = Math.max(now, due.at);
        due.run();
      }
      now = end;
      await flush();
    },
    async press(key, action = "short") {
      if (bar.handler) bar.handler({ key, action });
      await bar.advance(200);
    },
    async wheel(clicks) {
      for (let i = 0; i < Math.abs(clicks); i++) {
        const delta = clicks > 0 ? 1 : -1;
        if (bar.handler) bar.handler({ key: "encoder", action: delta > 0 ? "clockwise" : "counterclockwise", delta });
      }
      await bar.advance(200);
    },
  };

  class BarDate extends Date {
    constructor(...args) {
      if (args.length) super(...args);
      else super(now);
    }
    static now() {
      return now;
    }
  }

  const reply = (status, body) =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(body == null ? "" : JSON.stringify(body)),
    });

  const fetch = (url, init = {}) => {
    const path = String(url).slice(API.length);
    const method = init.method || "GET";
    if (!String(url).startsWith(API)) return Promise.reject(new Error("no network: " + url));
    if (path === "time") {
      const local = new Date(now + offsetMin * 60000).toISOString().slice(0, 19);
      const abs = Math.abs(offsetMin);
      return reply(200, { timestamp: local + (offsetMin < 0 ? "-" : "+") + pad(Math.floor(abs / 60)) + ":" + pad(abs % 60) });
    }
    if (path.startsWith("apps/settings")) return reply(200, { values: bar.settings });
    if (path === "audio/play") {
      bar.sounds.push(JSON.parse(init.body).stock_path);
      return reply(200, null);
    }
    if (path === "display/draw" && method === "POST") {
      if (bar.drawStatus !== 200) return reply(bar.drawStatus, null);
      const body = JSON.parse(init.body);
      bar.draws++;
      for (const el of body.elements) {
        if (el.display === "back") bar.back[el.id] = el;
        else if (el.id === "front") bar.front = xpmRows(el.data);
      }
      if (body.led_notification_color) bar.lights.push(body.led_notification_color);
      return reply(200, null);
    }
    return reply(404, null);
  };

  const localStorage = {
    getItem: (key) => (key in bar.store ? bar.store[key] : null),
    setItem: (key, value) => {
      bar.store[key] = String(value);
      bar.writes++;
    },
  };
  const listen = (type, handler) => {
    if (type !== "input") throw new TypeError("unknown event type");
    if (bar.handler) throw new TypeError("handler already attached");
    bar.handler = handler;
    return () => {
      if (bar.handler === handler) bar.handler = null;
    };
  };
  const setTimeout = (run, ms = 0) => {
    const id = nextTimer++;
    timers.set(id, { at: now + ms, run });
    return id;
  };
  const clearTimeout = (id) => void timers.delete(id);
  const console = { log() {}, warn() {}, error: (...args) => bar.errors.push(args.join(" ")) };

  new Function("localStorage", "Date", "fetch", "listen", "setTimeout", "clearTimeout", "console", code)(
    localStorage,
    BarDate,
    fetch,
    listen,
    setTimeout,
    clearTimeout,
    console,
  );
  await bar.advance(200);
  return bar;
}
