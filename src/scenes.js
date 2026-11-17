// What is behind the doors: 24 pixel scenes and the finale for Christmas Day, 72x16 each.
//
// The bar runs JavaScript slowly, so a scene is two functions. `back` paints everything that stands still and runs
// once, when the door is shown. `draw` runs on every frame, on a copy of that backdrop, and paints only what moves.
// Keep `draw` to a few hundred pixels.
//
// `t` counts frames of 1/8 s since the door was shown. `ctx.candles` is the number of Advent Sundays so far and
// `ctx.poke` the frames since Start was pressed on the open door (large when it was not): scenes with an `action`
// answer to it.
import { backdrop, disc, fill, rect, rnd, set, sprite, text, textWidth } from "./canvas.js";
import {
  DARK_PINE,
  HOUSE,
  LIGHTS,
  PINE,
  TREE,
  W,
  hills,
  mirror,
  snow,
  snowGround,
  stars,
  treeLights,
  twinkle,
} from "./scenery.js";


/** Draws a day number on a dark plate in the top-left corner. */
function badge(cv, day) {
  const label = String(day);
  rect(cv, 0, 0, textWidth(label) + 2, 7, "n");
  text(cv, 1, 1, label, "Y");
}

// ---------------------------------------------------------------------------------------------------- scenes

const village = {
  caption: "First snow",
  note: "Winter is here",
  back(cv) {
    fill(cv, "n");
    stars(cv, 10, 3, 8);
    disc(cv, 64, 3, 2, "Y");
    sprite(cv, 5, 5, HOUSE);
    sprite(cv, 26, 5, HOUSE);
    sprite(cv, 49, 5, HOUSE);
    sprite(cv, 17, 8, PINE);
    sprite(cv, 39, 8, PINE);
    sprite(cv, 61, 8, PINE);
    snowGround(cv, 14);
  },
  draw(cv, t) {
    twinkle(cv, t, 10, 3, 8);
    // Windows go dark now and then, as if someone walked past.
    if ((t >> 4) % 5 === 2) set(cv, 32, 11, "b");
    if ((t >> 3) % 7 === 4) set(cv, 51, 11, "b");
    snow(cv, t, 16, 1);
  },
};

const SNOWMAN = [
  "   kkk   ",
  "   kkk   ",
  "  kkkkk  ",
  "   www   ",
  "  w.w.w  ",
  "  wwoww  ",
  "  rrrrr  ",
  " wwwwrww ",
  "wwww.wwww",
  "wwwwwwwww",
  "wwww.wwww",
  " wwwwwww ",
];
const snowman = {
  caption: "A snowman",
  note: "He waves hello",
  back(cv) {
    fill(cv, "n");
    stars(cv, 9, 21, 9);
    sprite(cv, 6, 8, PINE);
    sprite(cv, 60, 8, PINE);
    snowGround(cv, 14);
    sprite(cv, 31, 2, SNOWMAN);
    set(cv, 31, 10, "b");
    set(cv, 30, 9, "b");
    set(cv, 29, 8, "b");
  },
  draw(cv, t) {
    twinkle(cv, t, 9, 21, 9);
    if (t % 40 < 2) {
      set(cv, 34, 6, "w");
      set(cv, 36, 6, "w");
    }
    const up = (t >> 2) % 2 === 0;
    set(cv, 39, 10, "b");
    set(cv, 40, up ? 9 : 10, "b");
    set(cv, 41, up ? 8 : 9, "b");
    snow(cv, t, 14, 5);
  },
};

/** The centre line of a candy cane, from the foot up and around the hook. */
const CANE = [];
for (let y = 12; y >= 4; y--) CANE.push([0, y]);
CANE.push([1, 3], [2, 2], [3, 2], [4, 2], [5, 3], [6, 4], [6, 5]);
const candyCanes = {
  caption: "Candy canes",
  note: "Sweet and stripy",
  back(cv) {
    fill(cv, "N");
    stars(cv, 8, 33, 7);
    snowGround(cv, 14);
    for (const x of [24, 43, 62]) {
      sprite(cv, x, 11, [" g g ", "ggrgg", " grg "]);
    }
  },
  draw(cv, t) {
    for (let n = 0; n < 3; n++) {
      const x = 13 + n * 19;
      for (let k = 0; k < CANE.length; k++) {
        const at = CANE[k];
        rect(cv, x + at[0], at[1], 2, 2, (k + n + (t >> 1)) % 4 < 2 ? "r" : "w");
      }
    }
    twinkle(cv, t, 8, 33, 7);
  },
};

