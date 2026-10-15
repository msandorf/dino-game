'use strict';

// Runner theme: a race runner leaping hurdles, puddles and water stations,
// dodging loose dogs and TV drones, with spectators cheering behind barriers.
(() => {
// ---------------------------------------------------------------------------
// Player: a race runner in a singlet with a bib number, shorts and a
// headband, leaning forward with pumping arms. The head is shared between
// frames; the arms and legs swap sides to make the stride.
// ---------------------------------------------------------------------------
const HEAD = [
  '............####........',
  '........##.######.......',
  '.......#..#######.......',
  '............###.#.......',
  '............#####.......',
  '.............##.........',
];
// Singlet with a white bib (the hollow square) and the number in it
const BODY_A = [
  '..........######..##....',
  '..........#....####.....',
  '.......##.#.##.#........',
  '......#..##....#........',
  '..........######........',
  '.........########.......',
];
const BODY_B = [
  '..........######........',
  '.....##...#....#........',
  '......#####.##.###......',
  '..........#....#..##....',
  '..........######........',
  '.........########.......',
];
// Stride: front leg reaching out, back leg pushing off
const LEGS_A = [
  '.........###..####......',
  '........###.....###.....',
  '.......###.......###....',
  '......##...........##...',
  '....###.............###.',
];
// Passing: knee driving up, standing leg straight
const LEGS_B = [
  '.........###.#####......',
  '.........###....##......',
  '..........##....###.....',
  '..........##............',
  '.........###............',
];

const RUNNER = {
  stand: sprite([...HEAD, ...BODY_A, ...LEGS_B]),
  runA: sprite([...HEAD, ...BODY_A, ...LEGS_A]),
  runB: sprite([...HEAD, ...BODY_B, ...LEGS_B]),
  // Leap: legs split wide like a hurdler
  jump: sprite([
    ...HEAD,
    ...BODY_A,
    '.......####....####.....',
    '.....###..........####..',
    '...###...............##.',
    '.##.....................',
    '........................',
  ]),
  // Tripped: lying flat on the course, arms stretched forward
  dead: sprite([
    '..........................####..',
    '.........................######.',
    '...............#........#.#.###.',
    '###............##......#######..',
    '.###########.#....#############.',
    '..##########.#....############..',
    '.##.....##############...##.##..',
  ]),
  frameDuration: 0.1,
};

// Ducking: bent low with the head forward, still running
const DUCK_TOP = [
  '..............####......',
  '..........##.######.....',
  '.........#..#######.....',
  '..............###.#.....',
  '.........#########......',
  '.......##....#####......',
  '......##.#.##.#..##.....',
  '.........########.......',
];
RUNNER.duckA = sprite([
  ...DUCK_TOP,
  '........###...###.......',
  '.......###.....###......',
  '......###.......###.....',
  '.....###.........###....',
  '....###...........###...',
]);
RUNNER.duckB = sprite([
  ...DUCK_TOP,
  '.........###.####.......',
  '.........###...###......',
  '..........##....##......',
  '..........##............',
  '.........###............',
]);

// ---------------------------------------------------------------------------
// Race obstacles
// ---------------------------------------------------------------------------
const HURDLE = sprite([
  '################',
  '##..##..##..##.#',
  '################',
  '.##..........##.',
  '.##..........##.',
  '.##..........##.',
  '.##..........##.',
  '.##..........##.',
  '.##..........##.',
  '.##..........##.',
  '####........####',
  '####........####',
]);

// A drinks table with paper cups on it
const WATER_TABLE = sprite([
  '..##...##...##...##...##..',
  '..##...##...##...##...##..',
  '##########################',
  '##########################',
  '.##....................##.',
  '.##....................##.',
  '.##....................##.',
  '.##....................##.',
  '.##....................##.',
  '####..................####',
]);

const PUDDLE = sprite([
  '......############......',
  '..#####....###########..',
  '########################',
  '..####################..',
]);

const STROLLER = sprite([
  '##.....######...',
  '..#..##.....##..',
  '...##.........#.',
  '....############',
  '....############',
  '.....##########.',
  '......########..',
  '.......#....#...',
  '......###..###..',
  '......###..###..',
]);

// A loose dog comes running towards the runner
const DOG_BODY = [
  '..##..............',
  '.###.............#',
  '#####...........#.',
  '.###############..',
  '...#############..',
  '...############...',
];
const DOG_A = sprite([
  ...DOG_BODY,
  '...##.......##....',
  '..##.........##...',
  '.##...........##..',
]);
const DOG_B = sprite([
  ...DOG_BODY,
  '...##.......##....',
  '...##.......##....',
  '...##.......##....',
]);

// A TV drone filming the race, rotors spinning
const DRONE_A = sprite([
  '####......####',
  '.#..........#.',
  '.############.',
  '..##########..',
  '....#.##.#....',
  '.....####.....',
]);
const DRONE_B = sprite([
  '.##........##.',
  '.#..........#.',
  '.############.',
  '..##########..',
  '....#.##.#....',
  '.....####.....',
]);

// ---------------------------------------------------------------------------
// Scenery: trees far away, spectators cheering behind crowd barriers, and the
// race course with a dashed centre line on the ground
// ---------------------------------------------------------------------------
let trees = [];
let fans = [];
let gravel = [];
let laneOffset = 0;
let fenceOffset = 0;
const DASH = 24;
const FENCE_POST = 40;
const FENCE_TOP = GROUND - 16;

function randomTree(x) {
  return { x, r: 10 + Math.floor(Math.random() * 4) * 4, trunk: 14 + Math.floor(Math.random() * 3) * 6 };
}

function randomFan(x) {
  return { x, h: Math.floor(Math.random() * 3) * 2, cheering: Math.random() < 0.4, phase: Math.random() * 6 };
}

function randomGravel(x) {
  return { x, y: GROUND + 4 + Math.floor(Math.random() * 3) * 2, w: 2 + Math.floor(Math.random() * 2) * 2 };
}

let cheerTime = 0;

const scenery = {
  init() {
    trees = [];
    for (let x = 0; x < W + 120;) {
      const t = randomTree(x);
      trees.push(t);
      x += t.r * 2 + 20 + Math.floor(Math.random() * 80);
    }
    fans = [];
    for (let x = 0; x < W + 40; x += 10 + Math.floor(Math.random() * 3) * 4) fans.push(randomFan(x));
    gravel = Array.from({ length: 12 }, () => randomGravel(Math.random() * W));
  },
  update(dx) {
    for (const t of trees) t.x -= dx * 0.08;
    if (trees[0].x + trees[0].r * 2 < 0) {
      trees.shift();
      const lastT = trees[trees.length - 1];
      trees.push(randomTree(lastT.x + lastT.r * 2 + 20 + Math.floor(Math.random() * 80)));
    }
    for (const f of fans) f.x -= dx * 0.3;
    if (fans[0].x < -10) {
      fans.shift();
      fans.push(randomFan(fans[fans.length - 1].x + 10 + Math.floor(Math.random() * 3) * 4));
    }
    fenceOffset = (fenceOffset + dx * 0.3) % FENCE_POST;
    cheerTime += dx / 400;
    laneOffset = (laneOffset + dx) % DASH;
    for (const g of gravel) {
      g.x -= dx;
      if (g.x < -g.w) Object.assign(g, randomGravel(W + Math.random() * 100));
    }
  },
  drawBackground() {
    ctx.fillStyle = colors.far;
    for (const t of trees) {
      const cx = Math.round(t.x) + t.r;
      const top = GROUND - 2 - t.trunk - t.r * 2;
      ctx.fillRect(cx - 2, top + t.r * 2 - 4, 4, t.trunk + 4);
      // Round canopy built from horizontal strips
      for (let dy = -t.r; dy < t.r; dy += 2) {
        const half = Math.round(Math.sqrt(t.r * t.r - (dy + 1) * (dy + 1)));
        ctx.fillRect(cx - half, top + t.r + dy, half * 2, 2);
      }
    }
    // Spectators: head and shoulders above the barrier, some cheering
    ctx.fillStyle = colors.far;
    for (const f of fans) {
      const x = Math.round(f.x);
      const bob = f.cheering && Math.sin(cheerTime * 6 + f.phase) > 0 ? 2 : 0;
      const top = FENCE_TOP - 14 - f.h - bob;
      ctx.fillRect(x + 2, top, 4, 4);
      ctx.fillRect(x, top + 5, 8, 14);
      if (f.cheering) {
        ctx.fillRect(x - 2, top - 4, 2, 8);
        ctx.fillRect(x + 8, top - 4, 2, 8);
      }
    }
    // Crowd barriers in front of the spectators
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, FENCE_TOP, W, GROUND - 2 - FENCE_TOP);
    ctx.fillStyle = colors.far;
    ctx.fillRect(0, FENCE_TOP, W, 2);
    ctx.fillRect(0, FENCE_TOP + 8, W, 2);
    for (let x = -fenceOffset; x < W; x += FENCE_POST) {
      ctx.fillRect(Math.round(x), FENCE_TOP, 2, GROUND - 2 - FENCE_TOP);
      for (let v = 6; v < FENCE_POST; v += 6) ctx.fillRect(Math.round(x + v), FENCE_TOP + 2, 1, 6);
    }
  },
  drawGround() {
    ctx.fillStyle = colors.fg;
    // Dashed centre line and the kerb of the course
    for (let x = -laneOffset; x < W; x += DASH) ctx.fillRect(Math.round(x), GROUND + 10, DASH / 2, 2);
    ctx.fillRect(0, GROUND + 20, W, 2);
    for (const g of gravel) ctx.fillRect(Math.round(g.x), g.y, g.w, 2);
  },
};

// ---------------------------------------------------------------------------
// Music: a triumphant training-montage theme in C major (original composition)
// ---------------------------------------------------------------------------
const REST_BAR = '. . . . . . . . . . . . . . . .';
const FANFARE = [
  REST_BAR, REST_BAR, REST_BAR, REST_BAR,
  'C5 - - - - - G4 - C5 - E5 - - - - -',
  'F5 - - - E5 - D5 - E5 - - - - - - -',
  'C5 - - - - - G4 - C5 - E5 - G5 - - -',
  'A5 - - - - - - - G5 - - - - - - -',
  'F5 - - - - - E5 - F5 - A5 - - - - -',
  'G5 - - - - - F5 - E5 - - - D5 - - -',
  'C5 - - - D5 - E5 - G5 - - - E5 - - -',
  'D5 - - - - - - - - - - - . . . .',
  'C6 - - - - - G5 - A5 - - - G5 - - -',
  'F5 - - - - - G5 - A5 - - - - - - -',
  'G5 - - - E5 - F5 - G5 - - - B5 - - -',
  'C6 - - - - - - - - - - - . . . .',
].join(' | ');

const ROOTS = { C: 'C', F: 'F', G: 'G', Am: 'A' };
const PROGRESSION = ['C', 'C', 'F', 'G', 'C', 'F', 'C', 'F', 'F', 'G', 'C', 'G', 'Am', 'F', 'G', 'C'];

// Funky octave bass in eighth notes
const BASS = PROGRESSION.map(chord => {
  const root = ROOTS[chord];
  return Array(4).fill(`${root}2 - ${root}3 -`).join(' ');
}).join(' | ');

// Brass stabs (root and fifth) on the one and the off-beats
const STABS = PROGRESSION.map(chord => {
  const note = `${ROOTS[chord]}4`;
  return `${note} - . . . . ${note} . . . ${note} - . . . .`;
}).join(' | ');

// Drums build up through the intro, then a disco beat with fills
const DRUMS = [
  'k . . . k . . . k . . . k . . .',
  'k . . . k . . . k . . . k . . .',
  'kh . h . kh . h . kh . h . kh . h .',
  'kh . h . kh . h . s s s s s s s s',
  ...Array(12).fill(null).map((_, i) => (i % 4 === 3
    ? 'kh . h . ksh . h . kh . s s ks s s s'
    : 'kh . h . ksh . h . kh . h . ksh . h h')),
].join(' | ');

const MUSIC = {
  bpm: 128,
  tracks: [
    { wave: 'square', volume: 0.055, notes: FANFARE },
    { wave: 'square', volume: 0.022, fifth: true, notes: STABS },
    { wave: 'triangle', volume: 0.16, notes: BASS },
    { drums: true, volume: 0.22, notes: DRUMS },
  ],
};

// ---------------------------------------------------------------------------
startGame({
  id: 'runner',
  player: RUNNER,
  obstacles: [
    { frames: [HURDLE], weight: 0.24, maxGroup: 2 },
    { frames: [PUDDLE], weight: 0.12 },
    { frames: [WATER_TABLE], weight: 0.14, minScore: 50 },
    { frames: [STROLLER], weight: 0.12, minScore: 100 },
    { frames: [DOG_A, DOG_B], weight: 0.14, minScore: 150, extraSpeed: [80, 140], frameDuration: 0.09 },
    // Three heights: low (jump), middle (duck or jump), high (run underneath)
    {
      frames: [DRONE_A, DRONE_B], weight: 0.2, minScore: 250,
      flyAt: [GROUND - 4, GROUND - 28, GROUND - 54], extraSpeed: [40, 100], frameDuration: 0.06,
    },
  ],
  scenery,
  music: MUSIC,
});
})();
