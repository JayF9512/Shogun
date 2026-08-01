# Shadows of the Shogun — Project Audit Report

**Date:** August 1, 2026
**Scope:** Full audit of web client (`/home/ubuntu/shogun-web`) and backend
(`/home/ubuntu/github_repos/Shogun/backend`) prior to the Stage 1 overhaul.
**Author:** AI Builder

---

## 1. Executive Summary

The project is a **functional vertical slice**: a vanilla-JS mobile web client
(18 screens) talking to a server-authoritative NestJS + Prisma + PostgreSQL
backend. The core loops work end-to-end (guest onboarding → settlement → heroes
→ world → combat simulate → clans). However, several structural issues block the
next stage:

- The launch state is **State 391** (a seed artifact), not **State 1**.
- There is **no owner/super-admin system** — the `Account.role` enum lacks
  `OWNER`, admin endpoints are unauthenticated and take `adminUserId` from the
  request body, and there is no admin action log tied to real admins.
- The client mixes **"Realm", "server" and "State"** as synonyms for the same
  concept, and carries a stray **"demo"** reference.
- There is **no newcomer shield, tutorial-progress, or map-coordinate** system
  in the backend, all of which the next stage depends on.

Nothing is catastrophically broken; the work below is additive plus a data
migration.

---

## 2. Current Database State (live)

Queried against the live PostgreSQL instance:

| Item | Value |
|------|-------|
| States | **1** — `number=391`, `name="State 391"`, `isOpen=true`, `playerCap=10000` |
| Players in State 391 | 9 |
| Total players | 13 |
| Total accounts | 13 (4 real + test/guest accounts) |
| Owner account (`jimmyfrgsn95@gmail.com`) | **Does not exist yet** |
| Account roles present | all `PLAYER` (enum also has `MODERATOR`, `ADMIN`) |

**Implication:** the State 1 migration must (a) create State 1, (b) repoint all
existing players to State 1, and (c) leave State 391 out of future seeds. Because
guests auto-attach to "the lowest-numbered open state", simply adding State 1
and closing/removing State 391 is enough to route all new players correctly.

---

## 3. Web Client Audit (`/home/ubuntu/shogun-web`)

### 3.1 Files

| File | Lines | Purpose |
|------|------:|---------|
| `index.html` | 63 | App shell: phone frame, HUD, nav, overlays; loads all scripts |
| `css/style.css` | 325 | Full design system |
| `js/api.js` | 197 | API client, token storage, refresh-on-401, error mapper |
| `js/game.js` | 132 | Game state, content cache, `UI`/`Fmt` helpers, resource/currency emoji maps |
| `js/main.js` | 155 | Router, TopBar HUD, bottom Nav, modal helper, boot |
| `js/screens/*.js` | 16 files | One module per screen, each self-registers on `window.Screens` |

### 3.2 Screens (18 total, all navigable — **no dead-end buttons found**)

| Screen | File | Key API calls | Notes |
|--------|------|---------------|-------|
| Splash | splash.js | (none — routes) | "Summoning the realm…" text ⚠ |
| State Select | stateselect.js | `GET /states`, `POST /states/:id/join` | "Realm" wording ⚠, defaults to "State 391" ⚠ |
| Welcome | welcome.js | — | Guest vs. login CTA |
| Name Castle | namecastle.js | — (local) | "ENTER THE REALM" ⚠ |
| Auth | auth.js | `POST /auth/login`, `/auth/register`, `/auth/bind` | "you@realm.jp", "ENTER THE REALM" ⚠, `serverId` in payload ⚠ |
| Settlement | settlement.js | `GET /economy/resources`, content | Command Center quick-actions grid |
| Heroes | heroes.js | `GET /content/heroes`, `/content/pets` | rarity cards |
| World | world.js | `GET /march` | defaults state name "State 391" ⚠ |
| Battle | battle.js | `POST /combat/simulate` | server-authoritative ✔ |
| March formation | (world modal) | `POST /march` | ✔ |
| Store | store.js | `GET /store` | BUY = client confirm (purchase endpoint validation-broken server-side) |
| Season Pass | seasonpass.js | `GET /season-pass` | comment says "lively demo of the ladder" ⚠ (word "demo") |
| Leaderboard | leaderboard.js | `GET /leaderboards` | injects current player; "fresh realm" wording ⚠, "State 391" default ⚠ |
| Profile | profile.js | `GET /players/:id/profile`, `/auth/bind` | "Realm" label ⚠, "State 391" default ⚠ |
| Mail | mail.js | `GET /mail` | empty-state handled |
| Events | events.js | `GET /events` | |
| Clan | clan.js | `GET /clans`, `POST /clans`, `/clans/:id/join` | |