const cocoa = {
  caption: "Hot cocoa",
  note: "Mind the steam",
  back(cv) {
    fill(cv, "n");
    stars(cv, 7, 45, 6);
    rect(cv, 0, 15, W, 1, "b");
    // The mug, with marshmallows on top and a saucer under it.
    rect(cv, 29, 8, 12, 6, "r");
    rect(cv, 29, 7, 12, 1, "R");
    rect(cv, 31, 6, 2, 1, "w");
    rect(cv, 35, 6, 3, 1, "w");
    sprite(cv, 41, 9, ["rr ", "  r", "  r", "rr "]);
    sprite(cv, 32, 9, ["w w w", " www ", "w w w"]);
    rect(cv, 27, 14, 17, 1, "w");
    // A plate of biscuits.
    rect(cv, 8, 14, 13, 1, "w");
    disc(cv, 11, 12, 1, "B");
    disc(cv, 16, 12, 1, "B");
    set(cv, 11, 12, "b");
    set(cv, 16, 12, "b");
    // A candle.
    rect(cv, 55, 9, 3, 5, "w");
    rect(cv, 53, 14, 7, 1, "y");
    set(cv, 56, 8, "k");
  },
  draw(cv, t) {
    twinkle(cv, t, 7, 45, 6);
    for (let i = 0; i < 3; i++) {
      for (let k = 0; k < 6; k++) {
        if ((k + (t >> 1) + i) % 3 === 0) continue;
        const x = 31 + i * 4 + Math.round(Math.sin(t * 0.25 + k * 0.8 + i * 2));
        set(cv, x, 5 - k, k < 2 ? "s" : k < 4 ? "K" : "k");
      }
    }
    set(cv, 56, 7, "o");
    set(cv, 56 + (t % 7 === 0 ? 1 : 0), 6, t % 3 ? "Y" : "y");
  },
};

/** Week of Advent: candles burn for every Advent Sunday so far. */
const WREATH_X = [20, 30, 40, 50];
const wreath = {
  caption: "Advent wreath",
  note: "A candle each Sunday",
  back(cv) {
    fill(cv, "n");
    stars(cv, 6, 9, 5);
    const colors = ["m", "m", "p", "m"];
    for (let i = 0; i < 4; i++) {
      const x = WREATH_X[i];
      rect(cv, x, 6, 3, 7, colors[i]);
      set(cv, x + 2, 6, "w");
      set(cv, x + 1, 5, "k");
    }
    rect(cv, 17, 12, 38, 1, "d");
    rect(cv, 14, 13, 44, 2, "g");
    rect(cv, 17, 15, 38, 1, "d");
    for (let x = 15; x < 57; x += 2) set(cv, x, 13 + (x % 3 === 0 ? 1 : 0), "G");
    for (let x = 17; x < 57; x += 6) set(cv, x, 14, "r");
  },
  draw(cv, t, ctx) {
    twinkle(cv, t, 6, 9, 5);
    for (let i = 0; i < 4 && i < ctx.candles; i++) {
      const x = WREATH_X[i];
      const sway = ((t >> 1) + i * 2) % 5 === 0 ? 1 : (t + i) % 7 === 0 ? -1 : 0;
      set(cv, x + 1, 4, "o");
      set(cv, x + 1, 3, "y");
      set(cv, x + 1 + sway, 2, (t + i) % 3 ? "Y" : "y");
    }
  },
};

const BOOT = [
  " wwwwwww    ",
  " wwwwwww    ",
  " rrrrrrr    ",
  " rrrrrrr    ",
  " rrrrrrr    ",
  " rrrrrrrrr  ",
  " rrrrrrrrrrr",
  " rrrrrrrrrrr",
  " kkkkkkkkkkk",
];
const boot = {
  caption: "St Nicholas Day",
  note: "Treats in the boot",
  back(cv) {
    fill(cv, "n");
    stars(cv, 9, 57, 7);
    snowGround(cv, 14);
    sprite(cv, 29, 5, BOOT);
    // What he left: a candy cane, a mandarin and a parcel.
    sprite(cv, 30, 1, [" wr", "r  ", "w  ", "r  "]);
    disc(cv, 34, 3, 1, "o");
    rect(cv, 36, 2, 2, 3, "G");
    set(cv, 36, 3, "y");
    set(cv, 37, 3, "y");
    // A carrot for the horse and a second, smaller shoe.
    sprite(cv, 14, 12, ["ggooooo", "  ooo  "]);
    sprite(cv, 50, 9, [" wwww   ", " BBBB   ", " BBBBBB ", " BBBBBBB", " bbbbbbb"]);
  },
  draw(cv, t) {
    twinkle(cv, t, 9, 57, 7);
    const spark = [
      [33, 1],
      [38, 1],
      [35, 0],
      [53, 7],
    ];
    const at = spark[(t >> 2) % spark.length];
    set(cv, at[0], at[1], t % 4 < 2 ? "Y" : "w");
    snow(cv, t, 12, 23);
  },
};

