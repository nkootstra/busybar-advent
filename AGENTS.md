# AGENTS.md

Instructions for AI coding agents working on `Advent Calendar` (`io.kootstra.advent`), a JavaScript application for the BUSY Bar. See [README.md](./README.md) for the full build, packaging and manifest reference.

The app runs on the bar itself, in the firmware's embedded [JerryScript](https://compat-table.github.io/compat-table/es2016plus/#jerryscript3_0_0) runtime. It is not Node.js and not a browser.

## Firmware API boundary

The BUSY Bar firmware is an external dependency of this app.

- Never modify or patch BUSY Bar firmware source code as part of work on this project. Treat the firmware repository as read-only reference material.
- If the required capability is not available in the target firmware, use a supported fallback or degrade gracefully. If neither is possible, report the missing capability and required API version; do not implement a firmware change.
- Before treating a capability as missing, check the target device at `http://<device-host>/docs` and `GET /api/version`, or inspect the matching firmware OpenAPI definitions.
- If the target firmware lacks a required capability, use a supported fallback, degrade gracefully, or report the required API version. Do not invent an endpoint or silently depend on unreleased firmware behavior.

## Entry point and lifecycle

`src/main.ts` or `src/main.js` is the entry point. The build emits it as `scripts/main.js`, the file the firmware starts. It is a script, not a module: the firmware runs it from top to bottom once, it must not export anything, and it starts the app by calling `main()` at the end.

**`main()` is not run in an infinite loop.** It is a one-time launch. The firmware does not keep the app alive because `main()` was called, and it does not restart it when `main()` returns. The app stays alive only while something the script started is still pending:

- an input listener registered with `listen("input", ...)`;
- a pending `setTimeout` or a running `setInterval`;
- a `fetch` request that has not settled yet.

When `main()` returns, the app keeps running while at least one of those remains. Once the last listener is unbound, every interval is cleared, every timeout is cleared or has fired, and every outstanding `fetch` has settled, the JavaScript process exits and the app closes. The bar takes the screen back.

That makes cleanup part of the app design, not an afterthought:

- Keep the reason the app stays alive explicit: one listener or timer per thing the app is doing.
- To quit, release everything: clear every timer, unbind every listener, and let outstanding fetches settle. There is no exit function — releasing the last handle is the exit.
- Do the same cleanup on every path that ends a mode or the app, not only in the `back` handler.
- Do not unbind the last handler from inside that handler's own callback: the process would stop while the callback is still running. Schedule it instead, as the template does with `setTimeout(unbind, 0)`.
- `listen()` accepts one handler at a time and throws if a handler is already attached. Unbind the old one before attaching another.
- Keep `main()` synchronous and start asynchronous work from it explicitly. Give every promise a rejection handler (`void work().catch(report)` or `try`/`catch`); an unhandled rejection must not be the only error path.
- Do not keep the app open with a dummy long-running timer "just in case", and never busy-wait to stay alive.

The shape of a minimal app:

```ts
function main(): void {
  const timer = setInterval(() => {
    // redraw
  }, 1000);

  const unbind = listen("input", (event) => {
    if (event.key !== "back" || event.action !== "short") return;

    clearInterval(timer);
    // The unbind is the last handle: schedule it so this callback returns first.
    setTimeout(unbind, 0);
  });
}

main();
```

## Conserve device resources

The BUSY Bar is a small embedded device. The JavaScript runtime, the web server that serves the bar's HTTP API, and the rest of the firmware share the same CPU and memory. An app that is greedy slows down the whole bar, not just itself.

### Memory

- `heap_size_kib` in `src/appmeta/manifest.json` is the entire heap for the app: 1–512 KiB, 128 KiB by default. Keep the default unless measurements show the app needs more; a larger heap takes memory from other subsystems. Prefer reducing allocations over raising the heap.
- Avoid large buffers, long-lived caches, and unbounded arrays. Keep only the state the app needs and what is currently on screen.
- Send display elements from the data you already have instead of keeping parallel copies of every frame.
- Parse only the fields you need from responses; do not retain whole payloads.
- Logging costs memory and time. Do not log inside tight loops or per-frame redraws.

### Requests and timers

- Every API call is an HTTP request handled by the device's web server. It costs CPU and memory on the bar and can be slow. Poll on human time scales (seconds or minutes), never per frame and never in a loop.
- Keep at most one display request in flight. When one is still unanswered, skip or coalesce the next update rather than queueing it.
- Do not retry immediately on failure. Use a bounded backoff, and stop retrying while the device reports that it is offline or still connecting.
- Send only what changed. Elements are addressed by `id`, so update an element instead of redrawing the whole screen; clear removed ids once with `DisplayClear` instead of resending an empty frame.
- Run timers only while something needs updating, and clear them when the app is idle. Do not use `setInterval(..., 0)` or a `while` loop as a wait.
- Prefer coarse, aligned timers: redraw on the minute rather than every 100 ms, and refresh remote data every few minutes rather than every few seconds.
- Package images, animations and sounds with the app instead of downloading them at runtime, and keep them small. Do not decode large files into memory.

When in doubt, choose the cheaper option: a slower refresh, fewer requests, less data on screen.