### 3.3 Emoji used as assets (icons)

Emoji are used in place of icon assets throughout. Catalogued so Stage 2+ can
swap them for real art:

- **Resources / currencies** (`js/game.js` `RESOURCE`/`CURRENCY` maps): 💎 (Jade),
  🌾 (Rice), 🪵 (Wood), 🪨 (Stone), ⛏️ (Iron), 🏅 (Honour), plus charcoal/catalyst.
- **Navigation** (`js/main.js`): 🏯 City, ⚔️ Heroes, 🗺️ World, 🏪 Store, 👤 Profile.
- **Command Center / quick-actions** (`settlement.js`): ⚔️ Battle, 🎫 Season Pass,
  🏆 Rankings, 🎌 Events, 🏯 Clan, 📫 Mail.
- **Buildings** (`settlement.js`): 🏯 Castle, ⛺ Barracks, 🌾 Farm, 🪵 Lumber Mill, etc.
- **Misc**: 🏯 in "ENTER THE REALM" button (namecastle.js), star ratings ★, various
  screen headers.

> Not a bug — a deliberate lightweight choice — but recorded here because the
> planned overhaul replaces emoji with real iconography.

### 3.4 Terminology problems (duplicate synonyms for "State")

Occurrences of **Realm / realm / server / Server** used to mean **State**:

- `splash.js` ×2 — "Summoning the realm…"
- `stateselect.js` ×5 — "Select Your Realm", "Recommended realms", "No realms are
  open", "That realm is closed", "Could not load realms", plus a comment
  referencing "State 391".
- `namecastle.js` ×1 — "ENTER THE REALM".
- `auth.js` ×3 — "ENTER THE REALM" (login + register button), "you@realm.jp"
  placeholders, plus `shogun_serverId`/`serverId` usage.
- `world.js` ×1 — `'State 391'` default.
- `leaderboard.js` ×2 — "fresh realm" comment, `'State 391'` default.
- `profile.js` ×3 — "Realm" label, `'State 391'` default ×2.
- `api.js` ×3 — "realm servers are busy", "Cannot reach the realm", `serverId` in
  register body.

**"Demo" text:** `seasonpass.js` line 23 — comment "lively demo of the ladder".
No user-visible "Demo"/"Coming Soon"/"TODO" strings were found in rendered UI;
the remaining `placeholder=` occurrences are legitimate HTML input placeholders.

**Duplicate navigation:** none found — the 5-tab bottom nav and the Command
Center quick-actions target distinct screens.

### 3.5 Dead-end buttons

**None.** Every button navigates, calls an API, opens a modal, or produces a
toast/result. (Store BUY intentionally resolves as a client confirmation because
the server purchase endpoint's DTO lacks validators and is rejected by the global
whitelist pipe — documented in code.)

---

## 4. Backend Audit (`/home/ubuntu/github_repos/Shogun/backend`)

### 4.1 Stack & entry

- NestJS 10 + Prisma 5 + PostgreSQL; JWT auth (`15m` access, `30d` refresh).
- `main.ts`: global `/api` prefix (excludes `/`, `/health`), global
  `ValidationPipe({ whitelist, transform, forbidNonWhitelisted })`, CORS all\-list,
  BigInt→string JSON patch.
- Health: `GET /` and `GET /health` (liveness) — working.
- Deployed via systemd unit `shogun-backend` (`ExecStart=node dist/src/main.js`,
  `EnvironmentFile=.env`).

### 4.2 Prisma schema (`prisma/schema.prisma`, 1090 lines)

Relevant models & gaps:

- **`enum PlayerRole { PLAYER, MODERATOR, ADMIN }`** — **missing `OWNER`.**
- **`Account`** — has `role: PlayerRole`, `banned`, `banReason`. No owner concept.
- **`State`** — `{ id, name, number @unique, isOpen, playerCap=10000, players[] }`.
  No "next state opens at threshold" logic anywhere.
- **`Player`** — rich progression fields, `stateId?`, `isGuest`, `bindCode`.
  **No shield fields** (`shieldEndsAt`, `shieldBroken`). **No tutorial relation.**
- **World:** `WorldTile { serverId, x, y, terrain }`, `WorldObject`,
  `ResourceNode`, `EnemyGroup` exist but are **serverId-scoped, not stateId-scoped**,
  and there is **no `MapCoordinate` model** with the object-type/tier/occupancy
  semantics the new map system needs.
