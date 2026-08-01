# Shadows of the Shogun — Web Client

A mobile-first, browser-playable client for **Shadows of the Shogun**, wired to the
live NestJS backend. This is the source for the deployment at
**https://shogun-play.abacusai.cloud**.

## Contents

Only the **code** is tracked here (HTML/CSS/JS). The heavy artwork assets
(`assets/images/*.webp`) live with the standalone static deployment and are
intentionally excluded from the repo to keep it lightweight.

```
web/
├── index.html          # App shell (phone frame, HUD, nav, overlays)
├── css/
│   └── style.css       # Dark War-inspired mobile-first UI
└── js/
    ├── api.js          # Backend API client
    ├── game.js         # Router + shared game state
    ├── main.js         # Bootstrap / entry point
    └── screens/        # 18 self-registering screens (see below)
```

## Screens (18, no dead ends)

`splash`, `stateselect`, `welcome`, `namecastle`, `auth`, `settlement`, `heroes`,
`world`, `battle`, `store`, `seasonpass`, `leaderboard`, `profile`, `mail`,
`events`, `clan` — plus the shell's top resource HUD and bottom tab bar. Every
screen has working navigation back into the app (no dead ends).

## Architecture

- **Presentation-only** — all game state and rule resolution are
  server-authoritative on the NestJS backend (Spec §98). The client renders
  screens and issues API calls via `js/api.js`.
- **Router** in `js/game.js` swaps screens into `#screen-root`; each screen file
  registers itself on `window.Screens`.
- **Mobile-first** — the UI is constrained to a 480px "phone" frame and centered
  on desktop.

## Running locally

Serve the `web/` directory with any static file server and point `js/api.js` at
your backend base URL:

```bash
cd web
python3 -m http.server 8080
# open http://localhost:8080
```

> Note: because artwork is excluded from the repo, image references resolve only
> in the full static deployment. Copy an `assets/images/` folder alongside
> `index.html` to see the client with full art locally.