const SKATER = [
  ["  rr  ", "  ff  ", "yymmm ", "  mmm ", "  KK  ", "  K K ", " ww ww"],
  ["  rr  ", "  ff  ", " ymmm ", "y mmm ", "  KK  ", " K  K ", "ww  ww"],
];
const SKATER_LEFT = SKATER.map(mirror);
const skating = {
  caption: "On the ice",
  note: "Glide and twirl",
  back(cv) {
    fill(cv, "n");
    stars(cv, 10, 71, 6);
    disc(cv, 60, 3, 2, "Y");
    rect(cv, 0, 12, W, 4, "c");
    for (let x = 3; x < W; x += 7) rect(cv, x, 13 + (x % 3), 3, 1, "s");
    // Snowy banks with a pine on each.
    for (let x = 0; x < 9; x++) {
      const h = x < 5 ? 5 : 9 - x;
      rect(cv, x, 16 - h - 1, 1, h + 1, "s");
      set(cv, x, 16 - h - 1, "w");
      rect(cv, W - 1 - x, 16 - h - 1, 1, h + 1, "s");
      set(cv, W - 1 - x, 16 - h - 1, "w");
    }
    sprite(cv, 0, 4, PINE);
    sprite(cv, 67, 4, PINE);
  },
  draw(cv, t) {
    twinkle(cv, t, 10, 71, 6);
    const p = t % 96;
    const right = p < 48;
    const x = right ? 10 + p : 10 + 96 - p;
    // The line the skates leave behind.
    for (let k = 1; k < 6; k++) set(cv, x + 3 + (right ? -k * 2 : k * 2), 13, "w");
    sprite(cv, x, 6, (right ? SKATER : SKATER_LEFT)[(t >> 2) % 2]);
  },
};

const GINGER = [
  "    BBB    ",
  "   BBBBB   ",
  "   BwBwB   ",
  "   BwwwB   ",
  "    BBB    ",
  "wBBBBBBBBBw",
  "   BBrBB   ",
  "   BBBBB   ",
  "   BBrBB   ",
  "   BB BB   ",
  "  BBB BBB  ",
  "  www www  ",
];
const GINGER_WAVE = GINGER.slice();
GINGER_WAVE[4] = "    BBB  Bw";
GINGER_WAVE[5] = "wBBBBBBBB  ";
const gingerbread = {
  caption: "Gingerbread",
  note: "Fresh from the oven",
  back(cv) {
    fill(cv, "N");
    for (let y = 13; y < 16; y++) {
      for (let x = 0; x < W; x++) set(cv, x, y, ((x >> 1) + (y >> 1)) % 2 ? "r" : "w");
    }
    for (const cx of [11, 60]) {
      disc(cv, cx, 9, 3, "B");
      set(cv, cx - 1, 8, "b");
      set(cv, cx + 1, 10, "b");
      set(cv, cx + 2, 8, "b");
    }
  },
  draw(cv, t) {
    sprite(cv, 30, 1 - ((t >> 2) % 4 === 1 ? 1 : 0), (t >> 3) % 2 ? GINGER_WAVE : GINGER);
    set(cv, (t * 3) % W, 2, "w");
  },
};

const snowGlobe = {
  caption: "Snow globe",
  note: "Give it a shake",
  action: "shake",
  back(cv) {
    fill(cv, "n");
    stars(cv, 8, 83, 8);
    rect(cv, 0, 15, W, 1, "b");
    // The glass, the little world in it and the stand.
    disc(cv, 36, 6, 6, "s");
    disc(cv, 36, 6, 5, "N");
    rect(cv, 32, 10, 9, 2, "w");
    sprite(cv, 34, 5, ["  g  ", " ggg ", "  g  ", " ggg ", "ggggg"]);
    set(cv, 33, 2, "w");
    set(cv, 32, 3, "w");
    rect(cv, 30, 12, 13, 1, "b");
    rect(cv, 28, 13, 17, 2, "B");
    // Parcels on the table.
    rect(cv, 11, 10, 7, 5, "g");
    rect(cv, 14, 10, 1, 5, "y");
    rect(cv, 11, 12, 7, 1, "y");
    rect(cv, 54, 9, 8, 6, "m");
    rect(cv, 57, 9, 2, 6, "p");
    rect(cv, 54, 11, 8, 1, "p");
  },
  draw(cv, t, ctx) {
    twinkle(cv, t, 8, 83, 8);
    if (ctx.poke < 48) {
      // Shaken: the snow whirls around, slower as it settles.
      const pace = ctx.poke < 24 ? 0.9 : 0.45;
      for (let i = 0; i < 14; i++) {
        const dx = Math.round(4.6 * Math.sin(t * pace * (0.6 + rnd(i) * 0.8) + i * 1.7));
        const dy = Math.round(4.2 * Math.cos(t * pace * (0.5 + rnd(i + 9) * 0.7) + i * 2.3));
        if (dx * dx + dy * dy <= 24) set(cv, 36 + dx, 6 + dy, i % 3 ? "w" : "s");
      }
    } else {
      for (let i = 0; i < 4; i++) set(cv, 33 + i * 2, 2 + ((i * 3 + (t >> 2)) % 8), "w");
    }
  },
};

