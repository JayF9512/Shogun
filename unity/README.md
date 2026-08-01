# Unity Client (Phase 2 — placeholder)

Unity C# scripts for the Shadows of the Shogun client will live here.

The client is **presentation-only** (spec §98): rendering the settlement, world
map, animated marches, battle playback and economy HUD. All game state and rule
resolution come from the `backend/` API — the client sends player intent and
displays authoritative results.

Planned structure:

```text
unity/
├── Scripts/
│   ├── Api/          # typed REST client for the backend
│   ├── Settlement/   # settlement + building rendering
│   ├── WorldMap/     # tile map, marches, scouting
│   ├── Combat/       # battle report playback
│   └── UI/           # HUD, menus, store, mail
```
