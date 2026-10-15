'use strict';

// Dino theme: the original Chrome-style dinosaur among cacti and pterodactyls.
(() => {
// ---------------------------------------------------------------------------
// Sprites
// ---------------------------------------------------------------------------
const DINO_BODY = [
  '...........########.',
  '..........##.#######',
  '..........##########',
  '..........##########',
  '..........#####.....',
  '..........########..',
  '#........#####......',
  '#.......#######.....',
  '##.....#########....',
  '###...##########.#..',
  '################....',
  '.###############....',
  '..#############.....',
  '...###########......',
  '....#########.......',
  '.....#######........',
];
const DINO_DEAD_HEAD = [
  '...........########.',
  '..........#...######',
  '..........#.#.######',
  '..........#...######',
];
const LEGS_STAND = ['.....###.##.', '.....##...#.', '.....#....#.', '.....##...##'];
const LEGS_RUN_A = ['.....###.##.', '.....##...##', '.....#......', '.....##.....'];
const LEGS_RUN_B = ['.....###.##.', '.....###..#.', '...........#', '..........##'];

const DINO = {
  stand: sprite([...DINO_BODY, ...LEGS_STAND]),
  runA: sprite([...DINO_BODY, ...LEGS_RUN_A]),
  runB: sprite([...DINO_BODY, ...LEGS_RUN_B]),
  dead: sprite([...DINO_DEAD_HEAD, ...DINO_BODY.slice(4), ...LEGS_STAND]),
};

const DUCK_BODY = [
  '.....................########.',
  '#...................##.#######',
  '##......###########.##########',
  '###..#########################',
  '############################..',
  '.###################.#######..',
  '..##################..........',
  '...############..#............',
  '....#########.....#...........',
];
DINO.duckA = sprite([...DUCK_BODY, '.....###.##...', '.....##....#..', '.....#........', '.....##.......']);
DINO.duckB = sprite([...DUCK_BODY, '.....###.##...', '.....#....##..', '...........#..', '..........##..']);

const CACTUS_SMALL = sprite([
  '...##....',
  '..####...',
  '..####..#',
  '#.####..#',
  '#.####.##',
  '#.######.',
  '#######..',
  '.######..',
  '..####...',
  '..####...',
  '..####...',
  '..####...',
  '..####...',
  '..####...',
  '..####...',
  '..####...',
]);

const CACTUS_LARGE = sprite([
  '.....###.....',
  '....#####....',
  '....#####....',
  '....#####..##',
  '##..#####..##',
  '##..#####..##',
  '##..#####..##',
  '##..#####..##',
  '##..#####.###',
  '###.########.',
  '.#########...',
  '..#######....',
  '....#####....',
  '....#####....',
  '....#####....',
  '....#####....',
  '....#####....',
  '....#####....',
  '....#####....',
  '....#####....',
  '....#####....',
]);

const PTERO_UP = sprite([
  '......#..........',
  '......##.........',
  '......###........',
  '...#..####.......',
  '..##..#####......',
  '.###########.....',
  '#################',
  '......##########.',
  '.......######....',
  '.................',
  '.................',
  '.................',
  '.................',
]);
const PTERO_DOWN = sprite([
  '.................',
  '.................',
  '.................',
  '...#.............',
  '..##.............',
  '.################',
  '#################',
  '......##########.',
  '......######.....',
  '......####.......',
  '......###........',
  '......##.........',
  '......#..........',
]);

const CLOUD = sprite([
  '.........####.........',
  '.......##....##.......',
  '....###........#......',
  '...#............###...',
  '.##................##.',
  '#....................#',
  '######################',
]);


// ---------------------------------------------------------------------------
// Scenery: clouds in the sky and small bumps in the sand
// ---------------------------------------------------------------------------
let clouds = [];
let bumps = [];

function randomBump(x) {
  return { x, y: GROUND + 4 + Math.floor(Math.random() * 12), w: 1 + Math.floor(Math.random() * 3) * 2 };
}

const scenery = {
  init() {
    clouds = Array.from({ length: 3 }, (_, i) => ({
      x: 150 + i * 280 + Math.random() * 100,
      y: 30 + Math.random() * 60,
    }));
    bumps = Array.from({ length: 40 }, () => randomBump(Math.random() * W));
  },
  update(dx) {
    for (const c of clouds) {
      c.x -= dx * 0.15;
      if (c.x < -CLOUD.w * S) { c.x = W + Math.random() * 200; c.y = 30 + Math.random() * 60; }
    }
    for (const b of bumps) {
      b.x -= dx;
      if (b.x < -4) Object.assign(b, randomBump(W + Math.random() * 40));
    }
  },
  drawBackground() {
    for (const c of clouds) drawSprite(CLOUD, c.x, c.y, colors.faint);
  },
  drawGround() {
    ctx.fillStyle = colors.fg;
    for (const b of bumps) ctx.fillRect(Math.round(b.x), b.y, b.w, 2);
  },
};

// ---------------------------------------------------------------------------
// Music: a sweeping adventure theme in D major (original composition)
// ---------------------------------------------------------------------------
const MELODY = [
  'D5 - - - - - - - A4 - - - B4 - - -',
  'F#5 - - - - - - - - - - - E5 - - -',
  'D5 - - - E5 - - - F#5 - - - A5 - - -',
  'G5 - - - - - - - - - - - - - . .',
  'F#5 - - - - - - - E5 - - - D5 - - -',
  'B4 - - - - - - - C#5 - - - D5 - - -',
  'E5 - - - - - - - A4 - - - - - - -',
  'D5 - - - - - - - - - - - - - . .',
  'A5 - - - - - - - F#5 - - - G5 - - -',
  'A5 - - - - - - - - - - - B5 - - -',
  'A5 - - - G5 - - - F#5 - - - E5 - - -',
  'F#5 - - - - - - - - - - - . . . .',
  'G5 - - - - - - - F#5 - - - E5 - - -',
  'D5 - - - - - - - B4 - - - D5 - - -',
  'E5 - - - - - - - - - - - F#5 - E5 -',
  'D5 - - - - - - - - - - - . . . .',
].join(' | ');

// One chord per bar: bass root, then the notes the arpeggio walks through
const CHORDS = {
  D: ['D2', 'D3', 'A3', 'D4', 'F#4'],
  Bm: ['B1', 'B2', 'F#3', 'B3', 'D4'],
  Em: ['E2', 'E3', 'B3', 'E4', 'G4'],
  G: ['G1', 'G2', 'D3', 'G3', 'B3'],
  A: ['A1', 'A2', 'E3', 'A3', 'C#4'],
};
const PROGRESSION = ['D', 'Bm', 'Em', 'G', 'D', 'Bm', 'A', 'D', 'D', 'G', 'D', 'D', 'G', 'Bm', 'A', 'D'];

const ARPEGGIO = PROGRESSION.map(name => {
  const [, a, b, c, d] = CHORDS[name];
  return [a, b, c, d, c, b, c, d].map(n => `${n} -`).join(' ');
}).join(' | ');

const BASS = PROGRESSION.map(name => {
  const root = CHORDS[name][0];
  return `${root} - - - - - - - ${root} - - - - - - -`;
}).join(' | ');

// Timpani-like kicks on beats 1 and 3, with a roll at the end of each half
const DRUMS = PROGRESSION.map((_, bar) => (bar % 8 === 7
  ? 'k . . . k . . . k . k . k k k k'
  : 'k . . . . . . . k . . . . . . .')).join(' | ');

const MUSIC = {
  bpm: 100,
  tracks: [
    { wave: 'square', volume: 0.05, notes: MELODY },
    { wave: 'square', volume: 0.018, notes: ARPEGGIO },
    { wave: 'triangle', volume: 0.16, notes: BASS },
    { drums: true, volume: 0.22, notes: DRUMS },
  ],
};

// ---------------------------------------------------------------------------
startGame({
  id: 'dino',
  player: DINO,
  obstacles: [
    { frames: [CACTUS_SMALL], weight: 0.41, maxGroup: 3 },
    { frames: [CACTUS_LARGE], weight: 0.34, maxGroup: 3 },
    // Three heights: low (jump), middle (duck or jump), high (run underneath)
    {
      frames: [PTERO_UP, PTERO_DOWN], weight: 0.25, minScore: 250,
      flyAt: [GROUND - 4, GROUND - 30, GROUND - 58], extraSpeed: [40, 100],
    },
  ],
  scenery,
  music: MUSIC,
});
})();
