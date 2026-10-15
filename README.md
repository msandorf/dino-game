# Dino

A jumping game inspired by Chrome's "no internet connection" dinosaur, in three versions:

- **Dino** – a little dinosaur runs along the road and avoids cacti and pterodactyls.
- **Skate** – a street skater rolls through the city and avoids traffic cones, pebbles, fire
  hydrants, trash cans, benches, road barriers, runaway shopping carts and pigeons.
- **Runner** – a jogger in the park leaps hurdles, puddles, logs and strollers, and dodges loose
  dogs and frisbees.

The speed keeps increasing. Plain HTML5 Canvas and JavaScript – no dependencies and no build step.

## Play

Open `index.html` (Dino), `skate/index.html` (Skate) or `runner/index.html` (Runner) in a browser.
Each page links to the others.

Online: [Dino](https://msandorf.github.io/dino-game/) · [Skate](https://msandorf.github.io/dino-game/skate/) ·
[Runner](https://msandorf.github.io/dino-game/runner/)

| Key | Action |
|---|---|
| `Space` / `↑` / `W` | Jump / ollie (hold for a higher jump) |
| `↓` / `S` | Duck – in the air: fall faster |
| `P` | Pause |
| `M` | Cycle sound: music + effects → effects only → off (remembered) |

On phones and tablets, tap the game area to jump.

## Features

- Obstacles in groups as the speed increases, more obstacle types the further you get
- Flying obstacles at three heights (jump, duck or pass underneath)
- Skate: shopping carts roll towards you faster than the street; Runner: loose dogs run at you
- Pixel-perfect collision detection
- Day/night switch every 700 points
- 8-bit music, original compositions: a sweeping adventure theme for Dino, a heavy riff for
  Skate and a triumphant training-montage fanfare for Runner. The tempo rises with the speed.
- Top 10 high score list per version with name entry after game over, stored in the browser's
  `localStorage`

## Files

- `index.html`, `skate/index.html`, `runner/index.html` – one page per version
- `style.css` – styling, including night mode and the high score panel
- `game.js` – the shared engine: physics, obstacle spawning, collisions, sound, music
  sequencer, high scores
- `themes/*.js` – sprites, obstacle types, scenery and music for each version

### Adding a version

A theme file defines the player sprites, a list of obstacle types and the scenery, and calls
`startGame({ id, player, obstacles, scenery, music })`. See the comments above `chooseSpec()`
and `compileSong()` in `game.js` for the obstacle options and the song format.
