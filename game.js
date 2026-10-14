'use strict';

// ---------------------------------------------------------------------------
// Konfiguration
// ---------------------------------------------------------------------------
const W = 800;
const H = 220;
const GROUND = 196;          // y-koordinat där dinosaurien står
const S = 2;                 // pixelstorlek för sprites
const DINO_X = 50;

const START_SPEED = 360;     // px/s
const MAX_SPEED = 820;
const ACCEL = 6;             // px/s per sekund
const GRAVITY = 2400;        // px/s²
const JUMP_VELOCITY = -760;
const SHORT_JUMP_VELOCITY = -380;
const FAST_FALL = 3;         // gravitationsfaktor när man trycker ner i luften
const PTERO_FROM_SCORE = 250;
const NIGHT_EVERY = 700;
const SCORES_KEY = 'dino.scores';
const LEGACY_HISCORE_KEY = 'dino.hiscore';
const NAME_KEY = 'dino.name';
const MAX_SCORES = 10;

// ---------------------------------------------------------------------------
// Sprites ('#' = pixel). Varje sprite får bredd/höjd i spritepixlar.
// ---------------------------------------------------------------------------
function sprite(rows) {
  const w = Math.max(...rows.map(r => r.length));
  return { rows, w, h: rows.length };
}

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

function pixelAt(spr, x, y) {
  const row = spr.rows[y];
  return row !== undefined && row[x] === '#';
}

// ---------------------------------------------------------------------------
// Canvas & färger
// ---------------------------------------------------------------------------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;
canvas.width = W * dpr;
canvas.height = H * dpr;
ctx.scale(dpr, dpr);

const COLORS = {
  day: { fg: '#535353', bg: '#f7f7f7', cloud: '#c9c9c9' },
  night: { fg: '#c4c4c4', bg: '#202124', cloud: '#4a4b4e' },
};
let colors = COLORS.day;

function drawSprite(spr, x, y, color = colors.fg) {
  ctx.fillStyle = color;
  const ox = Math.round(x);
  const oy = Math.round(y);
  for (let r = 0; r < spr.h; r++) {
    const row = spr.rows[r];
    for (let c = 0; c < row.length; c++) {
      if (row[c] === '#') ctx.fillRect(ox + c * S, oy + r * S, S, S);
    }
  }
}

// ---------------------------------------------------------------------------
// Ljud (enkla pip via WebAudio)
// ---------------------------------------------------------------------------
let audio = null;
let muted = false;

function beep(freq, duration, type = 'square', volume = 0.05) {
  if (muted) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duration);
  } catch (_) { /* ljud är inte kritiskt */ }
}

const sound = {
  jump: () => beep(660, 0.08),
  point: () => { beep(880, 0.08); setTimeout(() => beep(1320, 0.12), 90); },
  die: () => { beep(200, 0.15, 'sawtooth'); setTimeout(() => beep(120, 0.25, 'sawtooth'), 120); },
};

// ---------------------------------------------------------------------------
// Topplista (sparas i webbläsarens localStorage)
// ---------------------------------------------------------------------------
function storageGet(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (_) { /* ignorera */ }
}

function loadScores() {
  let list = [];
  try { list = JSON.parse(storageGet(SCORES_KEY)) || []; } catch (_) { list = []; }
  list = list.filter(e => e && typeof e.name === 'string' && Number.isFinite(e.score));
  // Flytta över rekordet från den tidigare versionen som saknade namn
  const legacy = Number(storageGet(LEGACY_HISCORE_KEY)) || 0;
  if (list.length === 0 && legacy > 0) list.push({ name: '???', score: legacy, date: Date.now() });
  return list.sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);
}

function saveScores(list) {
  storageSet(SCORES_KEY, JSON.stringify(list));
}

function qualifies(score) {
  const list = state.scores;
  return score > 0 && (list.length < MAX_SCORES || score > list[list.length - 1].score);
}

function addScore(name, score) {
  const entry = { name, score, date: Date.now() };
  state.scores.push(entry);
  // Vid lika poäng hamnar det äldre resultatet först
  state.scores.sort((a, b) => b.score - a.score || a.date - b.date);
  state.scores = state.scores.slice(0, MAX_SCORES);
  saveScores(state.scores);
  return entry;
}