## Display, input and settings

- The front display is 72x16 pixels in colour, the back 160x80 in grey (the firmware's status bar takes its right 12 pixels). The front is one `xpmbitmap` element, the whole display as XPM2 text; the back is a bitmap of the tree and six lines of `small` text. `src/bar.js` has every call to the bar, written with `fetch`; the app has no runtime dependencies.
- Give every element a stable `id`, and never reuse an id for another element type: the firmware refuses it.
- `priority` is 1-100. Keep it at 50.
- Colours are `#RRGGBBAA` in elements and `#RRGGBB` inside XPM2. A bitmap takes 32 colours at most; `PALETTE` in `src/canvas.js` has 21. Text is printable ASCII only.
- A line on the back display fits about 22 characters of the `small` font from x 58. `tests/art.test.mjs` holds every scene's lines to 20.
- `listen("input", handler)` delivers `ok`, `start` and `back` with a `press`, `release`, `short`, `long` or `repeat` action, and `encoder` with a direction and a `delta` of `1` or `-1`. It returns an unbind function.
- **Use `short` as the default button action, not `press`.** `short` fires once, after a normal press and release.
- Settings are described in `src/appmeta/settings.json` and read once at start (`GET /api/apps/settings`). An app cannot write them. An enum takes 32 options at most; Test date has 26.
- Time: `Date.now()` is UTC; the bar's own offset comes from `GET /api/time` and is asked again every half hour. The date rules are in `src/calendar.js`, which touches neither the bar nor the clock.
- `localStorage` holds one value, `record`: the season's year and a bit per door. It is written only when a door is opened; every `setItem` rewrites the whole store to flash.

## Speed and memory: measured, not guessed

The bar runs JavaScript slowly and has little memory. Both were measured on BUSY Bar Emulator, which runs apps at the bar's speed (firmware 1.3.1).

- A frame must take less than 125 ms for the 8 frames a second the animations are drawn for. Sending the front display takes the bar about 45 ms of that whatever the app does. `npm run bench` times a frame of every screen: about 61 ms on average, 72 at most. Run it after changing how anything is drawn.
- **A scene is two functions.** `back(cv, ctx)` paints what stands still and runs once, when the door is shown; `draw(cv, t, ctx)` runs on every frame on a copy of that backdrop and paints only what moves. Repainting all 1,152 pixels on every frame gave 3 to 5 frames a second.
- Count in whole numbers in `draw`: the runtime allocates memory for every fraction. `SINE` in `src/canvas.js` is a sine table for that. In `back`, anything goes.
- `sprite` and `rect` clip once per row and write pixels directly; `set` checks every pixel and is for single ones.
- Animations follow the clock: `t` is the time since the door was shown, in eighths of a second, not a count of frames drawn. A slow frame is skipped, never stretched.
- A frame is sent only when it differs from the last one, and one request is in flight at a time.
- The heap is 160 KiB (`heap_size_kib`); the app peaks near 100. The tree on the back display is painted in bands of 12 rows for that reason: a canvas of the whole tree cost another 11 KiB.

## Adding or changing a scene

- Scenes are in `src/scenes.js`, in door order in `SCENES`; what several share (snow, stars, pines, houses) is in `src/scenery.js`.
- A scene has a `caption` and a `note` for the back display, 20 characters at most, and may have an `action`: what Start does on the open door, shown as "Start: <action>". It reads `ctx.poke`, the frames since Start was pressed.
- The day's number sits on a plate in the top-left corner, 10 by 7 pixels: keep moving things off it.
- Look at it: `node tools/render.mjs <first day> <last day>` writes `previews/scenes-*.png`, four moments of each scene; `npm run sim` writes a page that runs the whole app in a browser.
- `npm test` checks every frame of every scene for colours outside the palette, that each scene moves, and that an `action` does something.

## Tests and tools

- `npm test` builds the app, then runs the date rules, the drawing and the built app on a pretend bar (`tools/sim.mjs`): its clock moves only when a test says so.
- `npm run bench` needs BUSY Bar Emulator running and this folder trusted by it.
- `node tools/make-icons.mjs` writes the two icons in `src/appmeta`.
- `node tools/enlarge-screenshots.mjs` writes `docs/screenshots`, the enlarged copies the README shows. Run it after taking new screenshots.
- Screenshots in `screenshots/` come from the emulator (`busy-emulator screenshot`), not from the simulator page: the catalog wants the bar's own picture.

## Before finishing

Run `npm test`, then check:

- [ ] The app quits cleanly when `back` (or the app's quit action) is used: no timer or listener outlives it.
- [ ] No path leaks an interval, timeout or listener; errors do not leave timers running.
- [ ] Memory use is bounded: no unbounded caches, buffers or per-frame copies.
- [ ] Button activation uses `short`, not `press`; holds use `long` and `repeat`.
- [ ] Requests are infrequent and do not pile up; failures back off instead of retrying in a tight loop.
- [ ] Frames send only changed elements and are redrawn only when something visible changes.
- [ ] `src/appmeta/manifest.json` has a valid `id`, `name` and semver `version`, and `api_version` is no higher than needed.
