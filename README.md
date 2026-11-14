# Make It Pop

A merge game about running a branding studio. By Ademan Studio, for Daphi and everyone else who plays these between calls.

Play: https://smith104th.github.io/make-it-pop/ (Add to Home Screen on iPhone for the full-screen app.)

## The game

- **Desk.** Tap **Brief** for new work (costs 1 mate). Drag two of the same together to merge them up. Deliver what the three clients up top ask for.
- **Chains.** Type (letter → brand book), Files (draft.pdf → FINAL_FINAL_USE_THIS → Approved), Photo (polaroid → billboard, from level 2), Packaging (cardboard → gift set, from level 3).
- **Client feedback.** Sticky notes land on the desk and lock tiles. Merge right next to one to resolve it, or hit **AHRE** to laugh off every note at once. You earn an AHRE every 3 launches and for every solved Client Note.
- **Mate.** Refills one every 75 seconds. Out of mate, send someone for a thermos refill ($30).
- **Notes.** Ten trick puzzles, each a real client note solved literally. **¿Ubicás?** gives Daphi's hint.
- **Studio.** Level, stats, and rooms to build: Riso room, Photo set, Packaging lab, Stop-motion corner.
- **Portfolio.** Every launched brand, in grid or list, with a share button.

Progress saves on the phone (localStorage). No accounts, no backend yet.

## Build

```sh
npm install
node build.mjs        # src/ → docs/
npm test              # build, then play through everything in headless Chrome
```

`docs/` is what GitHub Pages serves, so commit it with every change to `src/`.

## Files

- `src/main.js`: desk, board, orders, stickies, AHRE, studio, portfolio
- `src/art.js`: every tile, drawn as SVG in Ademan colors
- `src/notes.js`: the ten Client Notes puzzles
- `src/daphi.js`: what Daphi says (ahre, ¿ubicás?)
- `src/clients.js`: made-up clients and how orders are generated
- `src/sw.js`: offline support
