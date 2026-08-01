/**
 * balance-config.ts — Shadows of the Shogun
 * -----------------------------------------------------------------------------
 * Single source of truth for every tunable balance value used by the economy
 * simulation. Nothing in the simulation should hard-code a "magic number";
 * every knob lives here so designers can iterate on balance without touching
 * simulation logic (spec §4.6 — data-driven balancing).
 *
 * All values mirror the server-authoritative production math in
 * backend/src/economy/economy.service.ts so the sim and the live game agree.
 */

export type ResourceType =
  | 'RICE'
  | 'WOOD'
  | 'STONE'
  | 'IRON'
  | 'CHARCOAL'
  | 'CATALYST';

export const RESOURCES: ResourceType[] = [
  'RICE',
  'WOOD',
  'STONE',
  'IRON',
  'CHARCOAL',
  'CATALYST',
];

export type TroopClass = 'SAMURAI_GUARD' | 'YUMI_ARCHERS' | 'KOMAINU_RIDERS';

// -----------------------------------------------------------------------------
// Simulation horizon
// -----------------------------------------------------------------------------
export const SIM = {
  DAYS: 90,
  HOURS_PER_DAY: 24,
  /** A "season" for hero-affordability checks (spec §22 seasonal cadence). */
  SEASON_DAYS: 90,
};

// -----------------------------------------------------------------------------
// Resource production — base rates per hour at building level 1
// (must match backend BASE_PRODUCTION so sim ≡ server).
// -----------------------------------------------------------------------------
export const BASE_PRODUCTION: Record<ResourceType, number> = {
  RICE: 100,
  WOOD: 80,
  STONE: 60,
  IRON: 40,
  CHARCOAL: 30,
  CATALYST: 0, // unlocked only at Industrial 1
};

/** Catalyst production per hour once Industrial 1 is reached (per level 1). */
export const CATALYST_BASE_PRODUCTION = 20;

/** Each building level adds +10% production (matches backend levelMultiplier). */
export const PRODUCTION_PER_LEVEL = 0.1;

export function levelMultiplier(buildingLevel: number): number {
  return 1 + PRODUCTION_PER_LEVEL * (Math.max(1, buildingLevel) - 1);
}

/**
 * Production per hour for a resource at a given building level.
 * CATALYST stays 0 until industrialLevel >= 1.
 */
export function productionPerHour(
  resource: ResourceType,
  buildingLevel: number,
  industrialLevel = 0,
): number {
  if (resource === 'CATALYST') {
    if (industrialLevel < 1) return 0;
    return CATALYST_BASE_PRODUCTION * levelMultiplier(buildingLevel);
  }
  return BASE_PRODUCTION[resource] * levelMultiplier(buildingLevel);
}

// -----------------------------------------------------------------------------
// Storage capacity — grows with building level. Used for the inflation check
// (no resource may exceed 10x capacity).
// -----------------------------------------------------------------------------
export const STORAGE = {
  BASE_CAPACITY: 120_000,
  PER_LEVEL: 0.6, // +35% capacity per building level
  /** Inflation guardrail: stored amount must stay under this * capacity. */
  INFLATION_MULTIPLIER_LIMIT: 10,
};

export function storageCapacity(buildingLevel: number): number {
  return Math.round(
    STORAGE.BASE_CAPACITY * (1 + STORAGE.PER_LEVEL * (Math.max(1, buildingLevel) - 1)),
  );
}

// -----------------------------------------------------------------------------
// Construction / level-up gating
// -----------------------------------------------------------------------------
// Standard progression is levels 1..30 (Tenshu-gated). Advancing one level
// requires a construction that costs time (the binding constraint for active
// players) and resources. The time curve is intentionally near-linear so the
// L20 and L30 milestones fall on the designed days.
export const CONSTRUCTION = {
  STANDARD_MAX_LEVEL: 30,
  /** hours(level) = TIME_COEFF * level^TIME_EXP */
  TIME_COEFF: 3.4,
  TIME_EXP: 0.95,
  /** Resource cost to complete a level (rice-equivalent, split across types). */
  COST_BASE: 1_200,
  COST_GROWTH: 1.06,
};

/** Construction time (hours) to go from (level-1) -> level. */
export function constructionTimeHours(level: number): number {
  if (level <= 1) return 0;
  return CONSTRUCTION.TIME_COEFF * Math.pow(level, CONSTRUCTION.TIME_EXP);
}

/** Rice-equivalent resource cost to complete the upgrade to `level`. */
export function levelUpCost(level: number): number {
  if (level <= 1) return 0;
  return Math.round(
    CONSTRUCTION.COST_BASE * Math.pow(CONSTRUCTION.COST_GROWTH, level - 2),
  );
}

