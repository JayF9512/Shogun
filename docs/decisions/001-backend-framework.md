# DR-001: Backend framework — NestJS

_Decision record format per spec §4.5._

- **Status**: Accepted
- **Date**: 2026-08-01
- **Phase**: 1 (Backend foundation)

## Problem
We need a backend framework for a server-authoritative live-service 4X game with
~19 bounded contexts (auth, economy, combat, clans, store, LiveOps, …), a large
future team, and strict requirements around testing and dev/staging/prod parity.

## Existing proposal
Use a TypeScript backend (shared language with tooling; strong typing for a large
entity model).

## Alternatives considered
1. **Express (plain)** — minimal, fast to start, but no built-in structure, DI, or
   testing conventions; every team would invent its own patterns → drift.
2. **Fastify** — great throughput, but same structural gap as Express.
3. **Go (Fiber/Echo)** — excellent performance, but splits the stack's language,
   raises hiring/coordination cost, and slows schema/DTO sharing with tooling.
4. **NestJS** — opinionated modular architecture, first-class DI, guards/pipes,
   and a testing story out of the box.

## Selected solution
**NestJS 10 (TypeScript).**

## Reason
- Module-per-domain maps cleanly to the game's bounded contexts.
- Dependency injection makes business logic (combat, economy, progression) easy
  to unit-test in isolation — satisfying spec §4.6 ("test each system").
- Global `ValidationPipe` + class-validator enforce input contracts centrally.
- Guards/strategies give a clean JWT auth boundary; secrets stay in env (§111).
- Large, well-documented ecosystem lowers onboarding cost for the team (§35).

## Risks
- Slightly heavier runtime than bare Express → mitigated; the DB and game logic,
  not the framework, dominate latency.
- Decorator/DI learning curve for newcomers → mitigated by consistent module
  scaffolding and this decision record.

## Systems affected
All backend modules; the build/test pipeline; the admin panel's API contract.

## Rollback method
Modules are thin over framework-agnostic services. The pure logic
(`CombatService`, `EconomyService`, etc.) has no Nest dependency and could be
re-hosted under Express/Fastify with new controllers if ever required.