const ROBIN = [
  ["   BBB  ", "  BB.By ", "bBBBoo  ", " bBooo  ", "  Bwww  ", "   K K  "],
  ["  BBB   ", " BB.By  ", "bBBBoo  ", " bBooo  ", "  Bwww  ", "   K K  "],
];
const robin = {
  caption: "A robin",
  note: "A winter visitor",
  back(cv) {
    fill(cv, "N");
    // A branch under snow, with holly at one end.
    for (let x = 0; x < W; x++) {
      const y = 11 + (Math.sin(x * 0.09) > 0.5 ? 1 : 0);
      rect(cv, x, y, 1, 2, "b");
      set(cv, x, y, "B");
      if (Math.sin(x * 0.4) + Math.sin(x * 0.13) > -0.3) set(cv, x, y - 1, "w");
    }
    sprite(cv, 8, 8, ["gg  gg", " grrg ", "gg  gg"]);
    sprite(cv, 58, 12, [" g g ", "ggrgg", " g g "]);
  },
  draw(cv, t) {
    // It sits, looks around, and hops a little way along the branch.
    const hops = (t >> 5) % 4;
    const x = 28 + [0, 6, 11, 5][hops];
    const inAir = t % 32 < 2;
    sprite(cv, x, inAir ? 4 : 6, ROBIN[(t >> 3) % 4 === 3 ? 1 : 0]);
    snow(cv, t, 12, 31);
  },
};

const aurora = {
  caption: "Northern lights",
  note: "The sky dances",
  back(cv) {
    fill(cv, "n");
    stars(cv, 12, 41, 12);
    for (let x = 0; x < W; x++) {
      const h = 15 - Math.round(1.5 + 1.2 * Math.sin(x * 0.09) + Math.sin(x * 0.23 + 1));
      for (let y = h; y < 16; y++) set(cv, x, y, ".");
    }
  },
  draw(cv, t) {
    const band = ["m", "c", "G", "G", "g"];
    for (let x = 0; x < W; x++) {
      const top = Math.round(5 + 2.4 * Math.sin(x * 0.18 + t * 0.12) + 1.2 * Math.sin(x * 0.07 - t * 0.05)) - 2;
      const from = (x + (t >> 1)) % 9 === 0 ? 1 : 0;
      for (let k = from; k < 5; k++) {
        // The day's number keeps its corner.
        if (x < 10 && top + k < 7) continue;
        set(cv, x, top + k, band[k]);
      }
    }
    for (const x of [9, 27, 52, 66]) sprite(cv, x, 9, DARK_PINE);
  },
};

const STOCKING = ["www  ", "rrr  ", "rrr  ", "rrr  ", "rrrrr", " rrrr"];
const fireside = {
  caption: "By the fire",
  note: "Warm your toes",
  action: "stoke",
  back(cv) {
    fill(cv, "n");
    // A garland along the ceiling, the chimney breast and its mantelpiece.
    rect(cv, 10, 0, 52, 1, "g");
    for (let x = 12; x < 62; x += 5) set(cv, x, 1, x % 2 ? "r" : "y");
    rect(cv, 23, 4, 26, 12, "K");
    rect(cv, 20, 2, 32, 2, "B");
    rect(cv, 27, 6, 18, 10, ".");
    for (let y = 5; y < 16; y += 3) {
      set(cv, 24, y, "k");
      set(cv, 47, y, "k");
    }
    rect(cv, 29, 14, 14, 2, "b");
    set(cv, 29, 14, "B");
    set(cv, 42, 14, "B");
    sprite(cv, 11, 4, STOCKING);
    sprite(cv, 55, 4, STOCKING);
    rect(cv, 0, 15, 23, 1, "b");
    rect(cv, 49, 15, 23, 1, "b");
  },
  draw(cv, t, ctx) {
    const stoked = ctx.poke < 28;
    const reach = stoked ? 7 : 4;
    for (let x = 29; x < 43; x++) {
      const h = 2 + Math.floor(rnd(x * 13 + (t >> 1) * 7) * reach);
      for (let k = 0; k < h; k++) set(cv, x, 13 - k, k === 0 ? "Y" : k * 2 < h ? "y" : k < h - 1 ? "o" : "r");
    }
    // Sparks fly up the chimney when the fire is stoked.
    if (stoked) {
      for (let i = 0; i < 3; i++) set(cv, 31 + ((t * 3 + i * 5) % 10), 8 - ((t + i * 2) % 3), i ? "o" : "Y");
    }
  },
};

