# Shadows of the Shogun — Architecture

Phase 1 establishes the **server-authoritative** backend. Per spec §98, the
client never owns game state or resolves rules; every mutation is validated and
persisted on the server.

## System diagram

```text
                 ┌───────────────────────────────────────────┐
                 │                Unity Client                │
                 │  (rendering, input, presentation only)     │
                 └───────────────┬───────────────────────────┘
                                 │  HTTPS / REST (JWT)
                                 ▼
        ┌────────────────────────────────────────────────────────┐
        │                  NestJS API (backend/)                  │
        │                                                        │
        │  auth  player  settlement  economy  progression        │
        │  troops  heroes  pets  march  combat  clan             │
        │  store  purchase  mail  events  season                 │
        │  admin  analytics  feature-flags                       │
        │                                                        │
        │  ┌───────────────┐   ┌───────────────┐                 │
        │  │ Prisma Client │   │  Redis (cache │                 │
        │  │  (ORM layer)  │   │  / sessions)  │                 │
        │  └───────┬───────┘   └───────────────┘                 │
        └──────────┼─────────────────────────────────────────────┘
                   │
                   ▼
        ┌────────────────────┐        ┌────────────────────┐
        │    PostgreSQL      │        │   Admin Panel      │
        │  (source of truth) │◀──────▶│   (Next.js, §28)   │
        └────────────────────┘        └────────────────────┘
```

## Tech stack & rationale

| Layer      | Choice              | Rationale |
| ---------- | ------------------- | --------- |
| API        | NestJS 10 (TS)      | Opinionated modular DI structure maps 1:1 to the game's bounded contexts; first-class testing; scales to a large team (spec §35). See `docs/decisions/001`. |
| ORM        | Prisma 5            | Type-safe schema-first modelling of ~50 entities; migrations give dev/staging/prod parity (spec §114). See `docs/decisions/002`. |
| Database   | PostgreSQL          | Relational integrity for economy ledgers, purchases and clan territory; JSON columns for flexible payloads (paths, reports). |
| Cache/RT   | Redis (ioredis)     | Sessions, leaderboards, rate-limits and tick coordination. |
| Auth       | JWT + Passport      | Stateless access tokens + DB-backed refresh sessions; secrets live only in env (spec §111). |
| Validation | class-validator     | Declarative DTO validation via a global `ValidationPipe`. |
| Testing    | Jest + ts-jest      | Pure, deterministic unit tests for combat/economy/progression/march math. |

## Service communication map

- **Synchronous REST**: the Unity client calls module controllers under `/api/*`.
- **Cross-module calls**: services are injected directly (e.g. `combat` reads
  troop stacks; `purchase` grants currency through the economy ledger).
- **Scheduled work** (future): economy ticks, march arrivals and construction
  completions run server-side on timers — never trusted from the client.
- **Admin/LiveOps**: the `admin` module writes an `AdminAuditLog` entry for every
  mutating action; the Next.js admin panel consumes these endpoints.

## Key domain rules encoded in Phase 1

- **Three-class counter** (combat): Samurai ▶ Komainu ▶ Yumi ▶ Samurai, +25% counter bonus.
- **Industrial Ascension** (progression): L30 gate → I1…I10, five private sub-stages each; only completed major levels are public (spec §12–§15).
- **Economy**: data-driven per-hour production with +10%/level; CATALYST unlocks at Industrial 1.
- **Marches**: 100 tiles/hr base, +30% with Komainu, march cap = clamp(⌊level/5⌋, 1, 5).
- **Purchases**: idempotent on `platformTxId`, server-side entitlement granting only.
