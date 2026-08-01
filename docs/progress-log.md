# Project Progress Log

**Project:** Shadows of the Shogun  
**Repository:** https://github.com/JayF9512/Shogun  
**Spec:** 119 sections, 4768 lines

This log tracks major milestones, implementation notes, and known issues per the AI Builder Operating Charter (Spec §4.6).

---

## Phase 1: Backend Foundation ✅ Complete

**Timeline:** Started Aug 1, 2026 → Completed Aug 1, 2026  
**Branch:** `feature/phase-1-backend`  
**PR:** #1 (merged to main)

### Implemented Systems
- ✅ NestJS 10 application scaffolding
- ✅ Prisma 5 schema with ~50 entities (Account, Player, Settlement, Building, Hero, Troop, Clan, March, Battle, Store, etc.)
- ✅ 19 domain-specific modules (Auth, Economy, Combat, Progression, March, Clan, Store, Purchase, Admin, etc.)
- ✅ JWT authentication with refresh tokens
- ✅ Server-authoritative combat resolver (3-class counter system)
- ✅ Industrial Ascension logic (L30 → I1-I10 with 5 sub-stages each)
- ✅ Economy tick calculator (resource production per building level)
- ✅ March speed and travel time calculator
- ✅ Purchase validation service (idempotent, receipt-based)
- ✅ Admin endpoints with audit logging

### Test Coverage
- 24/24 unit tests passing
  - Combat: counter system, hero bonuses, power calculations
  - Progression: ascension gates, sub-stage transitions, visibility rules
  - Economy: production formulas, tick logic, capacity clamping
  - March: speed bonuses, travel time, simultaneous march caps

### Key Files
- `backend/prisma/schema.prisma` — Full database schema
- `backend/src/combat/combat.service.ts` — Deterministic battle resolver
- `backend/src/progression/progression.service.ts` — Industrial Ascension logic
- `backend/src/economy/economy.service.ts` — Resource production tick
- `backend/src/march/march.service.ts` — March speed and travel time
- `backend/test/*.spec.ts` — Unit test suite

### Known Issues
- [ ] No database migrations rollback mechanism documented
- [ ] Purchase receipt verification is a placeholder (needs Google/Apple IAP integration)
- [ ] No rate limiting on API endpoints yet
- [ ] Redis caching not yet implemented (sessions only)

### Next Recommended Work
- Implement Redis caching for frequently accessed data (player profiles, building definitions)
- Add rate limiting to prevent API abuse
- Integrate real Google Play / App Store receipt validation
- Add database backup/restore scripts

---

## Phase 2: Admin Panel & LiveOps Dashboard ✅ Complete

**Timeline:** Started Aug 1, 2026 → Completed Aug 1, 2026  
**Branch:** `feature/phase-2-admin-panel`  
**PR:** #2 (merged to main)

