'use strict';

// Shared game engine. A theme file (themes/*.js) defines the player, the
// obstacles and the scenery, and starts the game with startGame(theme).

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const W = 800;
const H = 220;
const GROUND = 196;          // y coordinate the player stands on
const S = 2;                 // pixel size for sprites
const PLAYER_X = 50;

const START_SPEED = 360;     // px/s
const MAX_SPEED = 820;
const ACCEL = 6;             // px/s per second
const GRAVITY = 2400;        // px/s²
const JUMP_VELOCITY = -760;
const SHORT_JUMP_VELOCITY = -380;
const FAST_FALL = 3;         // gravity multiplier when pressing down mid-air
const NIGHT_EVERY = 700;
const MAX_SCORES = 10;

let theme = null;

// ---------------------------------------------------------------------------
// Sprites ('#' = pixel). Each sprite gets width/height in sprite pixels.
// ---------------------------------------------------------------------------
function sprite(rows) {
  const w = Math.max(...rows.map(r => r.length));
  return { rows, w, h: rows.length };
}

function pixelAt(spr, x, y) {
  const row = spr.rows[y];
  return row !== undefined && row[x] === '#';
}

function randomBetween(range) {
  return range ? range[0] + Math.random() * (range[1] - range[0]) : 0;
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// ---------------------------------------------------------------------------
// Canvas & colors
// ---------------------------------------------------------------------------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;
canvas.width = W * dpr;
canvas.height = H * dpr;
ctx.scale(dpr, dpr);

const COLORS = {
  day: { fg: '#535353', bg: '#f7f7f7', faint: '#c9c9c9', far: '#e6e6e6' },
  night: { fg: '#c4c4c4', bg: '#202124', faint: '#4a4b4e', far: '#2d2e31' },
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
// Sound (simple beeps via WebAudio)
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
  } catch (_) { /* sound is not critical */ }
}

const sound = {
  jump: () => beep(660, 0.08),
  point: () => { beep(880, 0.08); setTimeout(() => beep(1320, 0.12), 90); },
  die: () => { beep(200, 0.15, 'sawtooth'); setTimeout(() => beep(120, 0.25, 'sawtooth'), 120); },
};

// ---------------------------------------------------------------------------
// High score list (stored in the browser's localStorage, one list per theme)
// ---------------------------------------------------------------------------
function storageGet(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (_) { /* ignore */ }
}

function scoresKey() { return `${theme.id}.scores`; }
function nameKey() { return `${theme.id}.name`; }

function loadScores() {
  let list = [];
  try { list = JSON.parse(storageGet(scoresKey())) || []; } catch (_) { list = []; }
  list = list.filter(e => e && typeof e.name === 'string' && Number.isFinite(e.score));
  return list.sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);
}

function saveScores(list) {
  storageSet(scoresKey(), JSON.stringify(list));
}

function qualifies(score) {
  const list = state.scores;
  return score > 0 && (list.length < MAX_SCORES || score > list[list.length - 1].score);
}

function addScore(name, score) {
  const entry = { name, score, date: Date.now() };
  state.scores.push(entry);
  // On equal scores the older result comes first
  state.scores.sort((a, b) => b.score - a.score || a.date - b.date);
  state.scores = state.scores.slice(0, MAX_SCORES);
  saveScores(state.scores);
  return entry;
}

function topScore() {
  return state.scores.length ? state.scores[0].score : 0;
}

// ---------------------------------------------------------------------------
// High score HTML panel
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
  nameInput.value = storageGet(nameKey()) || '';
  nameInput.focus();
  nameInput.select();
}

function finishEntry(name) {
  entryForm.hidden = true;
  nameInput.blur();
  let latest = null;
  if (name !== null) {
    name = name.trim().toUpperCase().slice(0, 12) || 'ANONYMOUS';
    storageSet(nameKey(), name);
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
  if (e.key === 'Escape') finishEntry(null); // skip without saving
});

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------
const state = {
  mode: 'start',             // start | running | paused | entry | over
  speed: START_SPEED,
  distance: 0,
  score: 0,
  scores: [],
  flash: 0,                  // blinks the score at every 100
  overAt: 0,
  night: false,
  player: null,
  obstacles: [],
  nextObstacleIn: 0,
  nextSpec: null,            // obstacle type that spawns when nextObstacleIn runs out
};

const input = { jump: false, down: false };

function reset() {
  state.speed = START_SPEED;
  state.distance = 0;
  state.score = 0;
  state.flash = 0;
  state.player = { y: 0, vy: 0, onGround: true, ducking: false, frameTime: 0 };
  state.obstacles = [];
  state.nextSpec = chooseSpec();
  state.nextObstacleIn = 600;
  setNight(false);
}

function setNight(on) {
  state.night = on;
  colors = on ? COLORS.night : COLORS.day;
  document.body.classList.toggle('night', on);
}

// ---------------------------------------------------------------------------
// Obstacles
//
// Each obstacle spec in the theme has:
//   frames        sprite list (animated when more than one)
//   weight        relative spawn chance
//   minScore      first score it can appear at (default 0)
//   maxGroup      how many can appear side by side (default 1)
//   flyAt         list of bottom y positions; makes it a flying obstacle
//   extraSpeed    [min, max] px/s it moves towards the player on its own
//   frameDuration seconds per animation frame
// ---------------------------------------------------------------------------
function chooseSpec() {
  const options = theme.obstacles.filter(o => state.score >= (o.minScore || 0));
  let r = Math.random() * options.reduce((sum, o) => sum + o.weight, 0);
  for (const o of options) {
    r -= o.weight;
    if (r < 0) return o;
  }
  return options[options.length - 1];
}