// -----------------------------------------------------------------------------
// Research — time formula (Research Hall gates ascension at L30).
// -----------------------------------------------------------------------------
export const RESEARCH = {
  TIME_COEFF: 2.0, // hours
  TIME_EXP: 1.05,
};

export function researchTimeHours(tier: number): number {
  return RESEARCH.TIME_COEFF * Math.pow(Math.max(1, tier), RESEARCH.TIME_EXP);
}

// -----------------------------------------------------------------------------
// Troop training — cost + time per class (spec §7 three-class roster).
// -----------------------------------------------------------------------------
export const TRAINING: Record<
  TroopClass,
  { riceCost: number; ironCost: number; timeSeconds: number }
> = {
  SAMURAI_GUARD: { riceCost: 120, ironCost: 60, timeSeconds: 90 },
  YUMI_ARCHERS: { riceCost: 100, ironCost: 40, timeSeconds: 75 },
  KOMAINU_RIDERS: { riceCost: 150, ironCost: 80, timeSeconds: 120 },
};

/** Daily training budget (rice) an archetype commits to troops. */
export const TRAINING_DAILY_RICE_BUDGET = {
  F2P: 8_000,
  LIGHT: 12_000,
  HEAVY: 24_000,
};

// -----------------------------------------------------------------------------
// Jade economy (soft/premium currency) — earn rates.
// -----------------------------------------------------------------------------
export const JADE = {
  /** Free jade earned per day by an active F2P player. */
  DAILY_MISSIONS: 45,
  EVENTS_PER_DAY: 10,
  ACHIEVEMENTS_PER_DAY: 5,
  /** Value of 1 jade when spent on a speedup, expressed in build-hours. */
  SPEEDUP_HOURS_PER_JADE: 0.02,
  /** Jade price of one premium (seasonal) hero. */
  PREMIUM_HERO_COST: 3_600,
};

export function f2pJadePerDay(): number {
  return JADE.DAILY_MISSIONS + JADE.EVENTS_PER_DAY + JADE.ACHIEVEMENTS_PER_DAY;
}

// -----------------------------------------------------------------------------
// Honour (prestige currency from combat/events, spec §7.3 fear/honour loop).
// -----------------------------------------------------------------------------
export const HONOUR = {
  F2P_PER_DAY: 120,
  LIGHT_PER_DAY: 180,
  HEAVY_PER_DAY: 320,
};

// -----------------------------------------------------------------------------
// Monetisation archetypes — what each paying tier buys.
// -----------------------------------------------------------------------------
export interface SpendConfig {
  /** Simultaneous construction queues. */
  buildQueues: number;
  /** Extra jade granted per day from purchased packs (converted to speedups). */
  purchasedJadePerDay: number;
  /** One-time resource injection from a value pack, applied on day 1. */
  valuePackResources: number;
  /** Daily catalyst pack income (industrial acceleration), post-ascension. */
  catalystPackPerDay: number;
  /** Fraction of earned jade spent on speedups (rest is saved, e.g. heroes). */
  jadeToSpeedupRatio: number;
}

export const ARCHETYPES: Record<'F2P' | 'LIGHT' | 'HEAVY', SpendConfig> = {
  // F2P: one queue, saves every jade (heroes), no packs.
  F2P: {
    buildQueues: 1,
    purchasedJadePerDay: 0,
    valuePackResources: 0,
    catalystPackPerDay: 0,
    jadeToSpeedupRatio: 0,
  },
  // Light spender: $5/mo value pack — modest jade + a resource injection.
  LIGHT: {
    buildQueues: 1,
    purchasedJadePerDay: 300,
    valuePackResources: 250_000,
    catalystPackPerDay: 0,
    jadeToSpeedupRatio: 1,
  },
  // Heavy spender: $50/mo battle pass + resource/catalyst packs — 2 queues.
  HEAVY: {
    buildQueues: 2,
    purchasedJadePerDay: 1_800,
    valuePackResources: 1_000_000,
    catalystPackPerDay: 900,
    jadeToSpeedupRatio: 1,
  },
};

// -----------------------------------------------------------------------------
// March speed coefficients (spec §15/§16) — mirrors backend MarchService.
// -----------------------------------------------------------------------------
export const MARCH = {
  BASE_SPEED: 100, // tiles per hour
  KOMAINU_SPEED_BONUS: 0.3, // +30% when Komainu-heavy
  MAX_SIMULTANEOUS: 5,
};

// -----------------------------------------------------------------------------
// Balance milestone targets — asserted by the simulation's self-tests.
// -----------------------------------------------------------------------------
export const TARGETS = {
  F2P_LEVEL_20_BY_DAY: 30,
  F2P_LEVEL_30_BY_DAY: 60,
  LIGHT_LEVEL_30_BY_DAY: 45,
  HEAVY_INDUSTRIAL_2_BY_DAY: 90,
};
