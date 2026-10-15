# Dino

Ett hoppspel inspirerat av Chromes "ingen internetanslutning"-dinosaurie. En liten dinosaurie springer
längs vägen och ska undvika kaktusar och flygödlor. Farten ökar hela tiden.

Ren HTML5 Canvas och JavaScript – inga beroenden och inget byggsteg.

## Spela

Öppna `index.html` i en webbläsare.

| Tangent | Funktion |
|---|---|
| `Space` / `↑` / `W` | Hoppa (håll inne för högre hopp) |
| `↓` / `S` | Ducka – i luften: snabbare fall |
| `P` | Paus |
| `M` | Ljud av/på |

På mobil/surfplatta trycker man på spelytan för att hoppa.

## Funktioner

- Små och stora kaktusar, i grupper när farten ökar
- Flygödlor från 250 poäng, på tre höjder (hoppa, ducka eller spring under)
- Pixelexakt kollision
- Dag/natt-växling var 700:e poäng
- Topplista (topp 10) med namninmatning efter game over, sparas i webbläsarens `localStorage`

## Filer

- `index.html` – sidan och topplistans panel
- `style.css` – utseende, inklusive nattläge
- `game.js` – spellogik, sprites, ljud och topplista