const STAR = [
  "    y    ",
  "    y    ",
  "   yYy   ",
  "yyyYYYyyy",
  " yyYYYyy ",
  "  yYYYy  ",
  "  yYyYy  ",
  " yy   yy ",
  " y     y ",
];
const starLantern = {
  caption: "A star in the window",
  note: "Light in the dark",
  back(cv) {
    fill(cv, "n");
    rect(cv, 17, 0, 38, 16, "B");
    rect(cv, 19, 1, 16, 14, "N");
    rect(cv, 37, 1, 16, 14, "N");
    for (const x of [9, 55]) {
      rect(cv, x, 0, 8, 16, "r");
      rect(cv, x + 2, 0, 1, 16, "R");
      rect(cv, x + 5, 0, 1, 16, "R");
    }
    rect(cv, 35, 1, 2, 2, "K");
  },
  draw(cv, t) {
    // Snow outside, seen through the two panes.
    for (let i = 0; i < 9; i++) {
      const x = 19 + Math.floor(rnd(i + 61) * 34);
      if (x === 35 || x === 36) continue;
      set(cv, x, 1 + Math.floor((rnd(i * 3 + 61) * 14 + t * (0.2 + rnd(i * 7) * 0.25)) % 14), "w");
    }
    sprite(cv, 32, 3, STAR);
    if ((t >> 2) % 3 === 0) {
      set(cv, 36, 5, "w");
      set(cv, 31, 6, "o");
      set(cv, 41, 6, "o");
      set(cv, 36, 12, "o");
    }
  },
};

const LOCO = [
  "       KK   ",
  " rrrrr KK   ",
  " rcccr rrrr ",
  " rrrrrrrrrrY",
  " rrrrrrrrrr ",
];
const WHEELS = [" KK  KK  KK ", "  KK  KK  KK"];
const train = {
  caption: "The toy train",
  note: "All aboard!",
  back(cv) {
    fill(cv, "n");
    stars(cv, 12, 97, 7);
    hills(cv, 4, "d");
    rect(cv, 0, 14, W, 1, "K");
    for (let x = 0; x < W; x++) set(cv, x, 15, x % 3 ? "s" : "b");
  },
  draw(cv, t) {
    twinkle(cv, t, 12, 97, 7);
    const x = ((t + 56) % 118) - 40;
    sprite(cv, x, 8, LOCO);
    sprite(cv, x, 13, [WHEELS[(t >> 1) % 2]]);
    for (let n = 1; n < 3; n++) {
      const wx = x - n * 10;
      rect(cv, wx, 10, 8, 3, n === 1 ? "g" : "c");
      rect(cv, wx + 8, 12, 2, 1, "K");
      sprite(cv, wx, 13, [(t >> 1) % 2 ? " KK  KK " : "KK  KK  "]);
      if (n === 1) {
        rect(cv, wx + 2, 8, 4, 2, "y");
        rect(cv, wx + 3, 8, 1, 2, "r");
      } else {
        sprite(cv, wx + 2, 7, ["  G  ", " GGG ", "GGGGG"]);
      }
    }
    // Puffs of smoke left behind.
    for (let k = 0; k < 4; k++) {
      const age = (t + k * 3) % 12;
      set(cv, x + 7 - age, 7 - (age >> 1), age < 4 ? "w" : age < 8 ? "K" : "k");
      if (age < 6) set(cv, x + 8 - age, 7 - (age >> 1), "s");
    }
  },
};

const treeScene = {
  caption: "Tree lights",
  note: "Deck the halls",
  back(cv) {
    fill(cv, "n");
    stars(cv, 10, 13, 9);
    snowGround(cv, 15);
    sprite(cv, 30, 1, TREE);
    rect(cv, 23, 12, 5, 3, "r");
    rect(cv, 25, 12, 1, 3, "y");
    rect(cv, 43, 11, 6, 4, "c");
    rect(cv, 45, 11, 1, 4, "w");
    rect(cv, 43, 12, 6, 1, "w");
  },
  draw(cv, t) {
    twinkle(cv, t, 10, 13, 9);
    treeLights(cv, 30, 1, t);
    snow(cv, t, 12, 8);
  },
};

const BELL = [
  "   yy    ",
  "  yYyy   ",
  "  yYyy   ",
  " yYyyyy  ",
  " yYyyyy  ",
  " yyyyyy  ",
  "yyyyyyyy ",
  "   oo    ",
];
const NOTE = [" y", " y", "yy", "yy"];
const bells = {
  caption: "Bells",
  note: "Ring them loud",
  action: "ring",
  back(cv) {
    fill(cv, "N");
    stars(cv, 8, 109, 16);
    // A ribbon holds them, with holly on both sides.
    rect(cv, 22, 0, 28, 1, "g");
    for (let x = 23; x < 50; x += 4) set(cv, x, 1, "G");
    sprite(cv, 32, 0, ["rr  rr", "rrrrrr", " rrrr ", "rr  rr"]);
    set(cv, 27, 1, "r");
    set(cv, 44, 1, "r");
  },
  draw(cv, t, ctx) {
    twinkle(cv, t, 8, 109, 16);
    const ringing = ctx.poke < 32;
    const swing = Math.round((ringing ? 2.6 : 1.2) * Math.sin(t * (ringing ? 1.1 : 0.3)));
    for (let n = 0; n < 2; n++) {
      const lean = n ? -swing : swing;
      const x = n ? 37 : 26;
      for (let j = 0; j < BELL.length; j++) sprite(cv, x + Math.round((lean * j) / 7), 4 + j, [BELL[j]]);
    }
    if (ringing) {
      const rise = ctx.poke >> 2;
      sprite(cv, 14 - (rise & 1), 9 - rise, NOTE);
      sprite(cv, 55 + (rise & 1), 10 - rise, NOTE);
    }
  },
};

