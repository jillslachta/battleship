# Battleship

A browser Battleship game: you versus a computer opponent that actually hunts.

**Play it live: https://jillslachta.github.io/battleship/**

## How to play

1. On the title screen, press **Begin Game**.
2. Deploy your fleet — either **Place manually** (tap a square to drop the highlighted ship; use **Rotate** to switch between across and down) or **Randomize** for an instant legal layout. Randomize never hands you a layout you have already been given until every layout it can reach has been used.
3. Press **Start battle**.
4. Tap a square on **Enemy waters** to fire. Turns alternate: the computer answers each of your shots.
   - A white dot is a **miss**, a red ✕ is a **hit**, and a dark red block marks a **sunk** ship.
   - The banner above the boards shows whose turn it is; the battle log lists every shot.
5. Sink all five enemy ships to win. Lose all five of yours and the computer takes the seas. Either way you get a **Play again** button.

The layout stacks vertically and the grids scale to the viewport, so it works on a phone.

### Rules

- 10x10 grid per player.
- Five ships each: Carrier (5), Battleship (4), Cruiser (3), Submarine (3), Destroyer (2).
- Ships are placed horizontally or vertically, fully on the board, never overlapping.
- One shot per turn, and a square can only be fired at once.

### The computer opponent

While hunting it fires on a checkerboard parity pattern, which is the fewest shots needed to guarantee touching every ship. As soon as it scores a hit it switches to target mode and works the four neighbouring squares; once two hits line up it locks onto that axis and fires at the ends of the run until the ship sinks, then resumes hunting.

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # game-rule and AI tests (Vitest)
npm run typecheck  # TypeScript
npm run build      # production build into dist/
```

### Layout

| Path | What's in it |
| --- | --- |
| `src/game/` | Rules engine: board, placement validation, firing, sinking, win condition. No DOM. |
| `src/ai/` | Hunt/target computer opponent. |
| `src/ui/` | Landing, fleet setup, and battle screens. |
| `tests/` | Vitest coverage of placement, hits, sinking, win condition, and AI behaviour. |

## Deployment

Pushes to `main` build the site and publish it to GitHub Pages via `.github/workflows/deploy.yml`.

## Sound credits

Sound effects and music are free-to-use clips from [Pixabay](https://pixabay.com/) (Pixabay Content License, no attribution required): missile firing and war drum loop by freesound_community, missile explosion by voicebosch, war horn and drums by soundmarker33. The splash, sunk, victory and defeat clips are edits of those recordings.
