'use strict';

// Runner theme: a jogger in a park, leaping hurdles, puddles, dogs and frisbees.
(() => {
// ---------------------------------------------------------------------------
// Player: a runner with a headband. Head and torso are shared between frames,
// the arms and legs swing to make it run.
// ---------------------------------------------------------------------------
const HEAD = [
  '.........####.......',
  '.....##.######......',
  '....#..#######......',
  '.........###.#......',
  '.........#####......',
  '..........##........',
];
const ARMS_A = [
  '........######......',
  '.......#######.##...',
  '......#.#####....#..',
  '.....#..#####.......',
  '.....#..#####.......',
  '........#####.......',
];
const ARMS_B = [
  '........######......',
  '.......##.####......',
  '.......#..####.#....',
  '.........#####.##...',
  '.........#####......',
  '.........#####......',
];
const LEGS_A = [
  '.........####.......',
  '........##..##......',
  '.......##....##.....',
  '......##......##....',
  '.....##........##...',
  '....##..........###.',
  '...###..............',
];
const LEGS_B = [
  '.........####.......',
  '.........##.###.....',
  '.........##...##....',
  '.........##..##.....',
  '.........##.........',
  '.........##.........',
  '........###.........',
];

const STAND = sprite([...HEAD, ...ARMS_A, ...LEGS_B]);

const RUNNER = {
  stand: STAND,
  runA: sprite([...HEAD, ...ARMS_A, ...LEGS_A]),
  runB: sprite([...HEAD, ...ARMS_B, ...LEGS_B]),
  // Leap: legs stretched out front and back
  jump: sprite([
    ...HEAD,
    '........######......',
    '..##..########.##...',
    '....##.#####....#...',
    '.......#####........',
    '.......#####........',
    '........####........',
    '......###..###......',
    '....###......###....',
    '..###..........###..',
    '.##..............##.',
    '....................',
    '....................',
    '....................',
  ]),
  // Tripped: lying flat on the track, arms stretched forward
  dead: sprite([
    '......................####..',
    '.....................######.',
    '.............#......#.#.###.',
    '###..........##....#######..',
    '.###########################',
    '..#########################.',
    '.##.....######.......##.##..',
  ]),
  frameDuration: 0.11,
};

const DUCK_TOP = [
  '...........####.....',
  '.......##.######....',
  '......#..#######....',
  '...........###.#....',
  '......#########.....',
  '....############....',
  '...##..########.##..',
  '.......#######......',
];
RUNNER.duckA = sprite([
  ...DUCK_TOP,
  '......###...###.....',
  '.....###.....###....',
  '....###.......###...',
  '...###.........###..',
  '..###...........##..',
]);
RUNNER.duckB = sprite([
  ...DUCK_TOP,
  '.......####.........',
  '......##..###.......',
  '.....##....###......',
  '.....##.....##......',
  '....###.....###.....',
]);

// ---------------------------------------------------------------------------
// Park obstacles
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

const LOG = sprite([
  '..............##......',
  '...............#......',
  '..#################...',
  '.####.######.#####.##.',
  '#################.#..#',
  '#################.#..#',
  '.####.######.#####.##.',
  '..#################...',
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

const FRISBEE_A = sprite([
  '....######....',
  '.############.',
  '##############',
  '...########...',
]);
const FRISBEE_B = sprite([
  '....######....',
  '.###.####.###.',
  '##############',
  '...########...',
]);

// ---------------------------------------------------------------------------
// Scenery: trees in the distance and a running track on the ground
// ---------------------------------------------------------------------------
let trees = [];
let gravel = [];
let laneOffset = 0;
const DASH = 24;

function randomTree(x) {
  return { x, r: 10 + Math.floor(Math.random() * 4) * 4, trunk: 14 + Math.floor(Math.random() * 3) * 6 };
}

function randomGravel(x) {
  return { x, y: GROUND + 4 + Math.floor(Math.random() * 3) * 2, w: 2 + Math.floor(Math.random() * 2) * 2 };
}

const scenery = {
  init() {
    trees = [];
    for (let x = 0; x < W + 120;) {
      const t = randomTree(x);
      trees.push(t);
      x += t.r * 2 + 20 + Math.floor(Math.random() * 80);
    }
    gravel = Array.from({ length: 12 }, () => randomGravel(Math.random() * W));
  },
  update(dx) {
    for (const t of trees) t.x -= dx * 0.12;
    if (trees[0].x + trees[0].r * 2 < 0) {
      trees.shift();
      const lastT = trees[trees.length - 1];
      trees.push(randomTree(lastT.x + lastT.r * 2 + 20 + Math.floor(Math.random() * 80)));
    }
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
  },
  drawGround() {
    ctx.fillStyle = colors.fg;
    // Dashed lane line and the edge of the track
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
    { frames: [LOG], weight: 0.14, maxGroup: 2 },
    { frames: [STROLLER], weight: 0.12, minScore: 100 },
    { frames: [DOG_A, DOG_B], weight: 0.14, minScore: 150, extraSpeed: [80, 140], frameDuration: 0.09 },
    // Three heights: low (jump), middle (duck or jump), high (run underneath)
    {
      frames: [FRISBEE_A, FRISBEE_B], weight: 0.2, minScore: 250,
      flyAt: [GROUND - 4, GROUND - 28, GROUND - 52], extraSpeed: [60, 120], frameDuration: 0.08,
    },
  ],
  scenery,
  music: MUSIC,
});
})();
