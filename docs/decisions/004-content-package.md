# DR-004: Shared, validated content package for Season Zero

**Status:** Accepted
**Date:** 2026-08-01
**Phase:** 5 — Season Zero Production
**Related spec:** §4.6 (data-driven balancing), §71 (Season Zero), §98 (server-authoritative)

## Problem

Season Zero needs a large body of launch content — 12 heroes, 3 pets, 10 troop
tiers per class, the full building catalogue with L1–30 curves, 4 regions, an
18-stage campaign, a store + season pass, a tutorial and the rally config.

If this data is hard-coded across the backend seed, the client and the admin
panel, it drifts out of sync, resists balancing, and can't be validated as a
whole. The spec (§4.6, §118.7) requires balancing to be **configurable data**,
not engine code.

## Decision

Introduce a standalone TypeScript package, `content/` (`shogun-content`), as the
**single source of truth** for launch content.

- Content lives in typed modules under `content/src/data/`.
- Every collection is validated against a **zod** schema in `content/src/types.ts`.
- `validateContent()` additionally enforces cross-reference and business rules
  (unique keys, campaign→region references, store→hero references, "12 heroes /
  3 pets / 4 regions", "≥1 free-obtainable pet").
- The backend depends on it via `file:../content` and:
  - `prisma/seed.ts` calls `validateContent()` and **aborts** on any error, then
    upserts all definitions (idempotent).
  - `src/content/` serves the catalogue read-only over `/api/content/*`.

## Alternatives considered

1. **Hard-code in `seed.ts`.** Rejected — not reusable by client/admin, no
   schema guarantees, huge unreviewable file.
2. **Store content only in the database + admin CRUD.** Deferred — good for
   LiveOps tuning later, but launch content still needs a reviewable, diffable,
   version-controlled source that seeds a fresh environment deterministically.
3. **JSON files + ad-hoc parsing.** Rejected — loses compile-time types and the
   derived curve helpers (e.g. `buildingCostAtLevel`).

## Consequences

- Designers change two numbers (base + growth) to retune a 30-level curve.
- Content is testable in isolation: 16 Jest tests guard integrity; the seed
  refuses to run on invalid data.
- Verified end-to-end: `npm run seed` against a real PostgreSQL instance loads
  12 heroes / 72 hero skills / 3 pets / 30 troops / 32 buildings / 11 products /
  50 industrial upgrade rows, and is idempotent on re-run.
- A build step (`content` → `dist/`) is now a prerequisite for the backend in
  production; tests map `shogun-content` to source so no pre-build is needed for
  `npm test`.

## Rollback

Delete the backend `file:../content` dependency and revert `seed.ts` to the
previous inline definitions. The `content/` package is additive and can be
removed without touching runtime services other than the seed and
`ContentModule`.
