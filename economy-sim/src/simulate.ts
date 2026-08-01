/**
 * simulate.ts — Shadows of the Shogun economy simulation
 * -----------------------------------------------------------------------------
 * Simulates three player archetypes over a 90-day season and validates the
 * live-service balance targets (F2P vs paid progression) from the spec.
 *
 *   1. F2P active      — plays ~30 min/day, earns only free resources & jade.
 *   2. Light spender   — $5/month value pack (modest jade + resource injection).
 *   3. Heavy spender   — $50/month battle pass + resource/catalyst packs.
 *
 * Everything is driven by balance-config.ts / industrial-model.ts. Running the
 * sim prints a per-archetype summary table, writes a full per-day CSV to
 * output/simulation_results.csv, and asserts six balance tests. The process
 * exits with a non-zero code if any balance test fails (CI gate).
 *
 * Run:  npm run simulate
 */

import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { createObjectCsvWriter } from 'csv-writer';

import {
  ResourceType,
  RESOURCES,
  TroopClass,
  SIM,
  productionPerHour,
  storageCapacity,
  STORAGE,
  constructionTimeHours,
  levelUpCost,
  CONSTRUCTION,
  TRAINING,
  TRAINING_DAILY_RICE_BUDGET,
  JADE,
  f2pJadePerDay,
  HONOUR,
  ARCHETYPES,
  SpendConfig,
  TARGETS,
} from './balance-config';
import {
  stagesUpTo,
  IndustrialStage,
  INDUSTRIAL,
} from './industrial-model';

type ArchetypeKey = 'F2P' | 'LIGHT' | 'HEAVY';

const ARCHETYPE_LABELS: Record<ArchetypeKey, string> = {
  F2P: 'F2P active',
  LIGHT: 'Light spender ($5/mo)',
  HEAVY: 'Heavy spender ($50/mo)',
};

const HONOUR_PER_DAY: Record<ArchetypeKey, number> = {
  F2P: HONOUR.F2P_PER_DAY,
  LIGHT: HONOUR.LIGHT_PER_DAY,
  HEAVY: HONOUR.HEAVY_PER_DAY,
};

interface DaySnapshot {
  day: number;
  archetype: ArchetypeKey;
  level: number; // standard level 1..30
  industrialLevel: number; // 0 pre-ascension, else 1..10
  buildingLevel: number; // Tenshu / avg building level (== level here)
  resources: Record<ResourceType, number>;
  jadeEarned: number; // cumulative
  jadeSpent: number; // cumulative
  jadeBalance: number;
  honour: number; // cumulative
  troops: Record<TroopClass, number>;
  troopsTotal: number;
}

interface PlayerState {
  archetype: ArchetypeKey;
  cfg: SpendConfig;
  level: number;
  buildingLevel: number;
  ascended: boolean;
  stagesCompleted: number; // industrial sub-stages completed
  industrialStages: IndustrialStage[];
  /** Persistent build-hours bank — construction continues across days. */
  hoursBank: number;
  resources: Record<ResourceType, number>;
  catalystBank: number;
  jadeEarned: number;
  jadeSpent: number;
  jadeBalance: number;
  honour: number;
  troops: Record<TroopClass, number>;
  // Milestone bookkeeping
  dayReachedLevel: Record<number, number>;
  dayReachedIndustrial: Record<number, number>;
}

function emptyResources(): Record<ResourceType, number> {
  return { RICE: 0, WOOD: 0, STONE: 0, IRON: 0, CHARCOAL: 0, CATALYST: 0 };
}

function newPlayer(archetype: ArchetypeKey): PlayerState {
  const cfg = ARCHETYPES[archetype];
  const resources = emptyResources();
  // One-time value pack injection (day 1), spread across the four core resources.
  if (cfg.valuePackResources > 0) {
    const per = cfg.valuePackResources / 4;
    resources.RICE += per;
    resources.WOOD += per;
    resources.STONE += per;
    resources.IRON += per;
  }
  return {
    archetype,
    cfg,
    level: 1,
    buildingLevel: 1,
    ascended: false,
    stagesCompleted: 0,
    industrialStages: stagesUpTo(INDUSTRIAL.MAX_LEVEL),
    hoursBank: 0,
    resources,
    catalystBank: 0,
    jadeEarned: 0,
    jadeSpent: 0,
    jadeBalance: 0,
    honour: 0,
    troops: { SAMURAI_GUARD: 0, YUMI_ARCHERS: 0, KOMAINU_RIDERS: 0 },
    dayReachedLevel: {},
    dayReachedIndustrial: {},
  };
}

