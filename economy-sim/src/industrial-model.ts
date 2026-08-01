/**
 * industrial-model.ts — Shadows of the Shogun
 * -----------------------------------------------------------------------------
 * Models the Industrial Ascension track (spec §10–§15).
 *
 * After reaching standard Level 30 and passing the ascension gate, a player
 * enters Industrial 1 (I1). Each Industrial level I1..I10 is composed of 5
 * private sub-stages (X.1 .. X.5). Completing X.5 rolls the public Industrial
 * level to X+1. Each sub-stage costs Catalyst + time.
 *
 * All numbers are data-driven from balance-config-style constants declared
 * here, so timelines can be re-tuned without touching simulation logic.
 */

export const INDUSTRIAL = {
  MAX_LEVEL: 10,
  SUB_STAGES_PER_LEVEL: 5,
  /** Catalyst required for sub-stage s of Industrial level L. */
  CATALYST_COST_BASE: 4_000,
  CATALYST_COST_GROWTH_PER_LEVEL: 1.6, // per Industrial major level
  CATALYST_COST_GROWTH_PER_SUBSTAGE: 1.15, // within a level
  /** Time (hours) for sub-stage s of Industrial level L. */
  TIME_BASE_HOURS: 18,
  TIME_GROWTH_PER_LEVEL: 1.35,
  TIME_GROWTH_PER_SUBSTAGE: 1.1,
};

export interface IndustrialStage {
  majorLevel: number; // 1..10
  subStage: number; // 1..5
  catalystCost: number;
  timeHours: number;
}

/** Catalyst cost for a specific Industrial sub-stage. */
export function catalystCost(majorLevel: number, subStage: number): number {
  return Math.round(
    INDUSTRIAL.CATALYST_COST_BASE *
      Math.pow(INDUSTRIAL.CATALYST_COST_GROWTH_PER_LEVEL, majorLevel - 1) *
      Math.pow(INDUSTRIAL.CATALYST_COST_GROWTH_PER_SUBSTAGE, subStage - 1),
  );
}

/** Time (hours) for a specific Industrial sub-stage. */
export function stageTimeHours(majorLevel: number, subStage: number): number {
  return (
    INDUSTRIAL.TIME_BASE_HOURS *
    Math.pow(INDUSTRIAL.TIME_GROWTH_PER_LEVEL, majorLevel - 1) *
    Math.pow(INDUSTRIAL.TIME_GROWTH_PER_SUBSTAGE, subStage - 1)
  );
}

/** Ordered list of every sub-stage from I1.1 up to (and including) target. */
export function stagesUpTo(targetMajorLevel: number): IndustrialStage[] {
  const stages: IndustrialStage[] = [];
  for (let L = 1; L <= Math.min(targetMajorLevel, INDUSTRIAL.MAX_LEVEL); L++) {
    for (let s = 1; s <= INDUSTRIAL.SUB_STAGES_PER_LEVEL; s++) {
      stages.push({
        majorLevel: L,
        subStage: s,
        catalystCost: catalystCost(L, s),
        timeHours: stageTimeHours(L, s),
      });
    }
  }
  return stages;
}

/**
 * The public Industrial level reached after completing `stagesCompleted`
 * sub-stages starting from I1.1. Completing all 5 sub-stages of level L
 * yields public level L (and unlocks work on L+1).
 */
export function publicLevelFromStages(stagesCompleted: number): number {
  return Math.min(
    INDUSTRIAL.MAX_LEVEL,
    Math.floor(stagesCompleted / INDUSTRIAL.SUB_STAGES_PER_LEVEL),
  );
}

export interface TimelineResult {
  days: number;
  reached: boolean;
  bottleneck: 'TIME' | 'CATALYST';
}

/**
 * Estimate days to reach a target Industrial major level given a daily
 * Catalyst budget and a daily industrial build-hour budget. Pure/deterministic.
 */
export function timelineToIndustrialLevel(params: {
  targetMajorLevel: number;
  catalystPerDay: number;
  buildHoursPerDay: number;
}): TimelineResult {
  const stages = stagesUpTo(params.targetMajorLevel);
  let catalystBank = 0;
  let hoursBank = 0;
  let days = 0;
  let stageIdx = 0;
  let bottleneck: 'TIME' | 'CATALYST' = 'TIME';

  // Cap the horizon so a starved F2P timeline terminates instead of looping.
  const MAX_DAYS = 100_000;
  while (stageIdx < stages.length && days < MAX_DAYS) {
    days += 1;
    catalystBank += params.catalystPerDay;
    hoursBank += params.buildHoursPerDay;

    // Complete as many sequential sub-stages as both budgets allow today.
    // eslint-disable-next-line no-constant-condition
    while (stageIdx < stages.length) {
      const st = stages[stageIdx];
      if (catalystBank >= st.catalystCost && hoursBank >= st.timeHours) {
        catalystBank -= st.catalystCost;
        hoursBank -= st.timeHours;
        stageIdx += 1;
      } else {
        bottleneck = catalystBank < st.catalystCost ? 'CATALYST' : 'TIME';
        break;
      }
    }
  }

  return {
    days: stageIdx >= stages.length ? days : Infinity,
    reached: stageIdx >= stages.length,
    bottleneck,
  };
}