function topScore() {
  return state.scores.length ? state.scores[0].score : 0;
}

// ---------------------------------------------------------------------------
// Topplistans HTML-panel
// ---------------------------------------------------------------------------
const board = document.getElementById('board');
const entryForm = document.getElementById('entry');
const nameInput = document.getElementById('name');
const scoreList = document.getElementById('scores');
const emptyText = document.getElementById('empty');

function renderBoard(latest = null) {
  scoreList.replaceChildren(...state.scores.map(e => {
    const li = document.createElement('li');
    if (e === latest) li.className = 'latest';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = e.name;
    const score = document.createElement('span');
    score.className = 'score';
    score.textContent = pad(e.score);
    li.append(name, score);
    return li;
  }));
  emptyText.hidden = state.scores.length > 0;
}

function showEntry() {
  entryForm.hidden = false;
  nameInput.value = storageGet(NAME_KEY) || '';
  nameInput.focus();
  nameInput.select();
}

function finishEntry(name) {
  entryForm.hidden = true;
  nameInput.blur();
  let latest = null;
  if (name !== null) {
    name = name.trim().toUpperCase().slice(0, 12) || 'ANONYM';
    storageSet(NAME_KEY, name);
    latest = addScore(name, state.score);
  }
  renderBoard(latest);
  state.overAt = performance.now();
  setMode('over');
}

entryForm.addEventListener('submit', e => {
  e.preventDefault();
  finishEntry(nameInput.value);
});

nameInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') finishEntry(null); // hoppa över utan att spara
});

// ---------------------------------------------------------------------------
// Speltillstånd
// ---------------------------------------------------------------------------
const state = {
  mode: 'start',             // start | running | paused | entry | over
  speed: START_SPEED,
  distance: 0,
  score: 0,
  scores: [],
  flash: 0,                  // blinkar poängen vid varje 100
  overAt: 0,
  night: false,
  dino: null,
  obstacles: [],
  clouds: [],
  bumps: [],
  nextObstacleIn: 0,
  groundOffset: 0,
};

const input = { jump: false, down: false };

function reset() {
  state.speed = START_SPEED;
  state.distance = 0;
  state.score = 0;
  state.flash = 0;
  state.dino = { y: 0, vy: 0, onGround: true, ducking: false, frameTime: 0 };
  state.obstacles = [];
  state.nextObstacleIn = 600;
  setNight(false);
}

function setNight(on) {
  state.night = on;
  colors = on ? COLORS.night : COLORS.day;
  document.body.classList.toggle('night', on);
}

function initScenery() {
  state.clouds = Array.from({ length: 3 }, (_, i) => ({
    x: 150 + i * 280 + Math.random() * 100,
    y: 30 + Math.random() * 60,
  }));
  state.bumps = Array.from({ length: 40 }, () => randomBump(Math.random() * W));
}

function randomBump(x) {
  return { x, y: GROUND + 4 + Math.floor(Math.random() * 12), w: 1 + Math.floor(Math.random() * 3) * 2 };
}

// ---------------------------------------------------------------------------
// Hinder
// ---------------------------------------------------------------------------
function spawnObstacle() {
  const canPtero = state.score >= PTERO_FROM_SCORE;
  if (canPtero && Math.random() < 0.25) {
    // Tre höjder: låg (hoppa), mellan (ducka eller hoppa), hög (spring under)
    const bottoms = [GROUND - 4, GROUND - 30, GROUND - 58];
    const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
    state.obstacles.push({
      kind: 'ptero', x: W + 20, y: bottom - PTERO_UP.h * S,
      sprite: PTERO_UP, frameTime: 0, extraSpeed: 40 + Math.random() * 60,
    });
    return;
  }

  const large = Math.random() < 0.45;
  const spr = large ? CACTUS_LARGE : CACTUS_SMALL;
  // Fler kaktusar i grupp när det går fortare
  const maxGroup = state.speed > 560 ? 3 : state.speed > 440 ? 2 : 1;
  const count = 1 + Math.floor(Math.random() * maxGroup);
  for (let i = 0; i < count; i++) {
    state.obstacles.push({
      kind: 'cactus', x: W + 20 + i * (spr.w * S - 2), y: GROUND + 2 - spr.h * S, sprite: spr,
    });
  }
}