/** Public industrial level: 1 at ascension, +1 per 5 completed sub-stages. */
function industrialLevelOf(p: PlayerState): number {
  if (!p.ascended) return 0;
  return Math.min(
    INDUSTRIAL.MAX_LEVEL,
    1 + Math.floor(p.stagesCompleted / INDUSTRIAL.SUB_STAGES_PER_LEVEL),
  );
}

/** Daily build-hours available from queues + jade-funded speedups. */
function buildHoursPerDay(p: PlayerState): number {
  const queueHours = SIM.HOURS_PER_DAY * p.cfg.buildQueues;
  const jadePerDay = f2pJadePerDay() + p.cfg.purchasedJadePerDay;
  const jadeForSpeedups = jadePerDay * p.cfg.jadeToSpeedupRatio;
  const speedupHours = jadeForSpeedups * JADE.SPEEDUP_HOURS_PER_JADE;
  return queueHours + speedupHours;
}

/** Accrue a day of resource production, clamped to storage capacity. */
function produceResources(p: PlayerState): void {
  const industrialLevel = industrialLevelOf(p);
  const cap = storageCapacity(p.buildingLevel);
  for (const r of RESOURCES) {
    if (r === 'CATALYST') continue; // catalyst handled via catalystBank
    const perHour = productionPerHour(r, p.buildingLevel, industrialLevel);
    const produced = perHour * SIM.HOURS_PER_DAY;
    p.resources[r] = Math.min(cap, p.resources[r] + produced);
  }
  // Catalyst only flows after ascension; tracked separately for industrial use.
  if (industrialLevel >= 1) {
    const catalystPerHour = productionPerHour('CATALYST', p.buildingLevel, industrialLevel);
    const producedCatalyst = catalystPerHour * SIM.HOURS_PER_DAY + p.cfg.catalystPackPerDay;
    p.catalystBank += producedCatalyst;
    // Mirror a portion into the visible CATALYST stock (clamped) for reporting.
    p.resources.CATALYST = Math.min(cap, p.catalystBank);
  }
}

/** Try to pay a rice-equivalent cost from the four core resources. */
function paySplitCost(p: PlayerState, cost: number): boolean {
  const core: ResourceType[] = ['RICE', 'WOOD', 'STONE', 'IRON'];
  const per = cost / core.length;
  if (core.some((r) => p.resources[r] < per)) return false;
  for (const r of core) p.resources[r] -= per;
  return true;
}

/** Standard levelling 1 -> 30, gated by build-hours and resources. */
function progressStandardLevels(p: PlayerState, day: number): void {
  while (p.level < CONSTRUCTION.STANDARD_MAX_LEVEL) {
    const nextLevel = p.level + 1;
    const needHours = constructionTimeHours(nextLevel);
    const needCost = levelUpCost(nextLevel);
    if (p.hoursBank < needHours) break;
    if (!paySplitCost(p, needCost)) break;
    p.hoursBank -= needHours;
    p.level = nextLevel;
    p.buildingLevel = nextLevel;
    if (p.dayReachedLevel[p.level] === undefined) p.dayReachedLevel[p.level] = day;
  }
}