const PENGUIN = [
  [" ..  ", " ..o ", "..ww ", "..ww ", " .ww ", " o   "],
  [" ..  ", " ..o ", "..ww ", "..ww ", " .ww ", "   o "],
];
const SLIDER = [" ....  ", "......o", " wwww  "];
const penguins = {
  caption: "Penguins",
  note: "A waddle and a slide",
  back(cv) {
    fill(cv, "N");
    stars(cv, 9, 113, 6);
    disc(cv, 62, 3, 2, "Y");
    snowGround(cv, 13);
    // An igloo.
    disc(cv, 10, 13, 5, "s");
    rect(cv, 5, 14, 11, 2, "s");
    rect(cv, 9, 11, 3, 3, "n");
    for (const at of [
      [7, 10],
      [12, 9],
      [13, 12],
      [6, 12],
    ]) {
      set(cv, at[0], at[1], "K");
    }
  },
  draw(cv, t) {
    twinkle(cv, t, 9, 113, 6);
    for (let i = 0; i < 2; i++) {
      const step = (t >> 1) + i * 3;
      sprite(cv, ((step + i * 16) % 84) - 8, 7 + (step & 1), PENGUIN[step & 1]);
    }
    sprite(cv, ((t * 2 + 50) % 110) - 10, 10, SLIDER);
  },
};

/** The arms of a snow crystal: steps along one arm, and where it branches. */
const CRYSTALS = [
  { at: [14, 8], c: "w", branch: 3 },
  { at: [36, 7], c: "c", branch: 2 },
  { at: [58, 8], c: "s", branch: 4 },
];
const snowflakes = {
  caption: "Snowflakes",
  note: "No two alike",
  back(cv) {
    fill(cv, "n");
  },
  draw(cv, t) {
    snow(cv, t, 9, 127);
    for (let n = 0; n < 3; n++) {
      const flake = CRYSTALS[n];
      const cx = flake.at[0];
      const cy = flake.at[1];
      // Each grows from its middle, holds and starts again.
      const grown = Math.min(6, ((t >> 2) + n * 4) % 12);
      set(cv, cx, cy, grown === 6 && (t >> 1) % 2 ? "Y" : flake.c);
      for (let r = 1; r <= grown; r++) {
        set(cv, cx + r, cy, flake.c);
        set(cv, cx - r, cy, flake.c);
        set(cv, cx, cy + r, flake.c);
        set(cv, cx, cy - r, flake.c);
        if (r < 5) {
          set(cv, cx + r, cy + r, flake.c);
          set(cv, cx - r, cy + r, flake.c);
          set(cv, cx + r, cy - r, flake.c);
          set(cv, cx - r, cy - r, flake.c);
        }
        if (r === flake.branch + 1) {
          const b = flake.branch;
          set(cv, cx + b, cy + 1, flake.c);
          set(cv, cx + b, cy - 1, flake.c);
          set(cv, cx - b, cy + 1, flake.c);
          set(cv, cx - b, cy - 1, flake.c);
          set(cv, cx + 1, cy + b, flake.c);
          set(cv, cx - 1, cy + b, flake.c);
          set(cv, cx + 1, cy - b, flake.c);
          set(cv, cx - 1, cy - b, flake.c);
        }
      }
    }
  },
};

const gift = {
  caption: "A gift",
  note: "What is inside?",
  action: "unwrap",
  back(cv) {
    fill(cv, "n");
    stars(cv, 8, 17, 6);
    rect(cv, 0, 15, W, 1, "b");
  },
  draw(cv, t, ctx) {
    // It shakes, then the lid jumps: by itself now and then, and at once when Start is pressed.
    const f = ctx.poke < 12 ? 28 + ctx.poke : t % 40;
    const shake = f >= 20 && f < 28 ? (f % 2 ? 1 : -1) : 0;
    const lift = f >= 28 ? [1, 3, 5, 6, 6, 6, 5, 4, 3, 2, 1, 0][f - 28] : 0;
    rect(cv, 28 + shake, 8, 16, 7, "r");
    rect(cv, 35 + shake, 8, 2, 7, "y");
    rect(cv, 28 + shake, 11, 16, 1, "y");
    const ly = 6 - lift;
    rect(cv, 27 + shake, ly, 18, 2, "R");
    rect(cv, 35 + shake, ly, 2, 2, "y");
    sprite(cv, 32 + shake, ly - 2, ["yy  yy", " yyyy "]);
    if (lift > 0) {
      const r = (f - 27) * 1.3;
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        set(cv, Math.round(36 + Math.cos(a) * r * 1.8), Math.round(7 + Math.sin(a) * r * 0.7), LIGHTS[k % 4]);
      }
    }
  },
};

