# DR-002: Database & schema approach — Prisma + PostgreSQL

_Decision record format per spec §4.5._

- **Status**: Accepted
- **Date**: 2026-08-01
- **Phase**: 1 (Backend foundation)

## Problem
The game has ~50 interrelated entities (players, settlements, buildings, troops,
heroes, marches, battles, clans, economy ledgers, store/purchases, events,
moderation, analytics). We need integrity for money/economy flows, flexible
payloads for some data (march paths, battle reports), and reproducible schema
changes across development, staging and production (spec §114).

## Existing proposal
Relational database as the single source of truth (spec §98), accessed through a
type-safe layer to keep the large model maintainable.

## Alternatives considered
1. **MongoDB + Mongoose** — flexible documents, but weak cross-entity integrity
   for currency ledgers, purchases and clan territory; easy to drift into
   inconsistent economy state.
2. **TypeORM + PostgreSQL** — mature, but decorator-driven entities get unwieldy
   at this scale and migrations are historically fragile.
3. **Raw SQL / Knex** — maximum control, minimum safety; too error-prone for a
   50-table model maintained by a growing team.
4. **Prisma + PostgreSQL** — schema-first, fully typed client, first-class
   migrations, JSON columns where flexibility is genuinely needed.

## Selected solution
**Prisma 5 ORM over PostgreSQL.**

## Reason
- One canonical `schema.prisma` documents the whole domain and generates a typed
  client — fewer runtime data bugs across ~50 entities.
- `prisma migrate` gives deterministic, versioned schema changes → clean
  dev/staging/prod separation (§114).
- Relational constraints protect economy ledgers, idempotent purchases
  (`platformTxId` unique) and clan/territory relations.
- `Json` columns (march waypoints, battle report summaries, event scoring rules)
  provide flexibility without abandoning relational integrity.
- Enums encode fixed game vocabularies (ResourceType, TroopClass, CurrencyType,
  MarchState, …) directly at the schema level.

## Risks
- Prisma migrations on very large tables can lock → mitigated by planning
  online migrations and using additive changes in live seasons.
- `Json` columns are not query-optimised → only used for non-indexed payloads.

## Systems affected
Every backend module; the seed script; the migration pipeline; analytics export.

## Rollback method
Migrations are reversible/versioned. Because services encapsulate all DB access,
a table or field can be reverted with a down-migration without touching the
game-logic layer. The schema is additive in Phase 1 (no destructive changes).
