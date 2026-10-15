'use strict';

// Skate theme: a street skater dodging cones, hydrants, benches and pigeons.
(() => {
// ---------------------------------------------------------------------------
// Player: a skater on a board. The legs and arms are shared between frames,
// the board and wheels at the bottom change to make it roll.
// ---------------------------------------------------------------------------
const HEAD = [
  '........###.........',
  '.......#####........',
  '.......#######......',
  '........##.#........',
  '........####........',
  '.........##.........',
];
const TORSO_A = [
  '.......####.........',
  '......######........',
  '.....#.####.#.......',
  '....#..####..#......',
  '...#...####...#.....',
  '.......####.........',
  '.......####.........',
];
const TORSO_B = [
  '.......####.........',
  '......######........',
  '......#####.#.......',
  '.....#.####..#......',
  '....#..####...##....',
  '.......####.........',
  '.......####.........',
];
const LEGS = [
  '......##..##........',
  '......##...##.......',
  '.....##....##.......',
  '.....##.....##......',
  '....###.....###.....',
];
const BOARD = '.#################..';
const WHEELS_A = ['...##.........##....', '...##.........##....'];
const WHEELS_B = ['...#.#........#.#...', '....#..........#....'];

const SKATER = {
  stand: sprite([...HEAD, ...TORSO_A, ...LEGS, BOARD, ...WHEELS_A]),
  runA: sprite([...HEAD, ...TORSO_A, ...LEGS, BOARD, ...WHEELS_A]),
  runB: sprite([...HEAD, ...TORSO_B, ...LEGS, BOARD, ...WHEELS_B]),
  // Ollie: knees tucked up, arms out for balance
  jump: sprite([
    ...HEAD,
    '.......####.........',
    '..##..######..##....',
    '....##.####.##......',
    '.......####.........',
    '.......####.........',
    '......######........',
    '.....##....##.......',
    '....##......##......',
    '.....##....##.......',
    '......##..##........',
    BOARD,
    ...WHEELS_A,
  ]),
  // Bail: arms thrown up, the board shoots out in front
  dead: sprite([
    '.#......###......#..',
    '.#.....#####.....#..',
    '..#....#######..#...',
    '..#.....#.#.....#...',
    '...#....####...#....',
    '....#....##...#.....',
    '.....##.####.##.....',
    '......######........',
    '.......####.........',
    '.......####.........',
    '.......####.........',
    ...LEGS,
    '......................#############.',
    '.......................##.......##..',
  ]),
  frameDuration: 0.12,
};

const DUCK_TOP = [
  '..........###.......',
  '.........#####......',
  '.........#######....',
  '..........##.#......',
  '.......#######......',
  '.....##########.....',
  '...##..#######.##...',
  '......########......',
  '.....###....###.....',
  '....###......###....',
];
SKATER.duckA = sprite([...DUCK_TOP, BOARD, ...WHEELS_A]);
SKATER.duckB = sprite([...DUCK_TOP, BOARD, ...WHEELS_B]);

// ---------------------------------------------------------------------------
// Street obstacles
// ---------------------------------------------------------------------------
const CONE = sprite([
  '....#....',
  '...###...',
  '...###...',
  '...#.#...',
  '..#####..',
  '..#####..',
  '..#...#..',
  '.#######.',
  '.#######.',
  '#########',
  '#########',
]);

const HYDRANT = sprite([
  '....###....',
  '...#####...',
  '..#######..',
  '...#####...',
  '#.#######.#',
  '###########',
  '#.#######.#',
  '...#####...',
  '...##.##...',
  '...#####...',
  '...#####...',
  '...#####...',
  '..#######..',
  '..#######..',
]);

const TRASH_CAN = sprite([
  '.....##.....',
  '############',
  '############',
  '............',
  '.##########.',
  '.#.#.##.#.#.',
  '.#.#.##.#.#.',
  '.#.#.##.#.#.',
  '.#.#.##.#.#.',
  '.#.#.##.#.#.',
  '.#.#.##.#.#.',
  '.#.#.##.#.#.',
  '.##########.',
  '..########..',
]);

const BENCH = sprite([
  '############################',
  '############################',
  '..##....................##..',
  '############################',
  '############################',
  '..##....................##..',
  '..##....................##..',
  '..##....................##..',
  '.####..................####.',
]);

const BARRIER = sprite([
  '########################',
  '##...###...###...###...#',
  '#...###...###...###...##',
  '########################',
  '..##................##..',
  '..##................##..',
  '..##................##..',
  '..##................##..',
  '..##................##..',
  '.####..............####.',
]);

const PEBBLES = sprite([
  '...##.....',
  '..####..#.',
  '.######.##',
]);

// A runaway shopping cart rolls towards the skater
const CART_BODY = [
  '##................',
  '..#...............',
  '..################',
  '..#..#..#..#..#..#',
  '...#.#..#..#..#.#.',
  '...#.#..#..#..#.#.',
  '...##############.',
  '....#..........#..',
  '....############..',
  '.....#........#...',
];
const CART_A = sprite([...CART_BODY, '....###......###..', '....###......###..']);
const CART_B = sprite([...CART_BODY, '....#.#......#.#..', '.....#........#...']);

const PIGEON_BODY = [
  '.##...........',
  '###...........',
  '.####.........',
  '..##########..',
  '...###########',
  '....#######...',
];
const PIGEON_UP = sprite([
  '.........#....',
  '........##....',
  '.......###....',
  '......####....',
  '.##..#####....',
  '###..####.....',
  '.#######......',
  ...PIGEON_BODY.slice(3),
  '..............',
  '..............',
  '..............',
]);const PIGEON_DOWN = sprite([
  '..............',
  '..............',
  '..............',
  '..............',
  ...PIGEON_BODY,
  '.....####.....',
  '......###.....',
  '.......##.....',
]);

// ---------------------------------------------------------------------------
// Scenery: a city skyline far away and sidewalk tiles on the ground
// ---------------------------------------------------------------------------
const TILE = 48;
let buildings = [];
let tileOffset = 0;
let cracks = [];

function randomBuilding(x) {
  const w = 40 + Math.floor(Math.random() * 6) * 10;
  const h = 30 + Math.floor(Math.random() * 6) * 10;
  return { x, w, h, antenna: Math.random() < 0.3 };
}

function randomCrack(x) {
  return { x, y: GROUND + 6 + Math.floor(Math.random() * 10), w: 4 + Math.floor(Math.random() * 4) * 2 };
}

const scenery = {
  init() {
    buildings = [];
    for (let x = 0; x < W + 120;) {
      const b = randomBuilding(x);
      buildings.push(b);
      x += b.w + 6 + Math.floor(Math.random() * 30);
    }
    cracks = Array.from({ length: 8 }, () => randomCrack(Math.random() * W));
  },
  update(dx) {
    for (const b of buildings) b.x -= dx * 0.1;
    if (buildings[0].x + buildings[0].w < 0) {
      buildings.shift();
      const lastB = buildings[buildings.length - 1];
      buildings.push(randomBuilding(lastB.x + lastB.w + 6 + Math.floor(Math.random() * 30)));
    }
    tileOffset = (tileOffset + dx) % TILE;
    for (const c of cracks) {
      c.x -= dx;
      if (c.x < -c.w) Object.assign(c, randomCrack(W + Math.random() * 200));
    }
  },
  drawBackground() {
    const base = GROUND - 2;
    for (const b of buildings) {
      const x = Math.round(b.x);
      ctx.fillStyle = colors.far;
      ctx.fillRect(x, base - b.h, b.w, b.h);
      if (b.antenna) ctx.fillRect(x + Math.floor(b.w / 2), base - b.h - 12, 2, 12);
      // Windows
      ctx.fillStyle = colors.bg;
      for (let wy = base - b.h + 8; wy < base - 10; wy += 12) {
        for (let wx = x + 6; wx < x + b.w - 8; wx += 10) ctx.fillRect(wx, wy, 4, 6);
      }
    }
  },
  drawGround() {
    ctx.fillStyle = colors.fg;
    // Curb edge and sidewalk tile joints
    ctx.fillRect(0, GROUND + 18, W, 2);
    for (let x = -tileOffset; x < W; x += TILE) ctx.fillRect(Math.round(x), GROUND + 2, 2, 16);
    for (const c of cracks) ctx.fillRect(Math.round(c.x), c.y, c.w, 2);
  },
};

// ---------------------------------------------------------------------------
startGame({
  id: 'skate',
  player: SKATER,
  obstacles: [
    { frames: [CONE], weight: 0.22, maxGroup: 3 },
    { frames: [PEBBLES], weight: 0.08 },
    { frames: [HYDRANT], weight: 0.15, maxGroup: 2 },
    { frames: [TRASH_CAN], weight: 0.15, maxGroup: 2 },
    { frames: [BENCH], weight: 0.12, minScore: 100 },
    { frames: [BARRIER], weight: 0.1, minScore: 100 },
    { frames: [CART_A, CART_B], weight: 0.1, minScore: 150, extraSpeed: [60, 120], frameDuration: 0.1 },
    // Three heights: low (jump), middle (duck or jump), high (ride underneath)
    {
      frames: [PIGEON_UP, PIGEON_DOWN], weight: 0.2, minScore: 250,
      flyAt: [GROUND - 4, GROUND - 30, GROUND - 64], extraSpeed: [40, 100], frameDuration: 0.14,
    },
  ],
  scenery,
});
})();
