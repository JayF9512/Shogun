# Shadows of the Shogun

A mobile-first Japanese supernatural **4X strategy game**. This monorepo holds
the server-authoritative backend, the Unity client scripts, the LiveOps admin
panel, economy tooling and architecture docs.

> Design spec: the full Game Design & Technical Blueprint drives every system.
> Core principle (spec §98): **the server controls everything** — the client
> renders and sends intent only; no client-authoritative game logic.

## Repository structure

```text
/
├── backend/        # NestJS + Prisma + PostgreSQL API (Phase 1 — implemented)
│   ├── prisma/     # schema.prisma (~50 entities) + seed
│   ├── src/        # 19 domain modules (auth, economy, combat, clan, …)
│   └── test/       # Jest unit tests (combat, progression, economy, march)
├── unity/          # Unity C# client scripts (placeholder — Phase 2)
├── admin-panel/    # Next.js LiveOps dashboard (placeholder — Phase 2)
├── economy-sim/    # Standalone economy balance simulation (ts-node)
├── docs/           # Architecture + decision records (spec §4.5)
│   ├── architecture.md
│   └── decisions/
└── README.md
```

## Getting started (backend)

Prerequisites: Node 20+, Docker (for PostgreSQL + Redis).

```bash
# 1. Clone
git clone https://github.com/JayF9512/Shogun.git
cd Shogun

# 2. Start PostgreSQL + Redis
docker compose up -d

# 3. Install backend deps
cd backend
npm install

# 4. Configure environment (never commit real secrets — spec §111/§114)
cp .env.example .env            # dev
# create .env.staging / .env.production per environment

# 5. Generate the Prisma client & run migrations
npm run prisma:generate
npm run prisma:migrate          # creates the schema in your dev DB

# 6. Seed base data (server, building/troop defs, industrial cost table)
npm run seed

# 7. Run
npm run start:dev               # http://localhost:3000/api
```

### Tests

```bash
cd backend
npm test        # runs the Jest suite (24 tests, all passing)
```

### Economy simulation

```bash
cd economy-sim
npx ts-node simulate.ts   # prints a 30-day F2P vs paying comparison table
```

## Key systems implemented in Phase 1

| System | Rule | Where |
| ------ | ---- | ----- |
| Three-class combat | Samurai ▶ Komainu ▶ Yumi ▶ Samurai, +25% counter bonus | `backend/src/combat` |
| Industrial Ascension | L30 gate → I1–I10, 5 private sub-stages, public shows completed levels only | `backend/src/progression` |
| Economy | Data-driven per-hour production, +10%/level, CATALYST at Industrial 1 | `backend/src/economy` |
| Marches | 100 tiles/hr base, +30% Komainu, cap = clamp(⌊level/5⌋,1,5) | `backend/src/march` |
| Purchases | Idempotent on `platformTxId`, server-side entitlements | `backend/src/purchase` |
| Admin/LiveOps | Lookup, grant, ban/unban, economy override, event scheduling, audited | `backend/src/admin` |

See [`docs/architecture.md`](docs/architecture.md) for the full system diagram,
tech-stack rationale and service map, and [`docs/decisions/`](docs/decisions/)
for the decision records.

## Phase completion status

| Phase | Scope | Status |
| ----- | ----- | ------ |
| **1** | Backend foundation: Prisma schema (~50 entities), 19 NestJS modules, core rules (combat/economy/progression/march), auth, purchases, admin, tests, economy sim, docs | ✅ Complete |
| 2 | Unity client systems (UI, map, battle resolver, economy HUD) | ⏳ Placeholder |
| 2 | Next.js admin panel UI | ⏳ Placeholder |
| 3 | Scheduled ticks (economy/march/construction), matchmaking, real-time | 🔜 Planned |
| 3 | Nakama / social integration, leaderboards at scale | 🔜 Planned |

## Conventions

- **Data-driven balancing** (spec §4.6): tunable values live in definition tables
  / constants, not scattered through logic.
- **Environment separation** (spec §114): `.env.development` / `.env.staging` /
  `.env.production`; secrets never committed (spec §111).
- **Server-authoritative** (spec §98): all game-state mutation validated server-side.
