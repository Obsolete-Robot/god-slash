# God Slash - Project Context

## Overview
Samurai Gunn-style arena fighter. Fast, twitchy, one-hit kills. Single player vs AI.

## Tech Stack
- Vanilla JS + Canvas
- Pixel art style (384x216 internal resolution, scaled up)
- Hosted at: https://games.obsoleterobot.com/god-slash/
- Repo: https://github.com/Obsolete-Robot/god-slash

## Current State (2026-01-29)
- Core movement: run, jump, wall slide, wall jump, dash (i-frames), fast fall, double jump
- Combat: sword slash, gun (3 bullets), bullet deflection
- AI opponent with basic decision tree
- One stage with platforms
- Round system (first to 5 kills)
- Screen shake, particles

## Controls
- **Arrow keys / WASD** - Move
- **Up / W / Space** - Jump (wall jump, double jump)
- **Down / S** - Fast fall
- **Shift** - Dash
- **Z / J** - Sword slash
- **X / K** - Shoot

## Key Files
- `src/game.js` - All game logic
- `src/style.css` - Styling
- `index.html` - Entry point

## Next Steps
- [ ] Better AI (pathfinding, prediction)
- [ ] Sprite art (replace rectangles)
- [ ] Sound effects
- [ ] More stages
- [ ] Visual polish (death animations, hit effects)
