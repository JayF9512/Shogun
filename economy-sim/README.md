# Economy Simulation — Shadows of the Shogun

Standalone TypeScript simulation that models **F2P vs paid** player progression
over a 90-day season and validates the game's balance targets. It has no DB
dependency so designers can iterate on balance quickly (spec §4.6).

## What it does

Simulates three archetypes day-by-day for 90 days:

1. **F2P active** — ~30 min/day, earns only free resources & jade.
2. **Light spender** ($5/mo) — one value pack (modest jade + resource injection).
3. **Heavy spender** ($50/mo) — battle pass + resource/catalyst packs, 2 build queues.

For each archetype per day it tracks resources (Rice, Wood, Stone, Iron,
Charcoal, Catalyst), currencies (Jade earned/spent/balance, Honour), building &
industrial level progression, and troop counts.

## Run

```bash
cd economy-sim
npm install
npm run simulate
```

Output:
- A formatted summary table in the console.
- A full per-day CSV at `output/simulation_results.csv`.
- Six balance validations. **The process exits non-zero if any fail** (CI gate).

## Balance tests

| Test | Target |
|------|--------|
| F2P reaches Level 20 | by day 30 |
| F2P reaches Level 30 | by day 60 |
| Light spender reaches Level 30 | by day 45 |
| Heavy spender reaches Industrial 2 | by day 90 |
| F2P earns enough Jade for 1 premium hero | per season |
| No resource exceeds 10× storage capacity | inflation check |

## Files

- `src/balance-config.ts` — every tunable knob (production, costs, jade, archetypes). No magic numbers live in logic.
- `src/industrial-model.ts` — Industrial Ascension model (sub-stages, catalyst, timelines).
- `src/simulate.ts` — the day-by-day simulation, reporting, CSV export, and balance tests.

All balance values are data-driven — retune in `balance-config.ts` / `industrial-model.ts` without touching simulation logic.
