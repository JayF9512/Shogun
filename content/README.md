# Shogun Content — Season Zero

Single source of truth for all **Shadows of the Shogun** launch content (spec §4.6
data-driven balancing). The backend seed and admin tooling import from this
package so game data lives in one **validated** place instead of being scattered
through engine code.

## What's inside (`src/data/`)

| File | Content | Spec |
| --- | --- | --- |
| `heroes.ts` | 12 launch heroes — 4 skills + ultimate + army skill each | §39, §41, §71 |
| `pets.ts` | 3 starter pets (Shiro free-obtainable) with evolution branches | §42, §43 |
| `troops.ts` | 10 troop tiers × 3 classes (data-driven stat curve) | §30, §31 |
| `buildings.ts` | Full launch building catalogue with L1–30 cost/time curves | §33, §35 |
| `regions.ts` | 4 launch regions | §45 |
| `campaign.ts` | 6-chapter "Crimson Eclipse" campaign (18 PvE stages) | §71 |
| `rally.ts` | Rally system config + visible-representative caps | §57, §59 |
| `store.ts` | Store catalogue + 30-tier season pass | §88, §71 |
| `tutorial.ts` | 10-step first-session flow (triggers real systems) | §9 |
| `season.ts` | Season Zero metadata | §71 |

## Validation

Every collection is validated against a [zod](https://zod.dev) schema
(`src/types.ts`) **plus** cross-reference rules (unique keys, campaign→region
references, store→hero references, "12 heroes / 3 pets / 4 regions", "≥1 free
pet"). `validateContent()` returns a report; the backend seed calls it and
**aborts** if content is invalid, so a broken catalogue can never be seeded.

```bash
npm install
npm run validate   # prints counts, exits non-zero on any error
npm test           # 16 Jest integrity tests
npm run build      # emits dist/ consumed by the backend
```

## Consumed by the backend

`backend/package.json` depends on this package via `file:../content`.

- `backend/prisma/seed.ts` upserts every definition into PostgreSQL (idempotent).
- `backend/src/content/` exposes the catalogue over REST at `/api/content/*`
  (read-only; state stays server-authoritative per spec §98).

Change content here, run `npm run validate`, rebuild, then re-seed — nothing in
engine code needs to change.
