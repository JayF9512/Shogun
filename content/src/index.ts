/**
 * Season Zero content package — single source of truth for launch content.
 *
 * The backend seed and admin tooling import from here so game data lives in one
 * validated place (spec §4.6 data-driven balancing).
 */
import { z } from 'zod';
import {
  HeroSchema,
  PetSchema,
  TroopSchema,
  BuildingSchema,
  RegionSchema,
  CampaignStageSchema,
  TutorialStepSchema,
  RallyConfigSchema,
  StoreProductSchema,
  SeasonPassTierSchema,
  SeasonSchema,
} from './types';
import { heroes } from './data/heroes';
import { pets } from './data/pets';
import { troops } from './data/troops';
import { buildings, buildingCostAtLevel } from './data/buildings';
import { regions } from './data/regions';
import { campaign } from './data/campaign';
import { rallyConfig } from './data/rally';
import { storeProducts, seasonPass } from './data/store';
import { tutorial } from './data/tutorial';
import { seasonZero } from './data/season';

export * from './types';
export {
  heroes,
  pets,
  troops,
  buildings,
  buildingCostAtLevel,
  regions,
  campaign,
  rallyConfig,
  storeProducts,
  seasonPass,
  tutorial,
  seasonZero,
};

export const seasonZeroContent = {
  season: seasonZero,
  heroes,
  pets,
  troops,
  buildings,
  regions,
  campaign,
  rally: rallyConfig,
  storeProducts,
  seasonPass,
  tutorial,
};

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  counts: Record<string, number>;
}

/**
 * Validate every content collection against its zod schema plus cross-reference
 * integrity rules (unique keys, valid region/hero references). Returns a report
 * rather than throwing so callers (tests, CLI, seed) can decide how to react.
 */
export function validateContent(): ValidationResult {
  const errors: string[] = [];

  const check = <T>(label: string, schema: z.ZodType<T>, items: T[]) => {
    items.forEach((item, i) => {
      const r = schema.safeParse(item);
      if (!r.success) {
        errors.push(`${label}[${i}]: ${r.error.issues.map((x) => `${x.path.join('.')} ${x.message}`).join('; ')}`);
      }
    });
  };

  check('hero', HeroSchema, heroes);
  check('pet', PetSchema, pets);
  check('troop', TroopSchema, troops);
  check('building', BuildingSchema, buildings);
  check('region', RegionSchema, regions);
  check('campaignStage', CampaignStageSchema, campaign);
  check('tutorialStep', TutorialStepSchema, tutorial);
  check('storeProduct', StoreProductSchema, storeProducts);
  check('seasonPassTier', SeasonPassTierSchema, seasonPass);

  const rallyRes = RallyConfigSchema.safeParse(rallyConfig);
  if (!rallyRes.success) errors.push(`rallyConfig: ${rallyRes.error.message}`);
  const seasonRes = SeasonSchema.safeParse(seasonZero);
  if (!seasonRes.success) errors.push(`season: ${seasonRes.error.message}`);

  // --- Cross-reference & business rules ---
  const uniq = (label: string, keys: string[]) => {
    const seen = new Set<string>();
    for (const k of keys) {
      if (seen.has(k)) errors.push(`${label}: duplicate key "${k}"`);
      seen.add(k);
    }
  };
  uniq('hero', heroes.map((h) => h.key));
  uniq('pet', pets.map((p) => p.key));
  uniq('troop', troops.map((t) => t.key));
  uniq('building', buildings.map((b) => b.key));
  uniq('region', regions.map((r) => r.key));
  uniq('campaignStage', campaign.map((c) => c.key));
  uniq('storeProduct', storeProducts.map((s) => s.sku));

  // Exactly 12 launch heroes, 3 starter pets (spec §71).
  if (heroes.length !== 12) errors.push(`expected 12 launch heroes, found ${heroes.length}`);
  if (pets.length !== 3) errors.push(`expected 3 starter pets, found ${pets.length}`);
  if (regions.length !== 4) errors.push(`expected 4 launch regions, found ${regions.length}`);

  // At least one free-obtainable pet (spec §42).
  if (!pets.some((p) => p.freeObtainable)) errors.push('no free-obtainable pet (spec §42)');

  // Campaign stages must reference real regions.
  const regionKeys = new Set(regions.map((r) => r.key));
  for (const c of campaign) {
    if (!regionKeys.has(c.regionKey)) errors.push(`campaignStage ${c.key}: unknown region "${c.regionKey}"`);
  }

  // Store hero products must reference real heroes.
  const heroKeys = new Set(heroes.map((h) => h.key));
  for (const p of storeProducts.filter((s) => s.category === 'HERO')) {
    const referenced = Object.keys(p.contents ?? {}).find((k) => k.startsWith('heroKey_'));
    const key = referenced?.replace('heroKey_', '');
    if (!key || !heroKeys.has(key)) errors.push(`storeProduct ${p.sku}: references unknown hero "${key}"`);
  }

  // Every troop class is represented across heroes (playstyle coverage).
  const affinities = new Set(heroes.map((h) => h.troopAffinity));
  for (const cls of ['SAMURAI_GUARD', 'YUMI_ARCHERS', 'KOMAINU_RIDERS']) {
    if (!affinities.has(cls as never)) errors.push(`no hero with troop affinity ${cls}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    counts: {
      heroes: heroes.length,
      pets: pets.length,
      troops: troops.length,
      buildings: buildings.length,
      regions: regions.length,
      campaignStages: campaign.length,
      tutorialSteps: tutorial.length,
      storeProducts: storeProducts.length,
      seasonPassTiers: seasonPass.length,
    },
  };
}