function spawnObstacle(spec) {
  const first = spec.frames[0];
  const base = {
    frames: spec.frames, sprite: first, frameTime: 0,
    frameDuration: spec.frameDuration || 0.18,
    extraSpeed: randomBetween(spec.extraSpeed),
  };
  if (spec.flyAt) {
    state.obstacles.push({ ...base, x: W + 20, y: pickRandom(spec.flyAt) - first.h * S });
    return;
  }
  // More obstacles per group at higher speeds
  const speedGroup = state.speed > 560 ? 3 : state.speed > 440 ? 2 : 1;
  const count = 1 + Math.floor(Math.random() * Math.min(spec.maxGroup || 1, speedGroup));
  for (let i = 0; i < count; i++) {
    state.obstacles.push({ ...base, x: W + 20 + i * (first.w * S - 2), y: GROUND + 2 - first.h * S });
  }
}

function nextGap(spec) {
  // Minimum gap grows with speed so it is always possible to clear
  const min = state.speed * 0.75;
  // Obstacles that move on their own catch up with the previous one, so they get a head start
  const catchUp = spec.extraSpeed ? spec.extraSpeed[1] * (W - PLAYER_X) / state.speed : 0;
  return min + catchUp + Math.random() * state.speed * 0.9;
}

// ---------------------------------------------------------------------------
// Collision: bounding box first, then pixel-perfect
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
// Update
// ---------------------------------------------------------------------------
function playerSprite() {
  const p = state.player;
  const sprites = theme.player;
  if (state.mode === 'over' || state.mode === 'entry') return sprites.dead;
  if (state.mode === 'start') return sprites.stand;
  if (!p.onGround) return sprites.jump || sprites.stand;
  const alt = Math.floor(p.frameTime / (sprites.frameDuration || 0.1)) % 2 === 0;
  if (p.ducking) return alt ? sprites.duckA : sprites.duckB;
  return alt ? sprites.runA : sprites.runB;
}

function playerTop(spr) {
  return GROUND + 2 - spr.h * S + state.player.y;
}

function update(dt) {
  const p = state.player;

  // Speed & score
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

  // The player
  p.frameTime += dt;
  if (input.jump && p.onGround) {
    p.vy = JUMP_VELOCITY;
    p.onGround = false;
    sound.jump();
  }
  if (!p.onGround) {
    // Releasing the jump key early gives a lower jump
    if (!input.jump && p.vy < SHORT_JUMP_VELOCITY) p.vy = SHORT_JUMP_VELOCITY;
    p.vy += GRAVITY * (input.down ? FAST_FALL : 1) * dt;
    p.y += p.vy * dt;
    if (p.y >= 0) { p.y = 0; p.vy = 0; p.onGround = true; }
  }
  p.ducking = input.down && p.onGround;

  // Obstacles
  state.nextObstacleIn -= dx;
  if (state.nextObstacleIn <= 0) {
    spawnObstacle(state.nextSpec);
    state.nextSpec = chooseSpec();
    state.nextObstacleIn = nextGap(state.nextSpec);
  }
  for (const o of state.obstacles) {
    o.x -= dx + o.extraSpeed * dt;
    if (o.frames.length > 1) {
      o.frameTime += dt;
      o.sprite = o.frames[Math.floor(o.frameTime / o.frameDuration) % o.frames.length];
    }
  }
  state.obstacles = state.obstacles.filter(o => o.x + o.sprite.w * S > -10);

  // Collision
  const spr = playerSprite();
  const top = playerTop(spr);
  for (const o of state.obstacles) {
    if (collides(spr, PLAYER_X, top, o.sprite, o.x, o.y)) {
      gameOver();
      return;
    }
  }

  theme.scenery.update(dx);
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

  theme.scenery.drawBackground();

  // Ground
  ctx.fillStyle = colors.fg;
  ctx.fillRect(0, GROUND, W, 2);
  theme.scenery.drawGround();

  for (const o of state.obstacles) drawSprite(o.sprite, o.x, o.y);

  const spr = playerSprite();
  drawSprite(spr, PLAYER_X, playerTop(spr));

  // Score
  ctx.fillStyle = colors.fg;
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  const showScore = state.flash === 0 || Math.floor(state.flash * 4) % 2 === 0;
  const scoreText = showScore ? pad(state.flash > 0 ? Math.floor(state.score / 100) * 100 : state.score) : '     ';
  ctx.fillText(`HI ${pad(topScore())}  ${scoreText}`, W - 16, 12);

  ctx.textAlign = 'center';
  if (state.mode === 'start') {
    ctx.fillText('Press SPACE to start', W / 2, 80);
  } else if (state.mode === 'paused') {
    ctx.fillText('PAUSED – press P to continue', W / 2, 80);
  } else if (state.mode === 'over' || state.mode === 'entry') {
    ctx.font = 'bold 26px "Courier New", monospace';
    ctx.fillText('G A M E   O V E R', W / 2, 62);
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText(state.mode === 'entry'
      ? `${state.score} points – enter your name below`
      : 'Press SPACE to play again', W / 2, 100);
  }
  if (muted) {
    ctx.textAlign = 'left';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('sound off (M)', 16, 12);
  }
}

// ---------------------------------------------------------------------------
// Game loop
// ---------------------------------------------------------------------------
let last = performance.now();

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); // avoid big jumps after switching tabs
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
    if (performance.now() - state.overAt < 500) return; // avoid accidental restarts
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
  if (e.target === nameInput) return; // let the name field receive the keys
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
// Start
// ---------------------------------------------------------------------------
function startGame(selectedTheme) {
  theme = selectedTheme;
  state.scores = loadScores();
  renderBoard();
  reset();
  theme.scenery.init();
  requestAnimationFrame(loop);
}
