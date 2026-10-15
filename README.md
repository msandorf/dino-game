# Dino

A jumping game inspired by Chrome's "no internet connection" dinosaur. A little dinosaur runs along
the road and has to avoid cacti and pterodactyls while the speed keeps increasing.

Plain HTML5 Canvas and JavaScript – no dependencies and no build step.

## Play

Open `index.html` in a browser.

| Key | Action |
|---|---|
| `Space` / `↑` / `W` | Jump (hold for a higher jump) |
| `↓` / `S` | Duck – in the air: fall faster |
| `P` | Pause |
| `M` | Sound on/off |

On phones and tablets, tap the game area to jump.

## Features

- Small and large cacti, in groups as the speed increases
- Pterodactyls from 250 points, at three heights (jump, duck or run underneath)
- Pixel-perfect collision detection
- Day/night switch every 700 points
- Top 10 high score list with name entry after game over, stored in the browser's `localStorage`

## Files

- `index.html` – the page and the high score panel
- `style.css` – styling, including night mode
- `game.js` – game logic, sprites, sound and high score list

The in-game text is in Swedish.