function nextGap() {
  // Minsta avstånd växer med farten så att det alltid går att klara
  const min = state.speed * 0.75;
  return min + Math.random() * state.speed * 0.9;
}

// ---------------------------------------------------------------------------
// Kollision: först rektangel, sedan pixelexakt
// ---------------------------------------------------------------------------
function collides(a, ax, ay, b, bx, by) {
  ax = Math.round(ax); ay = Math.round(ay); bx = Math.round(bx); by = Math.round(by);
  const left = Math.max(ax, bx);
  const right = Math.min(ax + a.w * S, bx + b.w * S);
  const top = Math.max(ay, by);
  const bottom = Math.min(ay + a.h * S, by + b.h * S);
  if (left >= right || top >= bottom) return false;
  for (let y = top; y < bottom; y += S) {
    for (let x = left; x < right; x += S) {
      if (pixelAt(a, ((x - ax) / S) | 0, ((y - ay) / S) | 0) &&
          pixelAt(b, ((x - bx) / S) | 0, ((y - by) / S) | 0)) {
        return true;
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Uppdatering
// ---------------------------------------------------------------------------
function dinoSprite() {
  const d = state.dino;
  if (state.mode === 'over' || state.mode === 'entry') return DINO.dead;
  if (state.mode === 'start' || !d.onGround) return DINO.stand;
  const alt = Math.floor(d.frameTime / 0.1) % 2 === 0;
  if (d.ducking) return alt ? DINO.duckA : DINO.duckB;
  return alt ? DINO.runA : DINO.runB;
}

function dinoTop(spr) {
  return GROUND + 2 - spr.h * S + state.dino.y;
}

function update(dt) {
  const d = state.dino;

  // Fart & poäng
  state.speed = Math.min(MAX_SPEED, state.speed + ACCEL * dt);
  const dx = state.speed * dt;
  state.distance += dx;
  const newScore = Math.floor(state.distance * 0.025);
  if (Math.floor(newScore / 100) > Math.floor(state.score / 100)) {
    state.flash = 1.2;
    sound.point();
  }
  if (Math.floor(newScore / NIGHT_EVERY) !== Math.floor(state.score / NIGHT_EVERY)) {
    setNight(!state.night);
  }
  state.score = newScore;
  state.flash = Math.max(0, state.flash - dt);

  // Dinosaurien
  d.frameTime += dt;
  if (input.jump && d.onGround) {
    d.vy = JUMP_VELOCITY;
    d.onGround = false;
    sound.jump();
  }
  if (!d.onGround) {
    // Släpper man hoppknappen tidigt blir hoppet lägre
    if (!input.jump && d.vy < SHORT_JUMP_VELOCITY) d.vy = SHORT_JUMP_VELOCITY;
    d.vy += GRAVITY * (input.down ? FAST_FALL : 1) * dt;
    d.y += d.vy * dt;
    if (d.y >= 0) { d.y = 0; d.vy = 0; d.onGround = true; }
  }
  d.ducking = input.down && d.onGround;

  // Hinder
  state.nextObstacleIn -= dx;
  if (state.nextObstacleIn <= 0) {
    spawnObstacle();
    state.nextObstacleIn = nextGap();
  }
  for (const o of state.obstacles) {
    o.x -= dx + (o.extraSpeed || 0) * dt;
    if (o.kind === 'ptero') {
      o.frameTime += dt;
      o.sprite = Math.floor(o.frameTime / 0.18) % 2 === 0 ? PTERO_UP : PTERO_DOWN;
    }
  }
  state.obstacles = state.obstacles.filter(o => o.x + o.sprite.w * S > -10);

  // Kollision
  const spr = dinoSprite();
  const top = dinoTop(spr);
  for (const o of state.obstacles) {
    if (collides(spr, DINO_X, top, o.sprite, o.x, o.y)) {
      gameOver();
      return;
    }
  }

  updateScenery(dx);
}

function updateScenery(dx) {
  state.groundOffset = (state.groundOffset + dx) % W;
  for (const c of state.clouds) {
    c.x -= dx * 0.15;
    if (c.x < -CLOUD.w * S) { c.x = W + Math.random() * 200; c.y = 30 + Math.random() * 60; }
  }
  for (const b of state.bumps) {
    b.x -= dx;
    if (b.x < -4) Object.assign(b, randomBump(W + Math.random() * 40));
  }
}

function setMode(mode) {
  state.mode = mode;
  board.classList.toggle('hidden', mode === 'running' || mode === 'paused');
}

function gameOver() {
  state.overAt = performance.now();
  input.jump = false;
  input.down = false;
  sound.die();
  if (qualifies(state.score)) {
    setMode('entry');
    showEntry();
  } else {
    renderBoard();
    setMode('over');
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function pad(n) { return String(n).padStart(5, '0'); }

function render() {
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, W, H);

  for (const c of state.clouds) drawSprite(CLOUD, c.x, c.y, colors.cloud);

  // Mark
  ctx.fillStyle = colors.fg;
  ctx.fillRect(0, GROUND, W, 2);
  for (const b of state.bumps) ctx.fillRect(Math.round(b.x), b.y, b.w, 2);

  for (const o of state.obstacles) drawSprite(o.sprite, o.x, o.y);

  const spr = dinoSprite();
  drawSprite(spr, DINO_X, dinoTop(spr));

  // Poäng
  ctx.fillStyle = colors.fg;
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  const showScore = state.flash === 0 || Math.floor(state.flash * 4) % 2 === 0;
  const scoreText = showScore ? pad(state.flash > 0 ? Math.floor(state.score / 100) * 100 : state.score) : '     ';
  ctx.fillText(`HI ${pad(topScore())}  ${scoreText}`, W - 16, 12);

  ctx.textAlign = 'center';
  if (state.mode === 'start') {
    ctx.fillText('Tryck SPACE för att starta', W / 2, 80);
  } else if (state.mode === 'paused') {
    ctx.fillText('PAUS – tryck P för att fortsätta', W / 2, 80);
  } else if (state.mode === 'over' || state.mode === 'entry') {
    ctx.font = 'bold 26px "Courier New", monospace';
    ctx.fillText('G A M E   O V E R', W / 2, 62);
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText(state.mode === 'entry'
      ? `${state.score} poäng – skriv ditt namn nedan`
      : 'Tryck SPACE för att spela igen', W / 2, 100);
  }
  if (muted) {
    ctx.textAlign = 'left';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('ljud av (M)', 16, 12);
  }
}

// ---------------------------------------------------------------------------
// Spelloop
// ---------------------------------------------------------------------------
let last = performance.now();

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); // undvik stora hopp efter flikbyte
  last = now;
  if (state.mode === 'running') update(dt);
  render();
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
function pressJump() {
  if (state.mode === 'start') {
    setMode('running');
  } else if (state.mode === 'over') {
    if (performance.now() - state.overAt < 500) return; // undvik oavsiktlig omstart
    reset();
    renderBoard();
    setMode('running');
  } else if (state.mode === 'entry') {
    return;
  }
  input.jump = true;
}

function togglePause() {
  if (state.mode === 'running') setMode('paused');
  else if (state.mode === 'paused') setMode('running');
}

const JUMP_KEYS = ['Space', 'ArrowUp', 'KeyW'];
const DOWN_KEYS = ['ArrowDown', 'KeyS'];

document.addEventListener('keydown', e => {
  if (e.target === nameInput) return; // låt namnfältet ta emot tangenterna
  if (JUMP_KEYS.includes(e.code)) {
    e.preventDefault();
    if (!e.repeat) pressJump();
  } else if (DOWN_KEYS.includes(e.code)) {
    e.preventDefault();
    input.down = true;
  } else if (e.code === 'KeyP') {
    togglePause();
  } else if (e.code === 'KeyM') {
    muted = !muted;
  }
});

document.addEventListener('keyup', e => {
  if (JUMP_KEYS.includes(e.code)) input.jump = false;
  else if (DOWN_KEYS.includes(e.code)) input.down = false;
});

canvas.addEventListener('pointerdown', e => { e.preventDefault(); pressJump(); });
window.addEventListener('pointerup', () => { input.jump = false; });

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.mode === 'running') setMode('paused');
});

// ---------------------------------------------------------------------------
state.scores = loadScores();
renderBoard();
reset();
initScenery();
requestAnimationFrame(loop);