/** Industrial ascension + sub-stage progression, gated by hours & catalyst. */
function progressIndustrial(p: PlayerState, day: number): void {
  if (p.level < CONSTRUCTION.STANDARD_MAX_LEVEL) return;
  if (!p.ascended) {
    // Gate assumed satisfied at L30 (all buildings maxed in this sim).
    p.ascended = true;
    if (p.dayReachedIndustrial[1] === undefined) p.dayReachedIndustrial[1] = day;
  }
  while (p.stagesCompleted < p.industrialStages.length) {
    const stage = p.industrialStages[p.stagesCompleted];
    if (p.catalystBank < stage.catalystCost) break;
    if (p.hoursBank < stage.timeHours) break;
    p.catalystBank -= stage.catalystCost;
    p.hoursBank -= stage.timeHours;
    p.stagesCompleted += 1;
    const il = industrialLevelOf(p);
    if (p.dayReachedIndustrial[il] === undefined) p.dayReachedIndustrial[il] = day;
  }
}

/** Train troops from a daily rice budget, split across the three classes. */
function trainTroops(p: PlayerState): void {
  const budget = TRAINING_DAILY_RICE_BUDGET[p.archetype];
  if (p.resources.RICE < budget) return; // only train from surplus
  const perClass = budget / 3;
  (Object.keys(TRAINING) as TroopClass[]).forEach((cls) => {
    const unit = TRAINING[cls];
    const trained = Math.floor(perClass / unit.riceCost);
    const ironNeeded = trained * unit.ironCost;
    if (p.resources.IRON < ironNeeded) return;
    p.resources.RICE -= trained * unit.riceCost;
    p.resources.IRON -= ironNeeded;
    p.troops[cls] += trained;
  });
}

function earnCurrencies(p: PlayerState): void {
  const jadePerDay = f2pJadePerDay() + p.cfg.purchasedJadePerDay;
  p.jadeEarned += jadePerDay;
  const spentToday = jadePerDay * p.cfg.jadeToSpeedupRatio;
  p.jadeSpent += spentToday;
  p.jadeBalance += jadePerDay - spentToday;
  p.honour += HONOUR_PER_DAY[p.archetype];
}

function snapshot(p: PlayerState, day: number): DaySnapshot {
  const troopsTotal =
    p.troops.SAMURAI_GUARD + p.troops.YUMI_ARCHERS + p.troops.KOMAINU_RIDERS;
  return {
    day,
    archetype: p.archetype,
    level: p.level,
    industrialLevel: industrialLevelOf(p),
    buildingLevel: p.buildingLevel,
    resources: { ...p.resources },
    jadeEarned: Math.round(p.jadeEarned),
    jadeSpent: Math.round(p.jadeSpent),
    jadeBalance: Math.round(p.jadeBalance),
    honour: Math.round(p.honour),
    troops: { ...p.troops },
    troopsTotal,
  };
}

function simulateArchetype(archetype: ArchetypeKey): {
  state: PlayerState;
  history: DaySnapshot[];
  maxResourceRatio: number;
} {
  const p = newPlayer(archetype);
  const history: DaySnapshot[] = [];
  let maxResourceRatio = 0;

  for (let day = 1; day <= SIM.DAYS; day++) {
    produceResources(p);
    earnCurrencies(p);

    p.hoursBank += buildHoursPerDay(p);
    progressStandardLevels(p, day);
    progressIndustrial(p, day);

    trainTroops(p);

    // Inflation check bookkeeping — stored / capacity ratio.
    const cap = storageCapacity(p.buildingLevel);
    for (const r of RESOURCES) {
      const ratio = p.resources[r] / cap;
      if (ratio > maxResourceRatio) maxResourceRatio = ratio;
    }

    history.push(snapshot(p, day));
  }

  return { state: p, history, maxResourceRatio };
}