- **Admin:** `AdminUser`, `AdminPermission`, `AdminAuditLog` exist but are a
  **separate table hierarchy** keyed by `AdminUser.id` — not tied to the real
  `Account`/`PlayerRole` an owner/admin would log in with. `AdminAuditLog` lacks
  `adminEmail` and `ipAddress` fields.
- **No `TutorialProgress` model.**

### 4.3 Auth (`src/auth`)

- `register` creates `Account` (role defaults to `PLAYER`) + `Player`. **No
  special-casing for the owner email.**
- `guest` attaches new guests to the **lowest-numbered open state** (currently
  391). Good — will pick up State 1 automatically once seeded.
- JWT carries `{ sub: accountId, email, role }`; `JwtStrategy.validate` returns
  `{ accountId, email, role }`. So role-based guards are feasible today.

### 4.4 States (`src/states`)

- `StatesService`: `create`, `list` (+counts, `isFull`), `detail`, `join`,
  `availableMigrations` (±20), `requestMigration`.
- `StatesController`: `POST /states` (checks `req.user.role === 'ADMIN'` inline),
  `GET /states`, `GET /states/migration/available`, `GET /states/:id`,
  `POST /states/:id/join`, `POST /states/:id/migration/request`.
- **Gap:** no auto-open-next-state threshold logic on list/join.

### 4.5 March / Combat / Economy / Clan

- **March** (`src/march`): full lifecycle (create/list/recall, cap by level),
  Euclidean distance & travel-time, Komainu/hero speed bonuses. Targets are raw
  `x,y` — **not validated against a map/coordinate model** (none exists).
- **Combat** (`src/combat`): deterministic 3-class counter system
  (Samurai>Komainu>Yumi>Samurai, +25%); `simulate` (no auth) + `resolve`/record.
  Solid, unit-tested.
- **Economy** (`src/economy`): race-safe atomic `spend()` via conditional
  `updateMany`; per-player production tick. Good.
- **Clan** (`src/clan`): real create/join/leave/roles/kick. Good.

### 4.6 Admin (`src/admin`)

- Endpoints are **unauthenticated** and read `adminUserId` from the **request
  body** — not production-safe. No `OWNER`/`ADMIN` guard. No appoint/demote flow.
  Audit writes to `AdminAuditLog` keyed by an `AdminUser` that the login flow
  never creates.

### 4.7 Tests

- **81/81 passing across 12 suites** (`npx jest`) — combat, progression, economy,
  march, content, season-pass, auth-guest, clan.

---

## 5. Findings → Stage 1 Work Items

| # | Finding | Stage 1 action |
|---|---------|----------------|
| F1 | Launch state is 391, not 1 | Seed **State 1**, migrate players, drop 391 from seed |
| F2 | No "next state opens at threshold" | Add configurable auto-open (default 1900) to list/join |
| F3 | `PlayerRole` lacks `OWNER`; admin unauthenticated | Add `OWNER`, owner auto-assign on register/login, OWNER/ADMIN guards, appoint/demote, `AdminLog` |
| F4 | `AdminAuditLog` lacks email/ip | New `AdminLog { adminId, adminEmail, action, targetId, targetType, details, ipAddress, createdAt }` |
| F5 | Realm/server used for State; stray "demo" | Replace with **State**; add canonical `TERMS` in `game.js`; remove "demo" |
| F6 | No newcomer shield | Add `Player.shieldEndsAt/shieldBroken`, 10-day auto shield, break endpoint, `GET /players/me` |
| F7 | No tutorial progress | Add `TutorialProgress` (steps 0–12), complete-step/progress endpoints |
| F8 | No map coordinate system | Add `MapCoordinate`, init-state/tiles/teleport/place-castle endpoints (1200×1200) |

---

## 6. Risk Notes

- **Data migration:** State 391 currently owns 9 players. The migration repoints
  them to State 1 in a transaction; State 391 is left in place but removed from
  seed defaults (kept, not deleted, to avoid FK issues with existing player rows).
  Optionally closed (`isOpen=false`).
- **Owner bootstrap:** owner role is granted on register/login by email match, so
  the owner simply signs up with `jimmyfrgsn95@gmail.com` to become `OWNER`.
- **Backwards-compatible schema:** all new columns are nullable or defaulted;
  `prisma db push` will not drop existing data.
- **Secrets:** `.env` (JWT secret, DB URL) stays git-ignored; `ownerEmail` is a
  non-secret config value and safe to commit in `.env.example`.

---

*End of audit report.*