/** Jingle Bells: how far up the staff each note sits (0 is C) and how long it lasts, in quarter notes. */
const TUNE = [
  [2, 1], [2, 1], [2, 2], [2, 1], [2, 1], [2, 2], [2, 1], [4, 1], [0, 1], [1, 1], [2, 4],
  [3, 1], [3, 1], [3, 1], [3, 1], [3, 1], [2, 1], [2, 1], [2, 1], [2, 1], [1, 1], [1, 1], [2, 1], [1, 2], [4, 2],
];
const QUARTER = 6;
const TUNE_X = [];
let tuneLength = 0;
for (const note of TUNE) {
  TUNE_X.push(tuneLength);
  tuneLength += note[1] * QUARTER;
}
const carols = {
  caption: "Carols",
  note: "Sing along",
  back(cv) {
    fill(cv, "N");
    for (let y = 3; y < 16; y += 3) rect(cv, 0, y, W, 1, "k");
  },
  draw(cv, t) {
    const shift = (t * 2) % tuneLength;
    for (let i = 0; i < TUNE.length; i++) {
      let x = TUNE_X[i] - shift;
      if (x < -3) x += tuneLength;
      if (x > W || x < 10) continue;
      const y = 12 - TUNE[i][0] * 2;
      const c = TUNE[i][1] > 1 ? "w" : LIGHTS[i % 4];
      rect(cv, x, y, 2, 2, c);
      rect(cv, x + 2, y - 3, 1, 4, c);
    }
  },
};

const longestNight = {
  caption: "The longest night",
  note: "Make a wish",
  action: "wish",
  back(cv) {
    fill(cv, "n");
    stars(cv, 18, 131, 11);
    snowGround(cv, 14);
    sprite(cv, 8, 8, PINE);
    sprite(cv, 15, 8, PINE);
    sprite(cv, 62, 8, PINE);
    // A cabin with a light on.
    sprite(cv, 44, 6, ["   K     ", "   K www ", " wwwwwwww", "wwwwwwwww", " BBBBBBB ", " ByBBbBB ", " BBBBbBB ", " BBBBbBB "]);
  },
  draw(cv, t, ctx) {
    twinkle(cv, t, 18, 131, 11);
    // The moon crosses the sky, low and slow.
    const mx = 13 + ((t >> 2) % 56);
    disc(cv, mx, 2 + Math.round(((mx - 37) * (mx - 37)) / 480), 2, "Y");
    set(cv, 47, 5 - ((t >> 2) % 3), "K");
    // A shooting star: when Start is pressed, and once in a while by itself.
    const age = ctx.poke < 12 ? ctx.poke : (t % 96) - 84;
    if (age >= 0 && age < 12) {
      const x = 64 - age * 5;
      const y = 1 + (age >> 1);
      set(cv, x, y, "w");
      set(cv, x + 1, y, "Y");
      set(cv, x + 3, y - 1, "s");
      set(cv, x + 5, y - 1, "K");
    }
  },
};

const DEER_BODY = [" bBBBBBBB", "  BBBBBBB", "  BBBBBBB", "  B B B B", "  B B B B"];
const DEER_HEAD = ["b b  ", "bbb  ", " BB  ", " BBB ", " BB  "];
const reindeer = {
  caption: "Reindeer",
  note: "Ready for the flight",
  back(cv) {
    fill(cv, "n");
    stars(cv, 10, 139, 8);
    sprite(cv, 3, 8, PINE);
    sprite(cv, 12, 8, PINE);
    sprite(cv, 55, 8, PINE);
    sprite(cv, 64, 8, PINE);
    snowGround(cv, 14);
    sprite(cv, 26, 9, DEER_BODY);
  },
  draw(cv, t) {
    twinkle(cv, t, 10, 139, 8);
    // It lowers its head to the snow now and then; the nose glows.
    const nod = (t >> 4) % 4 === 3 ? 2 : 0;
    sprite(cv, 33, 5 + nod, DEER_HEAD);
    set(cv, 37, 8 + nod, t % 6 < 3 ? "R" : "r");
    if (t % 24 < 6) set(cv, 39 + ((t % 24) >> 1), 7 + nod, "K");
    set(cv, 26, 9 + (t % 16 < 2 ? 1 : 0), "b");
    snow(cv, t, 12, 37);
  },
};