// -----------------------------------------------------------------------------
// Reporting
// -----------------------------------------------------------------------------
function fmt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function printSummary(results: Record<ArchetypeKey, ReturnType<typeof simulateArchetype>>): void {
  console.log('\n' + chalk.bold.underline('Shadows of the Shogun — Economy Simulation'));
  console.log(chalk.gray(`Horizon: ${SIM.DAYS} days\n`));

  const milestones: { day: number }[] = [{ day: 30 }, { day: 45 }, { day: 60 }, { day: 90 }];
  const header = [
    'Archetype'.padEnd(24),
    'D30'.padStart(8),
    'D45'.padStart(8),
    'D60'.padStart(8),
    'D90'.padStart(8),
    'IndLvl'.padStart(8),
    'Troops'.padStart(10),
    'Jade(bal)'.padStart(12),
  ].join(' ');
  console.log(chalk.bold(header));
  console.log(chalk.gray('-'.repeat(header.length)));

  (Object.keys(results) as ArchetypeKey[]).forEach((k) => {
    const { history, state } = results[k];
    const at = (d: number) => history[Math.min(d, history.length) - 1];
    const levelStr = (d: number) => {
      const s = at(d);
      return s.industrialLevel > 0 ? `I${s.industrialLevel}` : `L${s.level}`;
    };
    const last = history[history.length - 1];
    const row = [
      ARCHETYPE_LABELS[k].padEnd(24),
      levelStr(30).padStart(8),
      levelStr(45).padStart(8),
      levelStr(60).padStart(8),
      levelStr(90).padStart(8),
      String(last.industrialLevel).padStart(8),
      fmt(last.troopsTotal).padStart(10),
      fmt(last.jadeBalance).padStart(12),
    ].join(' ');
    console.log(row);
  });
  console.log('');
}

async function writeCsv(
  results: Record<ArchetypeKey, ReturnType<typeof simulateArchetype>>,
): Promise<string> {
  const outDir = path.resolve(__dirname, '..', 'output');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'simulation_results.csv');

  const csvWriter = createObjectCsvWriter({
    path: outPath,
    header: [
      { id: 'day', title: 'day' },
      { id: 'archetype', title: 'archetype' },
      { id: 'level', title: 'level' },
      { id: 'industrialLevel', title: 'industrial_level' },
      { id: 'buildingLevel', title: 'building_level' },
      { id: 'rice', title: 'rice' },
      { id: 'wood', title: 'wood' },
      { id: 'stone', title: 'stone' },
      { id: 'iron', title: 'iron' },
      { id: 'charcoal', title: 'charcoal' },
      { id: 'catalyst', title: 'catalyst' },
      { id: 'jadeEarned', title: 'jade_earned' },
      { id: 'jadeSpent', title: 'jade_spent' },
      { id: 'jadeBalance', title: 'jade_balance' },
      { id: 'honour', title: 'honour' },
      { id: 'samurai', title: 'samurai_guard' },
      { id: 'yumi', title: 'yumi_archers' },
      { id: 'komainu', title: 'komainu_riders' },
      { id: 'troopsTotal', title: 'troops_total' },
    ],
  });

  const records: any[] = [];
  (Object.keys(results) as ArchetypeKey[]).forEach((k) => {
    results[k].history.forEach((s) => {
      records.push({
        day: s.day,
        archetype: ARCHETYPE_LABELS[s.archetype],
        level: s.level,
        industrialLevel: s.industrialLevel,
        buildingLevel: s.buildingLevel,
        rice: Math.round(s.resources.RICE),
        wood: Math.round(s.resources.WOOD),
        stone: Math.round(s.resources.STONE),
        iron: Math.round(s.resources.IRON),
        charcoal: Math.round(s.resources.CHARCOAL),
        catalyst: Math.round(s.resources.CATALYST),
        jadeEarned: s.jadeEarned,
        jadeSpent: s.jadeSpent,
        jadeBalance: s.jadeBalance,
        honour: s.honour,
        samurai: s.troops.SAMURAI_GUARD,
        yumi: s.troops.YUMI_ARCHERS,
        komainu: s.troops.KOMAINU_RIDERS,
        troopsTotal: s.troopsTotal,
      });
    });
  });

  await csvWriter.writeRecords(records);
  return outPath;
}

// -----------------------------------------------------------------------------
// Balance tests (CI gate)
// -----------------------------------------------------------------------------
interface BalanceTest {
  name: string;
  passed: boolean;
  detail: string;
}

function dayReachedLevel(state: PlayerState, level: number): number | null {
  return state.dayReachedLevel[level] ?? null;
}
function dayReachedIndustrial(state: PlayerState, level: number): number | null {
  return state.dayReachedIndustrial[level] ?? null;
}

