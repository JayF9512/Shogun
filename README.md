# 🎌 Shadows of the Shogun

[![Phase 1-4](https://img.shields.io/badge/Phase-1--4_Complete-success)]()
[![Backend](https://img.shields.io/badge/Backend-NestJS_10-e0234e)]()
[![Database](https://img.shields.io/badge/Database-PostgreSQL_16-336791)]()
[![Admin](https://img.shields.io/badge/Admin-Next.js_14-000000)]()
[![Unity](https://img.shields.io/badge/Unity-6_Ready-000000)]()

**A mobile-first Japanese supernatural 4X strategy game** — Built with server-authoritative architecture for live service at scale.

This monorepo contains the complete technical foundation: NestJS backend with 50+ database entities, Next.js admin/LiveOps dashboard, Unity C# client systems, and data-driven economy simulation tools.

> **Design Philosophy (Spec §98):** The server controls everything — resources, currencies, combat, progression, marches, and purchases. The client is presentation-only, rendering state and capturing player intent.

---

## 📐 Architecture Overview

```
┌─────────────────┐
│  Unity Client   │  (Presentation-only: UI, rendering, input capture)
│   (C# Scripts)  │
└────────┬────────┘
         │ HTTPS/REST
         ▼
┌─────────────────┐
│  NestJS Backend │  (Server-authoritative: all game logic & state)
│   19 Modules    │  → Auth, Economy, Combat, Progression, Clan, Store...
└────────┬────────┘
         │
    ┌────┴────┬────────────┐
    ▼         ▼            ▼
┌────────┐ ┌──────┐  ┌────────┐
│Postgres│ │Redis │  │  CDN   │
│ (State)│ │(Cache)│  │(Assets)│
└────────┘ └──────┘  └────────┘
         ▲
         │ Admin API
         │
┌─────────────────┐
│ Next.js Admin   │  (LiveOps: player lookup, economy tuning, events)
│     Panel       │
└─────────────────┘
         ▲
         │ TypeScript Sim
         │
┌─────────────────┐
│  Economy Sim    │  (F2P/Paid balance validation, CSV export)
└─────────────────┘
```

---

## 📁 Repository Structure

```
/
├── backend/              # NestJS 10 + Prisma 5 + PostgreSQL
│   ├── prisma/
│   │   ├── schema.prisma # ~50 entities (Player, Settlement, Hero, Clan, etc.)
│   │   └── seed.ts       # Initial data loader
│   ├── src/
│   │   ├── auth/         # JWT authentication, session management
│   │   ├── economy/      # Resource production, tick logic
│   │   ├── combat/       # 3-class counter system (Samurai > Komainu > Yumi)
│   │   ├── progression/  # Level-up, Industrial Ascension (L30 → I1-I10)
│   │   ├── march/        # March speed, travel time, cap logic
│   │   ├── clan/         # Clan CRUD, membership, technology
│   │   ├── store/        # Catalog, offers, purchase initiation
│   │   ├── purchase/     # Server-side receipt validation, entitlements
│   │   ├── admin/        # Admin endpoints, audit logging
│   │   └── ...           # +11 more modules
│   └── test/
│       ├── *.spec.ts           # Unit tests (24 tests, all passing)
│       └── integration/        # Integration tests (combat, economy, march, progression)
│
├── admin-panel/          # Next.js 14 (App Router) + Tailwind + shadcn/ui
│   ├── src/app/
│   │   ├── page.tsx            # Dashboard (DAU, MAU, revenue, marches)
│   │   ├── players/            # Player search, detail, grant resources
│   │   ├── economy/            # Live-tune production rates, combat bonuses
│   │   ├── events/             # Event creation, scheduling, leaderboards
│   │   ├── store/              # Catalog management, reward codes
│   │   ├── analytics/          # Funnel charts, cohort analysis
│   │   ├── moderation/         # Ban/warn players, case queue
│   │   └── audit-log/          # Immutable admin action log
│   └── src/components/   # Reusable UI (modals, tables, charts)
│
├── unity/                # Unity 6 C# Scripts (91 scripts, 15 systems)
│   └── Assets/Scripts/
│       ├── Core/               # GameManager, ServiceLocator, EventBus
│       ├── Network/            # API client, auth service, domain services
│       ├── Settlement/         # Buildings, construction timers, civilians
│       ├── WorldMap/           # Map controller, march animator, tile views
│       ├── Combat/             # Battle resolver, report UI, rally UI
│       ├── Heroes/             # Roster, skills, relationships, equipment
│       ├── Troops/             # Training UI, hospital, counter indicators
│       ├── Economy/            # Resource manager, currency display
│       ├── Store/              # IAP flow, purchase validation
│       ├── Clan/               # Clan UI, territory, diplomacy
│       ├── UI/                 # Screen manager, HUD, accessibility
│       └── ...                 # +5 more systems
│
├── economy-sim/          # TypeScript standalone simulation
│   ├── src/
│   │   ├── balance-config.ts   # All tunable constants (data-driven)
│   │   ├── industrial-model.ts # Industrial Ascension economics
│   │   └── simulate.ts         # 90-day F2P/Light/Heavy sim + 6 balance tests
│   └── output/
│       └── simulation_results.csv
│
├── docs/
│   ├── architecture.md         # System design, tech stack rationale
│   ├── decisions/              # Decision records (ADRs, spec §4.5)
│   │   ├── 001-backend-framework.md
│   │   ├── 002-database-schema.md
│   │   └── 003-economy-simulation.md
│   └── progress-log.md         # Phase completion log, known issues
│
├── scripts/
│   └── setup.sh          # One-command dev environment setup
│
├── docker-compose.yml    # Local dev: postgres, redis, backend, admin-panel
└── README.md             # ← You are here
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+**
- **Docker** (for PostgreSQL + Redis)
- **Git**

### One-Command Setup

```bash
git clone https://github.com/JayF9512/Shogun.git
cd Shogun
./scripts/setup.sh
```

This will:
1. ✅ Start PostgreSQL and Redis containers
2. ✅ Install all dependencies (backend, admin-panel, economy-sim)
3. ✅ Run database migrations
4. ✅ Seed initial data

### Start All Services

```bash
docker-compose up
```

**Access Points:**
- 🔌 **Backend API:** http://localhost:3001/api
- 🎛️ **Admin Panel:** http://localhost:3000
- 🗄️ **PostgreSQL:** localhost:5432 (user: `shogun`, pass: `shogun`, db: `shogun`)
- 💾 **Redis:** localhost:6379

---

## 🧪 Testing

### Backend Unit Tests (24 tests)
```bash
cd backend
npm test
```

**Coverage:**
- ✅ Combat: 3-class counter system, hero bonuses, draw conditions
- ✅ Progression: Industrial Ascension gates, sub-stage visibility
- ✅ Economy: Resource production formulas, tick logic, capacity clamping
- ✅ March: Speed calculation, Komainu bonus, travel time

### Backend Integration Tests
```bash
cd backend
npm run test:integration
```

**Coverage:**
- ✅ Progression: L30 → I1 ascension flow, stage transitions
- ✅ Combat: Full battle resolution with mixed stacks
- ✅ Economy: Multi-resource production, CATALYST unlock gate
- ✅ March: End-to-end march creation, cap enforcement

### Economy Simulation (Balance Validation)
```bash
cd economy-sim
npm run simulate
```

**6 Balance Tests (All Passing):**
1. ✅ F2P player reaches Level 20 by day 30
2. ✅ F2P player reaches Level 30 by day 60
3. ✅ Light spender ($5/mo) reaches Level 30 by day 45
4. ✅ Heavy spender ($50/mo) reaches Industrial 2 by day 90
5. ✅ F2P player earns enough Jade for 1 premium hero per season
6. ✅ No resource exceeds 10x storage capacity (inflation check)

**Output:** `economy-sim/output/simulation_results.csv`

---

## 📊 Phase Completion Status

| Phase | Description | Status | Key Deliverables |
|-------|-------------|--------|------------------|
| **1** | NestJS Backend + PostgreSQL Schema | ✅ **Complete** | 50+ entities, 19 modules, 24 passing tests, PR #1 merged |
| **2** | Next.js Admin Panel + LiveOps | ✅ **Complete** | 11 pages, Japanese dark aesthetic, audit logging, PR #2 merged |
| **3** | Unity C# Systems | ✅ **Complete** | 91 scripts, 15 systems, server-sync architecture, PR #3 merged |
| **4** | Economy Sim + Integration Tests + Infra | ✅ **Complete** | 6 balance tests, docker-compose, setup script, PR #4 merged |
| **5** | Season Zero Production | 🔄 **Next** | Levels 1-30 content, 12 heroes, campaign, tutorial |
| **6** | Alpha Testing | 📋 **Planned** | Full progression validation, security audit |
| **7** | Closed Beta | 📋 **Planned** | Retention metrics, monetization tuning |
| **8** | Soft Launch | 📋 **Planned** | Single-region rollout, performance benchmarks |
| **9** | Global Launch | 📋 **Planned** | Season Zero live, cross-server infrastructure |

---

## 🎮 Key Game Systems Implemented

### Combat System (Spec §14)
```typescript
// Three-class counter with +25% attack bonus:
// SAMURAI_GUARD beats KOMAINU_RIDERS
// KOMAINU_RIDERS beat YUMI_ARCHERS
// YUMI_ARCHERS beat SAMURAI_GUARD

battlePower = troops × attack × counterMultiplier × heroBonus
casualties = loserPower × 0.5
```

**Verified:** 24/24 unit tests passing, deterministic battle resolution

### Industrial Ascension (Spec §10)
```typescript
// Standard Levels 1-30 → Industrial Levels 1-10
// Each Industrial level has 5 private sub-stages
// Only completed full levels show publicly

// Ascension Requirements (L30 → I1):
- Tenshu Level 30
- All military buildings Level 30
- Research Hall Level 30
- Hospital Level 30
- CATALYST resource unlocked
```

**Verified:** Progression tests passing, visibility rules enforced

### Economy & Resources (Spec §12, §98)
```typescript
// Server-controlled production tick (configurable rates):
RICE:     100/hr × (1 + 0.1 × buildingLevel)
WOOD:      80/hr × (1 + 0.1 × buildingLevel)
STONE:     60/hr × (1 + 0.1 × buildingLevel)
IRON:      40/hr × (1 + 0.1 × buildingLevel)
CHARCOAL:  30/hr × (1 + 0.1 × buildingLevel)
CATALYST:  20/hr × (1 + 0.1 × buildingLevel)  // Industrial 1+ only

// Currencies (server-authoritative):
JADE:       Premium (paid)
HONOUR:     F2P earnable
FEAR:       From combat victories
CORRUPTION: Negative currency from dark actions
```

**Verified:** Economy simulation validates F2P/paid balance over 90 days

### March System (Spec §15)
```typescript
// Speed formula:
baseSpeed = 100 tiles/hr
komaiunBonus = +30% if KOMAINU_RIDERS dominant
heroonus = variable% from hero march skills

effectiveSpeed = baseSpeed × (1 + komaiunBonus) × (1 + heroBonus)
travelTime = distance / effectiveSpeed

// Max simultaneous marches:
playerLevel / 5 (min 1, max 5)
```

**Verified:** March tests passing, speed bonuses stack correctly

---

## 🔐 Security & Anti-Cheat (Spec §111)

### Server Authority
- ✅ All game state lives in PostgreSQL (no client-side state)
- ✅ All resource grants require server validation
- ✅ All timers server-synced (client prediction only)
- ✅ Purchase validation: server verifies platform receipts before entitlement

### Authentication
- ✅ JWT-based with refresh tokens
- ✅ Session tracking (user agent + IP)
- ✅ Logout revokes all sessions

### Admin Audit
- ✅ Every mutating admin action logged to `AdminAuditLog`
- ✅ Immutable audit trail (timestamp, admin, target, action, details)

### Environment Separation (Spec §114)
```bash
.env.development   # Local dev (accelerated timers, test resources)
.env.staging       # QA environment (production-like economy)
.env.production    # Live (real payments, signed content, monitoring)
```

**Rule:** Dev and production databases NEVER share live player records.

---

## 📖 Key Design Decisions

See `docs/decisions/` for full ADRs (Architectural Decision Records):

1. **[DR-001: Backend Framework](docs/decisions/001-backend-framework.md)**
   - **Problem:** Need scalable, structured backend for live-service game
   - **Solution:** NestJS 10 (TypeScript)
   - **Rationale:** Modular architecture, DI, built-in validation, strong ecosystem
   - **Risks:** Runtime weight, learning curve

2. **[DR-002: Database Schema](docs/decisions/002-database-schema.md)**
   - **Problem:** Manage ~50 interrelated entities with integrity
   - **Solution:** Prisma 5 ORM over PostgreSQL
   - **Rationale:** Schema-first, type-safe, robust migrations, relational constraints
   - **Risks:** Large table migrations, JSON query performance at scale

3. **[DR-003: Economy Simulation](docs/decisions/003-economy-simulation.md)**
   - **Problem:** Balance F2P/paid progression without live data
   - **Solution:** Standalone TypeScript sim with 6 automated balance tests
   - **Rationale:** Data-driven tuning, CI-ready validation, CSV export for designers
   - **Risks:** Sim assumptions may diverge from player behavior

---

## 🛠️ Development Conventions

### Data-Driven Balancing (Spec §4.6)
- ✅ All balance values in `balance-config.ts` (economy-sim) or `Constants` (Unity)
- ✅ No magic numbers hardcoded in game logic
- ✅ Tunable via admin panel (production rates, counter bonuses, march speeds)

### Testing Before Expansion (Spec §4.6)
- ✅ Every core system has unit tests before integration
- ✅ Integration tests verify cross-module flows
- ✅ Economy sim validates balance before implementation

### Environment Separation (Spec §114)
- ✅ `.env.example` committed, `.env` gitignored
- ✅ `NODE_ENV` controls dev/staging/production behavior
- ✅ Secrets (JWT keys, DB passwords) never in code

### Audit Logging (Spec §4.5)
- ✅ Every admin action logged with timestamp, actor, target, details
- ✅ Decision records in `docs/decisions/` for major architectural choices

---

## 📚 Documentation

- **[Architecture Overview](docs/architecture.md)** — System diagram, tech stack, service communication
- **[Decision Records](docs/decisions/)** — ADRs for framework, database, economy choices
- **[Progress Log](docs/progress-log.md)** — Phase completion log, known issues, next steps

---

## 🎯 Definition of Done (Spec §117)

A system is **complete** only when it is:

1. ✅ **Implemented** — Code written and committed
2. ✅ **Integrated** — Works with other modules
3. ✅ **Server-validated** — State controlled by backend
4. ✅ **Visually represented** — UI renders the state (Unity/Admin)
5. ✅ **Tested** — Unit + integration tests passing
6. ✅ **Documented** — README, ADRs, inline comments where needed
7. ✅ **Localized** — Uses locale keys (not hardcoded English)
8. ✅ **Accessible** — Supports text scaling, color-blind modes (Unity)
9. ✅ **Instrumented** — Analytics events tracked
10. ✅ **Admin-manageable** — LiveOps can tune/override
11. ✅ **Protected** — Server-authoritative, validated inputs
12. ✅ **Performant** — Meets mobile 30 FPS target
13. ✅ **Release-assigned** — Tagged to a season/phase

---

## 🤝 Contributing

### Branch Naming
- `feature/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation updates

### Pull Request Flow
1. Create feature branch from `main`
2. Implement + test locally
3. Open PR with description linking to spec section
4. Merge after review

**Current PRs:**
- ~~PR #1: Backend foundation (merged)~~
- ~~PR #2: Admin panel (merged)~~
- ~~PR #3: Unity scripts (merged)~~
- ~~PR #4: Economy sim + infra (merged)~~

---

## 📜 License

Proprietary — All rights reserved. This is a commercial game project.

---

## 🔗 Links

- **GitHub Repository:** https://github.com/JayF9512/Shogun
- **Full Game Design Spec:** See `/Uploads/Pasted.txt` (4768 lines, 119 sections)
- **Architecture Docs:** [docs/architecture.md](docs/architecture.md)
- **Decision Records:** [docs/decisions/](docs/decisions/)

---

**Built with:** NestJS · Prisma · PostgreSQL · Redis · Next.js · Unity 6 · TypeScript

**Last Updated:** Phase 4 Complete — August 1, 2026