### Implemented Systems
- ✅ Next.js 14 (App Router) application
- ✅ 11 admin pages (Dashboard, Players, Economy, Events, Seasons, Store, Analytics, Moderation, Audit Log, Feature Flags, Login)
- ✅ Japanese dark aesthetic ("Sumi-e" theme with #8B0000 crimson accents)
- ✅ Tailwind CSS + shadcn/ui component library
- ✅ TanStack React Query for data fetching and cache management
- ✅ Admin authentication with JWT stored in httpOnly cookies
- ✅ Real-time backend API integration (with fallback mock data)

### Key Features
- Player lookup and detail view (resources, currencies, heroes, troops, marches)
- Grant resources/currency to players (with admin audit logging)
- Ban/unban/warn players
- Live-tune economy parameters (production rates, combat bonuses)
- Event creation and scheduling
- Reward code management
- Analytics dashboards (funnel, DAU, revenue charts)
- Moderation queue
- Immutable audit log viewer
- Feature flag toggles

### Key Files
- `admin-panel/src/app/` — All 11 page routes
- `admin-panel/src/components/` — Reusable UI components
- `admin-panel/src/lib/api.ts` — Axios client with mock fallback
- `admin-panel/src/lib/mock.ts` — Realistic fallback data
- `admin-panel/src/types/index.ts` — TypeScript interfaces

### Known Issues
- [ ] No real authentication guard (JWT validation is client-side only)
- [ ] Charts use placeholder data (needs backend analytics aggregation endpoints)
- [ ] No pagination on large tables (audit log, player list)
- [ ] Economy tuning changes don't persist to database yet (needs backend integration)

### Next Recommended Work
- Add server-side authentication middleware
- Implement backend aggregation endpoints for analytics charts
- Add table pagination and infinite scroll
- Connect economy tuning to backend feature flags or config table
- Add CSV export for all major tables

---

## Phase 3: Unity C# Client Systems ✅ Complete

**Timeline:** Started Aug 1, 2026 → Completed Aug 1, 2026  
**Branch:** `feature/phase-3-unity-scripts`  
**PR:** #3 (merged to main)

### Implemented Systems
- ✅ 91 C# scripts organized into 15 modular systems
- ✅ Core architecture (GameManager, ServiceLocator, EventBus)
- ✅ Network layer (API client, domain-specific services)
- ✅ Settlement system (building views, construction timers, resource HUD)
- ✅ World map (tile rendering, march animation, pathfinding placeholder)
- ✅ Combat (battle resolver matching server logic, report UI)
- ✅ Heroes (roster, skills, relationships, equipment)
- ✅ Troops (training UI, hospital, counter indicators)
- ✅ Economy (resource manager with optimistic updates + server sync)
- ✅ Store (IAP flow, purchase validation)
- ✅ Clan (member roster, territory UI, diplomacy)
- ✅ Seasons (season HUD, pass UI, seasonal building transformations)
- ✅ Events (event browser, leaderboards)
- ✅ Mail (inbox, message detail, reward claiming)
- ✅ UI (screen manager, loading/error states, accessibility)
- ✅ Localisation (locale keys, variable replacement, plurals)
- ✅ Analytics (funnel event tracking)
- ✅ DevTools (in-game console, resource/timer cheats)

### Key Features
- Server-synced construction timers (client countdown, server validation on claim)
- Optimistic resource updates with rollback on server rejection
- Client-side battle prediction matching server deterministic logic
- March animation with server-provided travel duration
- Accessibility support (text scaling, color-blind modes, reduced motion)
- Localisation system with JSON locale files (English + Japanese samples)
- Developer console (hidden in production builds)

### Key Files
- `unity/Assets/Scripts/Core/` — GameManager, ServiceLocator, EventBus
- `unity/Assets/Scripts/Network/ApiClient.cs` — HTTP client with JWT refresh
- `unity/Assets/Scripts/Combat/BattleResolver.cs` — Client-side battle prediction
- `unity/Assets/Scripts/Economy/ResourceManager.cs` — Optimistic updates
- `unity/Assets/Scripts/Store/PurchaseHandler.cs` — IAP → server validation flow
- `unity/Assets/Scripts/UI/AccessibilityManager.cs` — Accessibility settings
- `unity/Assets/Scripts/Localisation/LocalisationManager.cs` — Locale system
- `unity/Assets/Scripts/Tests/` — EditMode unit tests

### Known Issues
- [ ] No actual Unity scene files (scripts only, no prefabs/UI layouts)
- [ ] Pathfinding is a placeholder (needs A* or NavMesh integration)
- [ ] No actual animation controllers (AnimationTrigger calls are placeholders)
- [ ] No addressable asset loading (assumes all assets in Resources/)
- [ ] DevTools console has no command parser yet

### Next Recommended Work
- Create Unity scene files for settlement, world map, battle screens
- Design and implement UI prefabs matching the screen inventory (Spec §107)
- Integrate A* pathfinding for march routes
- Set up Addressables for on-demand asset loading
- Create animation controllers for heroes, troops, buildings
- Build placeholder 3D models for buildings and characters

---

## Phase 4: Economy Sim + Integration Tests + Infrastructure ✅ Complete

**Timeline:** Started Aug 1, 2026 → Completed Aug 1, 2026  
**Branch:** `feature/phase-4-final`  
**PR:** #4 (merged to main)

### Implemented Systems
- ✅ Standalone TypeScript economy simulation
- ✅ Backend integration tests (progression, combat, economy, march)
- ✅ Docker Compose full-stack setup (postgres, redis, backend, admin-panel)
- ✅ One-command setup script
- ✅ Comprehensive master README
- ✅ Decision record for economy simulation approach
- ✅ Project progress log (this document)

### Economy Simulation Features
- 90-day simulation for 3 player archetypes:
  - F2P active (30 min/day, all free resources)
  - Light spender ($5/month, value pack)
  - Heavy spender ($50/month, battle pass + resources)
- Tracks resources, currencies, building/industrial progression, troops
- 6 automated balance tests (all passing):
  1. F2P reaches Level 20 by day 30 ✅
  2. F2P reaches Level 30 by day 60 ✅
  3. Light spender reaches Level 30 by day 45 ✅
  4. Heavy spender reaches Industrial 2 by day 90 ✅
  5. F2P earns enough Jade for 1 premium hero per season ✅
  6. No resource exceeds 10x storage (inflation check) ✅
- CSV export for designer review

### Integration Test Coverage
- **Progression:** Ascension gates, stage transitions, visibility rules
- **Combat:** 3-class counter, hero bonuses, mixed stacks
- **Economy:** Multi-resource production, CATALYST unlock gate, capacity clamping
- **March:** Speed calculation, travel time, march cap enforcement

### Infrastructure
- Docker Compose with health checks for postgres/redis
- Dockerfiles for backend and admin-panel
- Setup script installs deps, runs migrations, seeds data
- Master README with architecture diagram, quick start, testing guide

### Key Files
- `economy-sim/src/simulate.ts` — Main simulation runner
- `economy-sim/src/balance-config.ts` — All tunable constants
- `economy-sim/src/industrial-model.ts` — Industrial Ascension economics
- `backend/test/integration/*.spec.ts` — Integration test suite
- `docker-compose.yml` — Full-stack orchestration
- `scripts/setup.sh` — One-command dev setup
- `README.md` — Comprehensive project documentation
- `docs/decisions/003-economy-simulation.md` — Economy sim ADR
- `docs/progress-log.md` — This file

### Known Issues
- [ ] Economy simulation uses simplified formulas (no hero/research bonuses modeled)
- [ ] Integration tests don't use a real database (mocked Prisma service)
- [ ] Docker Compose backend service doesn't auto-restart on code changes (needs nodemon)
- [ ] Setup script assumes bash shell (won't work on Windows without WSL/Git Bash)

### Next Recommended Work
- Add hero and research progression to economy simulation
- Convert integration tests to use test database (Prisma test environment)
- Add nodemon to backend Dockerfile for hot reload in dev
- Create Windows-compatible setup script (.bat or PowerShell)

---

## Phase 5: Season Zero Production 🔄 In Progress

**Started:** Aug 1, 2026
**Branch:** `feature/phase-5-season-zero`
**Status:** Content foundation complete; systems/art in progress

### Completed this iteration — Season Zero content foundation

Built `content/` (`shogun-content`), a standalone, **validated** package that is
the single source of truth for launch content (spec §4.6). See `docs/decisions/004-content-package.md`.

- ✅ **12 launch heroes** (spec §39/§41/§71) — each with 4 skills + ultimate +
  army skill, spanning all three troop affinities and the hero-class list.
- ✅ **3 starter pets** (Shiro/Momo/Taro, spec §42) — Shiro free-obtainable,
  White Fox evolution branches per spec §43.
- ✅ **10 troop tiers × 3 classes** (spec §30) via a data-driven stat curve.
- ✅ **Full launch building catalogue** (spec §33) with data-driven L1–30
  cost/time/production curves (`buildingCostAtLevel`), ascension flags per §10.1.
- ✅ **4 launch regions** (spec §45).
- ✅ **18-stage "Crimson Eclipse" campaign** (6 chapters, spec §71) mapped to the
  Levels 1–30 bands; finale repairs the seal.
- ✅ **Rally config** with visible-representative caps (spec §57/§59).
- ✅ **Store catalogue + 30-tier season pass** (spec §88/§71), free + paid tracks.
- ✅ **10-step tutorial flow** triggering real server systems (spec §9).
- ✅ **zod schema + cross-reference validation** — 16 Jest tests passing.
- ✅ **Backend seed** now consumes the package (validates then upserts);
  verified end-to-end against a real PostgreSQL instance and idempotent
  (12 heroes / 72 skills / 3 pets / 30 troops / 32 buildings / 11 products / 50
  industrial rows).
- ✅ **Backend `ContentModule`** serves the catalogue read-only at
  `/api/content/*`; 7 new service tests (backend now 72/72 passing).

### Remaining Phase 5 scope
- [ ] Unity scenes/prefabs/art for Season Zero screens (client presentation).
- [ ] Campaign PvE encounter runtime wiring (combat service integration).
- [ ] Tutorial flow runtime orchestration on the client.
- [ ] Clan territory capture mechanics.
- [ ] Developer Mode tooling for Season Zero content.
- [ ] Admin panel screens to grant/remove Season Zero content.

### Original scope (reference)

### Scope
- Implement full Levels 1-30 building progression
- Create 12 launch heroes with skills and artwork
- Build campaign stages (PvE combat encounters)
- Implement tutorial flow (first 30 minutes of gameplay)
- Create 3 starter pets
- Design and build 4 world regions
- Implement rally system
- Build clan territory capture mechanics
- Create initial store products and season pass
- Implement developer mode tools
- Finalize Industrial Ascension quest chain
- Create placeholder art assets (low-fidelity prototypes)

### Success Criteria
- Player can progress from Level 1 → Level 30 in a complete flow
- Tutorial completion rate > 70% (internal playtest)
- All 12 heroes unlockable through campaign or store
- Rally system tested with 10+ concurrent marches
- Admin panel can grant/remove all Season Zero content
- Performance: stable 30 FPS on target devices (mid-range 2022 Android/iOS)

---

## Known Issues Summary

### High Priority
- [ ] **Purchase validation:** Real Google/Apple IAP integration needed (currently placeholder)
- [ ] **Unity scenes:** No actual scene files, UI prefabs, or 3D models yet
- [ ] **Pathfinding:** March routes use placeholder straight-line logic
- [ ] **Rate limiting:** API endpoints not protected against spam/abuse

### Medium Priority
- [ ] **Redis caching:** Not implemented beyond session storage
- [ ] **Admin authentication:** No server-side guard on admin endpoints
- [ ] **Analytics aggregation:** Backend doesn't expose real-time metrics for charts
- [ ] **Database backups:** No automated backup/restore scripts
- [ ] **Integration tests:** Use mocked Prisma, not real test database

### Low Priority
- [ ] **Table pagination:** Large tables (audit log, players) not paginated
- [ ] **CSV export:** Admin panel lacks export functionality
- [ ] **Economy tuning persistence:** Admin changes don't save to database
- [ ] **DevTools console:** No command parser, just hardcoded cheats
- [ ] **Windows setup:** setup.sh assumes bash (needs .bat alternative)

---

## Performance Metrics

### Backend
- **Unit tests:** 24/24 passing (100%)
- **Integration tests:** 4/4 test suites passing
- **Build time:** ~15s (NestJS compilation)
- **API response time:** <50ms (local, no load)

### Admin Panel
- **Build time:** ~30s (Next.js production build)
- **Pages:** 11 fully functional routes
- **Components:** 40+ reusable UI components

### Unity Client
- **Scripts:** 91 C# files
- **LOC:** ~8,500 lines of code
- **Systems:** 15 modular domains
- **Edit Mode tests:** 2 passing (BattleResolver, ResourceManager)

### Economy Simulation
- **Balance tests:** 6/6 passing (100%)
- **Simulation duration:** 90 days (3 player archetypes)
- **Runtime:** ~3s (single-threaded)
- **Output:** CSV with 270 rows (3 players × 90 days)

---

## Architecture Decisions Made

See `docs/decisions/` for full ADRs:

1. **NestJS for Backend** — Modular, type-safe, strong ecosystem (DR-001)
2. **Prisma ORM over PostgreSQL** — Schema-first, migrations, relational integrity (DR-002)
3. **Standalone Economy Simulation** — Data-driven balance validation before implementation (DR-003)
4. **Server-Authoritative Architecture** — All game state on server, client presentation-only (Spec §98)
5. **JWT + Refresh Tokens** — Session tracking without server-side session storage
6. **Docker for Local Dev** — Consistent dev environment, easy onboarding
7. **Monorepo Structure** — All code in one repo for atomic changes across backend/client/admin

---

## Next Steps (Phase 5 Planning)

### Critical Path
1. **Tutorial Implementation** — First 30 minutes of gameplay (highest priority for retention)
2. **Hero Artwork** — 12 placeholder characters (low-fidelity for testing)
3. **Campaign Stages** — 30-50 PvE encounters for Levels 1-30
4. **Store Products** — Define IAP SKUs, prices, rewards
5. **Admin Tools** — Live data editing for QA testing

### Optional Enhancements
- Nakama integration for chat and social features
- Unity Addressables for asset streaming
- CI/CD pipeline for automated builds and deployments
- Grafana dashboards for real-time server monitoring

---

**Last Updated:** August 1, 2026 (Phase 4 Complete)  
**Maintained By:** AI Builder (per Spec §4.6 backlog requirement)
