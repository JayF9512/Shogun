# DR-003: Standalone Economy Simulation for F2P/Paid Balance

**Status:** Accepted  
**Date:** August 1, 2026  
**Deciders:** AI Builder  
**Spec Reference:** §4.6 (data-driven balancing), §25 (F2P/paid progression)

---

## Problem

The game economy must support both F2P and paying players over months of progression (Levels 1-30, then Industrial 1-10). Without real player data, we need a way to:

1. **Validate balance assumptions** before implementing costly server/client features
2. **Detect inflation risks** (resources accumulating faster than sinks)
3. **Ensure F2P viability** (players can progress without feeling forced to pay)
4. **Optimize paid value** (spending provides meaningful acceleration without breaking progression)
5. **Support iterative tuning** (designers can adjust constants and re-validate quickly)

**Key Questions:**
- How long does it take F2P players to reach Level 30?
- What does $5/month buy vs $50/month in terms of progression speed?
- Do F2P players earn enough premium currency (Jade) to feel rewarded?
- Will resources inflate beyond storage capacity?

**Constraints:**
- No live player data yet (pre-alpha)
- Balance must be data-driven (no hardcoded magic numbers per Spec §4.6)
- Must support rapid iteration (designers change values frequently)
- Must be CI-ready (automated validation in build pipeline)

---

## Alternatives Considered

### Option 1: Spreadsheet Model (Excel/Google Sheets)
**Pros:**
- Familiar to designers
- Easy to visualize with charts
- No code required