function runBalanceTests(
  results: Record<ArchetypeKey, ReturnType<typeof simulateArchetype>>,
): BalanceTest[] {
  const f2p = results.F2P.state;
  const light = results.LIGHT.state;
  const heavy = results.HEAVY.state;

  const tests: BalanceTest[] = [];

  const f2pL20 = dayReachedLevel(f2p, 20);
  tests.push({
    name: `F2P reaches Level 20 by day ${TARGETS.F2P_LEVEL_20_BY_DAY}`,
    passed: f2pL20 !== null && f2pL20 <= TARGETS.F2P_LEVEL_20_BY_DAY,
    detail: f2pL20 ? `reached on day ${f2pL20}` : 'never reached',
  });

  const f2pL30 = dayReachedLevel(f2p, 30);
  tests.push({
    name: `F2P reaches Level 30 by day ${TARGETS.F2P_LEVEL_30_BY_DAY}`,
    passed: f2pL30 !== null && f2pL30 <= TARGETS.F2P_LEVEL_30_BY_DAY,
    detail: f2pL30 ? `reached on day ${f2pL30}` : 'never reached',
  });

  const lightL30 = dayReachedLevel(light, 30);
  tests.push({
    name: `Light spender reaches Level 30 by day ${TARGETS.LIGHT_LEVEL_30_BY_DAY}`,
    passed: lightL30 !== null && lightL30 <= TARGETS.LIGHT_LEVEL_30_BY_DAY,
    detail: lightL30 ? `reached on day ${lightL30}` : 'never reached',
  });

  const heavyI2 = dayReachedIndustrial(heavy, 2);
  tests.push({
    name: `Heavy spender reaches Industrial 2 by day ${TARGETS.HEAVY_INDUSTRIAL_2_BY_DAY}`,
    passed: heavyI2 !== null && heavyI2 <= TARGETS.HEAVY_INDUSTRIAL_2_BY_DAY,
    detail: heavyI2 ? `reached on day ${heavyI2}` : 'never reached',
  });

  const heroCost = JADE.PREMIUM_HERO_COST;
  tests.push({
    name: `F2P earns enough Jade for 1 premium hero per season (${heroCost} jade)`,
    passed: f2p.jadeBalance >= heroCost,
    detail: `F2P jade balance after ${SIM.SEASON_DAYS}d = ${Math.round(f2p.jadeBalance)}`,
  });

  const worstRatio = Math.max(
    results.F2P.maxResourceRatio,
    results.LIGHT.maxResourceRatio,
    results.HEAVY.maxResourceRatio,
  );
  tests.push({
    name: `No resource exceeds ${STORAGE.INFLATION_MULTIPLIER_LIMIT}x storage capacity (inflation check)`,
    passed: worstRatio <= STORAGE.INFLATION_MULTIPLIER_LIMIT,
    detail: `worst stored/capacity ratio = ${worstRatio.toFixed(2)}x`,
  });

  return tests;
}

function printBalanceTests(tests: BalanceTest[]): boolean {
  console.log(chalk.bold.underline('Balance validation'));
  let allPass = true;
  for (const t of tests) {
    const mark = t.passed ? chalk.green('✓ PASS') : chalk.red('✗ FAIL');
    if (!t.passed) allPass = false;
    console.log(`  ${mark}  ${t.name}  ${chalk.gray(`(${t.detail})`)}`);
  }
  console.log('');
  return allPass;
}

// -----------------------------------------------------------------------------
// Entry point
// -----------------------------------------------------------------------------
async function main(): Promise<void> {
  const results: Record<ArchetypeKey, ReturnType<typeof simulateArchetype>> = {
    F2P: simulateArchetype('F2P'),
    LIGHT: simulateArchetype('LIGHT'),
    HEAVY: simulateArchetype('HEAVY'),
  };

  printSummary(results);
  const csvPath = await writeCsv(results);
  console.log(chalk.gray(`CSV written to ${csvPath}\n`));

  const tests = runBalanceTests(results);
  const allPass = printBalanceTests(tests);

  if (!allPass) {
    console.log(chalk.red.bold('Balance validation FAILED — see failures above.'));
    process.exit(1);
  }
  console.log(chalk.green.bold('All balance tests passed.'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