const REINDEER = [
  ["     . .", "      ..", "      ...", " ......", "......", " .  . ."],
  ["     . .", "      ..", "      ...", " ......", "......", "  . . ."],
];
const SLEIGH = ["    ..     ", "   ....    ", ".  ......  ", "........... ", " ........  ", " ........."];
const sleigh = {
  caption: "Sleigh at night",
  note: "Test flight tonight",
  action: "drop a gift",
  back(cv) {
    fill(cv, "n");
    stars(cv, 14, 29, 13);
    disc(cv, 36, 8, 7, "Y");
    set(cv, 33, 5, "y");
    set(cv, 38, 10, "y");
    set(cv, 39, 6, "y");
    set(cv, 34, 11, "y");
    hills(cv, 1, "d");
  },
  draw(cv, t, ctx) {
    twinkle(cv, t, 14, 29, 13);
    const x = (t % 120) - 34;
    const y = 4 + Math.round(Math.sin(t * 0.2));
    sprite(cv, x, y + 1, SLEIGH);
    for (let i = 11; i < 16; i++) set(cv, x + i, y + 4, ".");
    sprite(cv, x + 15, y, REINDEER[(t >> 1) % 2]);
    sprite(cv, x + 24, y - 1, REINDEER[((t >> 1) + 1) % 2]);
    set(cv, x + 32, y + 1, t % 6 < 3 ? "R" : "r");
    if (ctx.poke < 10) {
      const gy = y + 6 + ctx.poke;
      rect(cv, x + 3 - ctx.poke, gy, 3, 3, "r");
      rect(cv, x + 4 - ctx.poke, gy, 1, 3, "y");
    }
  },
};

const CHURCH = [
  "       K       ",
  "       K       ",
  "      KKK      ",
  "      KyK      ",
  "     wwwww     ",
  "     KKKKK     ",
  "     KKyKK     ",
  "  wwwwwwwwwww  ",
  " wwwwwwwwwwwww ",
  " KKKKKKKKKKKKK ",
  " KyKKyKbKyKKyK ",
  " KyKKyKbKyKKyK ",
];
const silentNight = {
  caption: "Silent night",
  note: "One more sleep",
  back(cv) {
    fill(cv, "n");
    stars(cv, 12, 149, 7);
    sprite(cv, 10, 5, HOUSE);
    sprite(cv, 53, 5, HOUSE);
    sprite(cv, 21, 8, PINE);
    sprite(cv, 46, 8, PINE);
    sprite(cv, 64, 8, PINE);
    snowGround(cv, 14);
    sprite(cv, 28, 2, CHURCH);
  },
  draw(cv, t) {
    twinkle(cv, t, 12, 149, 7);
    // The star over the roofs, with rays that come and go.
    const cx = 23;
    const cy = 3;
    const reach = (t >> 2) % 4 < 2 ? 3 : 2;
    for (let r = 1; r <= reach; r++) {
      const c = r === reach ? "y" : "Y";
      set(cv, cx + r, cy, c);
      set(cv, cx - r, cy, c);
      set(cv, cx, cy + r, c);
      set(cv, cx, cy - r, c);
    }
    set(cv, cx + 1, cy + 1, "y");
    set(cv, cx - 1, cy + 1, "y");
    set(cv, cx + 1, cy - 1, "y");
    set(cv, cx - 1, cy - 1, "y");
    set(cv, cx, cy, "w");
    if ((t >> 3) % 3 === 0) set(cv, 35, 5, "Y");
    snow(cv, t, 16, 53);
  },
};

const finale = {
  caption: "Merry Christmas!",
  note: "Joy to the world",
  back(cv) {
    fill(cv, "n");
    sprite(cv, 59, 1, TREE);
    text(cv, 12, 9, "CHRISTMAS", "w");
  },
  draw(cv, t) {
    snow(cv, t, 10, 77);
    treeLights(cv, 59, 1, t);
    text(cv, 12, 2, "MERRY", (i) => ((i + (t >> 2)) % 2 ? "y" : "R"));
    const f = t % 24;
    if (f < 12) {
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        set(cv, Math.round(46 + Math.cos(a) * f * 0.4), Math.round(4 + Math.sin(a) * f * 0.4), LIGHTS[(k + (t >> 3)) % 4]);
      }
    } else if (f < 16) {
      set(cv, 46, 4 + (16 - f), "Y");
    }
  },
};

/** Door 1 to door 24, in order, then Christmas Day. */
const SCENES = [
  village,
  snowman,
  candyCanes,
  cocoa,
  wreath,
  boot,
  skating,
  gingerbread,
  snowGlobe,
  robin,
  aurora,
  fireside,
  starLantern,
  train,
  treeScene,
  bells,
  penguins,
  snowflakes,
  gift,
  carols,
  longestNight,
  reindeer,
  sleigh,
  silentNight,
  finale,
];

/** How many doors there are, Christmas Day included. */
export const DOORS = SCENES.length;

/** What is behind door `day`: { caption, note, action } for the back display. `action` is what Start does there. */
export function sceneOf(day) {
  return SCENES[day - 1];
}

/** Paints the scene behind door `day` (1-25) at frame `t`. ctx: { candles, poke } */
export function drawScene(cv, day, t, ctx) {
  const scene = SCENES[day - 1];
  backdrop(cv, "scene" + day + ":" + ctx.candles, (bg) => {
    scene.back(bg, ctx);
    badge(bg, day);
  });
  scene.draw(cv, t, ctx);
}
