# Dino

A jumping game inspired by Chrome's "no internet connection" dinosaur, in two versions:

- **Dino** – a little dinosaur runs along the road and avoids cacti and pterodactyls.
- **Skate** – a street skater rolls through the city and avoids traffic cones, pebbles, fire
  hydrants, trash cans, benches, road barriers, runaway shopping carts and pigeons.

The speed keeps increasing. Plain HTML5 Canvas and JavaScript – no dependencies and no build step.

## Play

Open `index.html` (Dino) or `skate/index.html` (Skate) in a browser. Each page links to the other.

Online: <https://msandorf.github.io/dino-game/> and <https://msandorf.github.io/dino-game/skate/>

| Key | Action |
|---|---|
| `Space` / `↑` / `W` | Jump / ollie (hold for a higher jump) |
| `↓` / `S` | Duck – in the air: fall faster |
| `P` | Pause |
| `M` | Sound on/off |

On phones and tablets, tap the game area to jump.

## Features

- Obstacles in groups as the speed increases, more obstacle types the further you get
- Flying obstacles at three heights (jump, duck or pass underneath)
- Skate: shopping carts roll towards you faster than the street
- Pixel-perfect collision detection
- Day/night switch every 700 points
- Top 10 high score list per version with name entry after game over, stored in the browser's
  `localStorage`

## Files

- `index.html` – the Dino page, `skate/index.html` – the Skate page
- `style.css` – styling, including night mode and the high score panel
- `game.js` – the shared engine: physics, obstacle spawning, collisions, sound, high scores
- `themes/dino.js`, `themes/skate.js` – sprites, obstacle types and scenery for each version

### Adding a version

A theme file defines the player sprites, a list of obstacle types and the scenery, and calls
`startGame({ id, player, obstacles, scenery })`. See the comment above `chooseSpec()` in
`game.js` for the obstacle options.
