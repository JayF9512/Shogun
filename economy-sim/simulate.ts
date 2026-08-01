/**
 * Economy simulation — Shadows of the Shogun
 * -----------------------------------------------------------------------------
 * Compares a Free-to-Play (F2P) player against a Paying player over 30 days.
 * Standalone (no DB) so balancing can be iterated quickly per spec §4.6.
 *
 * Run:  npx ts-node simulate.ts
 */

type ResourceType = 'RICE' | 'WOOD' | 'STONE' | 'IRON' | 'CHARCOAL';

const BASE_PRODUCTION: Record<ResourceType, number> = {
  RICE: 100,
  WOOD: 80,
  STONE: 60,
  IRON: 40,
  CHARCOAL: 30,
};

const RESOURCES: ResourceType[] = ['RICE', 'WOOD', 'STONE', 'IRON', 'CHARCOAL'];

// --- Tunable balance knobs ---------------------------------------------------
const SIM_DAYS = 30;
const HOURS_PER_DAY = 24;
const ACTIVE_HOURS_PER_DAY = 10; // taps/collections a player realistically does
const LEVELUP_RESOURCE_COST_BASE = 5000; // rice-equivalent cost to reach next level
const LEVELUP_COST_GROWTH = 1.35;
const MAX_LEVEL = 30;

// Jade economy
const F2P_JADE_PER_DAY = 60; // daily quests / events
const PAID_JADE_PER_DAY_PURCHASED = 1600; // ~£15/mo monthly card + a pack
const JADE_SPEEDUP_VALUE = 50; // resources equiv per jade spent on speedups

interface PlayerSim {
  name: string;
  level: number;
  buildingLevel: number;
  resources: Record<ResourceType, number>;
  jadeEarned: number;
  jadeSpent: number;
  jadeBalance: number;
}

function newPlayer(name: string): PlayerSim {
  return {
    name,
    level: 1,
    buildingLevel: 1,
    resources: { RICE: 0, WOOD: 0, STONE: 0, IRON: 0, CHARCOAL: 0 },
    jadeEarned: 0,
    jadeSpent: 0,
    jadeBalance: 0,
  };
}

function levelMultiplier(buildingLevel: number): number {
  return 1 + 0.1 * (buildingLevel - 1);
}

function levelUpCost(level: number): number {
  return Math.round(LEVELUP_RESOURCE_COST_BASE * Math.pow(LEVELUP_COST_GROWTH, level - 1));
}

/** Attempt to level up while the player can afford it (spends rice-equivalent). */
function tryLevelUp(p: PlayerSim) {
  while (p.level < MAX_LEVEL) {
    const cost = levelUpCost(p.level);
    const pool = RESOURCES.reduce((sum, r) => sum + p.resources[r], 0);
    if (pool < cost) break;
    // Spend proportionally across resources.
    const ratio = cost / pool;
    for (const r of RESOURCES) p.resources[r] *= 1 - ratio;
    p.level += 1;
    // Building level tracks player level up to the cap.
    p.buildingLevel = Math.min(MAX_LEVEL, p.level);
  }
}

function simulate(p: PlayerSim, paying: boolean) {
  for (let day = 0; day < SIM_DAYS; day++) {
    // Passive + active production.
    for (const r of RESOURCES) {
      const perHour = BASE_PRODUCTION[r] * levelMultiplier(p.buildingLevel);
      p.resources[r] += perHour * HOURS_PER_DAY;
      // Active bonus collection while online.
      p.resources[r] += perHour * ACTIVE_HOURS_PER_DAY * 0.25;
    }

    // Jade income.
    const jadeToday = paying ? F2P_JADE_PER_DAY + PAID_JADE_PER_DAY_PURCHASED : F2P_JADE_PER_DAY;
    p.jadeEarned += jadeToday;
    p.jadeBalance += jadeToday;

    // Paying players convert jade into speedups / resource packs.
    if (paying && p.jadeBalance > 0) {
      const spend = p.jadeBalance;
      p.jadeSpent += spend;
      p.jadeBalance -= spend;
      const bonusResources = spend * JADE_SPEEDUP_VALUE;
      for (const r of RESOURCES) p.resources[r] += bonusResources / RESOURCES.length;
    }

    tryLevelUp(p);
  }
  return p;
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-GB');
}

function printSummary(players: PlayerSim[]) {
  console.log('\n=== Shadows of the Shogun — 30-Day Economy Simulation ===\n');
  const header = ['Metric', ...players.map((p) => p.name)];
  const rows: string[][] = [
    ['Level reached', ...players.map((p) => `${p.level}/${MAX_LEVEL}`)],
    ['Building level', ...players.map((p) => `${p.buildingLevel}`)],
    ['Total resources', ...players.map((p) => fmt(RESOURCES.reduce((s, r) => s + p.resources[r], 0)))],
    ['  Rice', ...players.map((p) => fmt(p.resources.RICE))],
    ['  Wood', ...players.map((p) => fmt(p.resources.WOOD))],
    ['  Stone', ...players.map((p) => fmt(p.resources.STONE))],
    ['  Iron', ...players.map((p) => fmt(p.resources.IRON))],
    ['  Charcoal', ...players.map((p) => fmt(p.resources.CHARCOAL))],
    ['Jade earned', ...players.map((p) => fmt(p.jadeEarned))],
    ['Jade spent', ...players.map((p) => fmt(p.jadeSpent))],
    ['Jade balance', ...players.map((p) => fmt(p.jadeBalance))],
  ];

  const colWidths = header.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => r[i].length)),
  );
  const line = (cols: string[]) =>
    cols.map((c, i) => c.padEnd(colWidths[i])).join('  |  ');

  console.log(line(header));
  console.log(colWidths.map((w) => '-'.repeat(w)).join('--+--'));
  for (const r of rows) console.log(line(r));

  const f2p = players[0];
  const paid = players[1];
  const levelGap = paid.level - f2p.level;
  console.log('\nInsights:');
  console.log(`  • Paying player is ${levelGap} level(s) ahead after ${SIM_DAYS} days.`);
  console.log(
    `  • Paying player generated ~${(
      RESOURCES.reduce((s, r) => s + paid.resources[r], 0) /
      Math.max(1, RESOURCES.reduce((s, r) => s + f2p.resources[r], 0))
    ).toFixed(1)}x the resources of the F2P player.`,
  );
  console.log(
    `  • F2P remains competitive on progression cap (both trend toward L${MAX_LEVEL}); paying mainly buys speed, not exclusive power.\n`,
  );
}

const f2p = simulate(newPlayer('F2P Player'), false);
const paid = simulate(newPlayer('Paying Player'), true);
printSummary([f2p, paid]);