**Cons:**
- No version control (hard to track changes)
- No automated testing (manual validation)
- Not CI-ready (can't run in pipeline)
- Formulas become fragile at scale
- Hard to model complex systems (hero bonuses, research trees)

**Verdict:** ❌ Rejected — Too manual, not repeatable

### Option 2: Unity PlayMode Test
**Pros:**
- Uses actual game code (perfect parity with production)
- Validates Unity-side logic
- Can catch integration bugs

**Cons:**
- Slow (Unity editor startup + domain reload)
- Requires full client build
- Can't run on CI easily (needs Unity license)
- Couples balance validation to client implementation
- Hard to export results for designers

**Verdict:** ❌ Rejected — Too slow, too coupled to Unity

### Option 3: Backend API Stress Test
**Pros:**
- Tests actual server endpoints
- Validates API performance under load
- Uses production database schema

**Cons:**
- Requires full backend to be running
- Slower than standalone simulation
- Harder to isolate variables (network latency, DB queries)
- Couples balance to backend implementation
- Not suitable for early-stage iteration

**Verdict:** ❌ Rejected — Too heavy, wrong abstraction layer

### Option 4: Standalone TypeScript Simulation ✅ (Selected)
**Pros:**
- Fast (runs in seconds, single-threaded)
- Version-controlled (balance values in `.ts` files)
- CI-ready (runs via `npm test` or `npm run simulate`)
- Pure functions (deterministic, easy to test)
- CSV export (designers can analyze in Excel/Tableau)
- Decoupled from implementation (can iterate before building)
- Language familiarity (same TS as backend)

**Cons:**
- Simplifications required (can't model every system detail)
- Not 100% parity with backend (e.g., hero/research bonuses omitted in v1)
- Designers still need to understand code to change values

**Verdict:** ✅ **Selected** — Best balance of speed, repeatability, and CI integration

---

## Decision

Implement a **standalone TypeScript simulation** in `economy-sim/` that:

1. **Simulates 90 days** of progression for 3 player archetypes:
   - **F2P active:** Plays 30 min/day, completes daily missions, gathers resources
   - **Light spender:** Spends $5/month on one value pack
   - **Heavy spender:** Spends $50/month on battle pass + resource packs

2. **Tracks key metrics** per player per day:
   - Resources: RICE, WOOD, STONE, IRON, CHARCOAL, CATALYST
   - Currencies: JADE (earned & spent), HONOUR
   - Building levels (standard 1-30)
   - Industrial level + sub-stage (1-10, with 5 stages each)
   - Troop counts per class

3. **Validates 6 automated balance tests:**
   - F2P reaches Level 20 by day 30
   - F2P reaches Level 30 by day 60
   - Light spender reaches Level 30 by day 45
   - Heavy spender reaches Industrial 2 by day 90
   - F2P earns enough Jade for 1 premium hero per season (30 days)
   - No resource exceeds 10× storage capacity (inflation check)

4. **Exports results to CSV** (`economy-sim/output/simulation_results.csv`) for designer analysis

5. **Centralizes all balance constants** in `balance-config.ts` (data-driven, per Spec §4.6):
   - Resource production rates per building level
   - Construction time formulas
   - Training costs and times
   - Industrial Catalyst costs per stage
   - Jade earn rates (daily missions, events, achievements)
   - March speeds and troop counters

6. **Runs via npm script:** `npm run simulate`
   - Exit code 0 if all balance tests pass
   - Exit code 1 if any test fails (CI integration)

---

## Implementation Details

### File Structure
```
economy-sim/
├── package.json          # ts-node, chalk, csv-writer deps
├── tsconfig.json
├── src/
│   ├── balance-config.ts       # All tunable constants (single source of truth)
│   ├── industrial-model.ts     # Industrial Ascension economics
│   └── simulate.ts             # Main simulation runner + balance tests
└── output/
    └── simulation_results.csv  # Exported results (git-ignored)
```

### Balance Config Structure
```typescript
export const BALANCE = {
  RESOURCES: {
    BASE_PRODUCTION: {
      RICE: 100,      // per hour at level 1
      WOOD: 80,
      STONE: 60,
      IRON: 40,
      CHARCOAL: 30,
      CATALYST: 20,   // Industrial 1+ only
    },
    LEVEL_MULTIPLIER: 0.1,  // +10% per building level
  },
  CONSTRUCTION: {
    BASE_TIME_HOURS: 0.5,   // Level 1 building
    TIME_SCALE: 1.2,        // Exponential growth per level
  },
  INDUSTRIAL: {
    CATALYST_COST_PER_STAGE: [100, 200, 400, 800, 1600],  // Stages 1-5
    CATALYST_COST_MULTIPLIER_PER_LEVEL: 2.0,  // I2 costs 2x I1, I3 costs 4x I1
  },
  JADE_EARN: {
    DAILY_MISSION: 50,
    EVENT_PARTICIPATION: 100,
    ACHIEVEMENT: 200,
  },
  // ... more balance knobs
};
```

### Simulation Loop (Simplified)
```typescript
for (let day = 1; day <= 90; day++) {
  for (const player of [f2pPlayer, lightSpender, heavySpender]) {
    // Tick resource production
    player.resources += calculateProduction(player.buildingLevels);
    
    // Clamp to storage capacity
    player.resources = clampToCapacity(player.resources, player.storageLevel);
    
    // Spend resources on upgrades (AI decision)
    if (canAffordUpgrade(player)) {
      player.buildingLevels++;
      player.resources -= upgradeCost(player.buildingLevels);
    }
    
    // Earn daily Jade (F2P path)
    player.jade += BALANCE.JADE_EARN.DAILY_MISSION;
    
    // Spending logic (only for paying players)
    if (player.archetype === 'LIGHT_SPENDER' && day % 30 === 1) {
      player.jade += 500;  // Monthly $5 pack
    }
    if (player.archetype === 'HEAVY_SPENDER') {
      // Battle pass + resource packs
      player.jade += 2000;
      player.resources.CATALYST += 500;
    }
    
    // Record metrics
    results.push({ player: player.id, day, ...player });
  }
}

// Validate balance tests
assert(f2pPlayer.level >= 20 on day 30);
assert(f2pPlayer.level >= 30 on day 60);
// ... etc
```

---

## Rationale

### Why This Approach Works

1. **Fast Feedback Loop:**
   - Simulation runs in ~3 seconds
   - Designers can tweak `balance-config.ts` and re-run instantly
   - No need to rebuild backend or Unity to test balance changes

2. **CI Integration:**
   - Runs on every PR via `npm run simulate`
   - Fails the build if balance tests don't pass
   - Prevents accidental balance regressions

3. **Data-Driven Design:**
   - All balance values in one file (`balance-config.ts`)
   - No magic numbers scattered across backend/Unity code
   - Easy to compare values (e.g., "Is Iron production too low vs Stone?")

4. **Designer-Friendly Output:**
   - CSV export opens in Excel, Google Sheets, Tableau
   - Designers can chart progression curves, resource curves, etc.
   - Visual validation without reading code

5. **Decoupled from Implementation:**
   - Can validate balance before building backend/Unity features
   - Reduces wasted effort on unbalanced systems
   - Early validation of F2P viability (critical for retention)

### Simplifications Accepted

To keep the simulation fast and maintainable, we **intentionally simplified** some systems:

- **No hero bonuses modeled** (production/combat boosts from heroes)
- **No research tree** (research provides buffs not modeled in v1)
- **No clan bonuses** (clan tech, territory bonuses ignored)
- **Simplified AI** (players always upgrade the highest-priority building, no strategy variation)
- **No PvP losses** (assumes zero resource theft from attacks)

**Mitigation:** These simplifications are acceptable for early-stage balance validation. Once the game is live, we'll:
- Use real analytics data to refine formulas
- Add hero/research bonuses to the simulation in Phase 5+
- Compare sim predictions vs actual player progression (tune discrepancies)

---

## Risks

### Risk 1: Simulation Drift from Production
**Description:** If backend or Unity implement balance differently than the simulation, the sim becomes misleading.

**Mitigation:**
- Use the **same formulas** in backend (`economy.service.ts`) and sim (`balance-config.ts`)
- Copy constants from `balance-config.ts` into backend `Constants.ts`
- Add integration tests that validate backend matches sim (e.g., "resource tick produces X per hour")

**Owner:** Backend team

### Risk 2: Designer Learning Curve
**Description:** Designers unfamiliar with TypeScript may struggle to adjust `balance-config.ts`.

**Mitigation:**
- Document all balance knobs with inline comments
- Provide a "Balance Tuning Guide" in `economy-sim/README.md`
- Create admin panel UI for tuning (future enhancement)
- Designers can request AI Builder to make changes if needed

**Owner:** Design team + AI Builder

### Risk 3: Incomplete Coverage
**Description:** Simulation omits hero/research/clan bonuses, which may significantly alter real progression.

**Mitigation:**
- Mark as "Phase 1 scope" (basic balance only)
- Plan Phase 5 enhancement to add hero/research models
- Use **conservative estimates** (assume worst-case F2P progression)
- Validate with alpha playtest data and adjust

**Owner:** Economy Designer + AI Builder

### Risk 4: False Confidence
**Description:** Passing balance tests doesn't guarantee players will enjoy the progression pace.

**Mitigation:**
- Balance tests are **necessary but not sufficient**
- Require alpha playtest validation (human players, not simulation)
- Track real retention metrics (D1, D7, D30) in soft launch
- Be prepared to retune based on real behavior

**Owner:** Product Manager

---

## Systems Affected

- **Backend `economy.service.ts`:** Must use formulas from `balance-config.ts`
- **Unity `ResourceManager.cs`:** Must mirror production formulas
- **Admin Panel:** Could display sim results or link to CSV
- **CI Pipeline:** Runs `npm run simulate` on every PR

---

## Rollback Method

If the simulation proves too limiting or diverges from production:

1. **Fallback to spreadsheet model** (short-term)
2. **Build admin panel balance tuner** (live DB editing + real backend testing)
3. **Archive `economy-sim/` folder** (preserve for reference)
4. **Update ADR to document why we rolled back**

**Estimated effort:** 2-3 days to build admin panel balance tuner

---

## Success Criteria

Phase 4 is successful when:

- ✅ Simulation runs in <5 seconds
- ✅ All 6 balance tests pass
- ✅ CSV export contains 270 rows (3 players × 90 days)
- ✅ Designers can modify `balance-config.ts` and re-run without code changes elsewhere
- ✅ CI pipeline fails PRs that break balance tests

**Validation Date:** August 1, 2026 (Phase 4 completion)  
**Result:** ✅ All criteria met

---

## References

- **Spec §4.6:** "Keep balancing data-driven"
- **Spec §25:** Free-to-play progression and paid progression
- **Spec §110:** Analytics (funnel tracking, economy health)
- `economy-sim/src/balance-config.ts` — Single source of truth for balance
- `economy-sim/src/simulate.ts` — Main simulation runner
- `economy-sim/output/simulation_results.csv` — Example output

---

**Approved By:** AI Builder (per Spec §4 AI Builder Operating Charter)  
**Reviewers:** (Pending — will be reviewed by Product Manager and Economy Designer in Phase 5)
