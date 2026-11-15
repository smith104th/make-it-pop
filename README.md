# Ademan Games

Games for between calls. By Ademan Studio, for Daphi and everyone else who plays these between meetings.

Play: https://smith104th.github.io/make-it-pop/ (Add to Home Screen on iPhone for the full-screen app.)

## The games

- **Final Final.** 2048, but every tile is a file name: draft.pdf → v2 → v3_final → FINAL → FINAL_FINAL → USE_THIS → Approved. Swipe, or arrow keys.
- **Feedback.** Ten trick puzzles, each a real client note solved literally ("Make it pop.", "Can we try it in blue?", "Quick call?"). **¿Ubicás?** gives Daphi's hint. Solving one pays mate, money and an AHRE into Make It Pop.
- **Scope Creep.** Snake, but you eat client requests and the project grows. The walls are the deadline. Invoices trim the scope.
- **Swatch.** See a color for three seconds, rebuild it with hue, saturation and brightness. Five rounds scored out of 10 with CIEDE2000. The daily set is the same for everyone, so scores compare.
- **Make It Pop.** The merge desk: briefs, four chains (Type, Files, Photo, Packaging), client orders, feedback stickies, AHRE, studio rooms and a portfolio wall.

Each game opens from the menu and slides in over it. Back, or a swipe in from the left edge, returns to the menu. Links like `#swatch` open a game directly.

Progress saves on the phone (localStorage). No accounts, no backend yet.

## Build

```sh
npm install
node build.mjs        # src/ → docs/
npm test              # build, then play through the menu and every game in headless Chrome
```

`docs/` is what GitHub Pages serves (Settings → Pages → main, /docs), so commit it with every change to `src/`.

## Files

- `src/main.js`: the menu, opening and closing games, Back and edge swipe
- `src/final.js`: Final Final
- `src/notes.js`: Feedback and its ten puzzles
- `src/scope.js`: Scope Creep
- `src/swatch.js`: Swatch, color math included
- `src/pop.js`: Make It Pop
- `src/art.js`: tile drawings, Daphi, the mark
- `src/daphi.js`: what Daphi says (ahre, ¿ubicás?)
- `src/clients.js`: made-up clients for Make It Pop
- `src/shared.js`: storage, sound, the bottom sheet, the game header
- `src/sw.js`: offline support
