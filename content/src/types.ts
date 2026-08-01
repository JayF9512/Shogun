/**
 * Season Zero content — canonical, data-driven schemas (spec §4.6).
 *
 * Every piece of launch content is validated against these zod schemas so the
 * backend seed and the client can trust the shape at build time and runtime.
 * Balancing values live in the data files, never in engine code.
 */
import { z } from 'zod';

// Aligned with backend Prisma enums (schema.prisma).
export const HeroRarity = z.enum(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']);
export const TroopClass = z.enum(['SAMURAI_GUARD', 'YUMI_ARCHERS', 'KOMAINU_RIDERS']);
export const ResourceType = z.enum(['RICE', 'WOOD', 'STONE', 'IRON', 'CHARCOAL', 'CATALYST']);
export const CurrencyType = z.enum(['JADE', 'HONOUR', 'FEAR', 'CORRUPTION']);

// Hero classes per spec §39.
export const HeroClass = z.enum([
  'SAMURAI',
  'RONIN',
  'YUMI_MASTER',
  'RIDER_COMMANDER',
  'SHINOBI',
  'ONMYOJI',
  'SHRINE_MAIDEN',
  'WARRIOR_MONK',
  'ASHIGARU_COMMANDER',
  'ENGINEER',
  'YOKAI_BLOODED',
  'DIPLOMAT',
]);

export const HeroSkillSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  kind: z.enum(['ACTIVE', 'PASSIVE', 'ULTIMATE', 'ARMY']),
  maxLevel: z.number().int().min(1).max(10),
  effectType: z.string().min(1),
  effectValue: z.number(),
});

export const HeroSchema = z.object({
  key: z.string().regex(/^[a-z0-9_]+$/),
  name: z.string().min(1),
  title: z.string().min(1),
  heroClass: HeroClass,
  rarity: HeroRarity,
  troopAffinity: TroopClass,
  baseAttack: z.number().int().positive(),
  baseDefense: z.number().int().positive(),
  marchSkillBonus: z.number().min(0).max(0.5), // fractional (0.1 = +10%)
  acquisition: z.enum(['CAMPAIGN', 'STORE', 'EVENT', 'PASS', 'STARTER']),
  // Exactly four standard skills, one ultimate, one army skill (spec §39).
  skills: z.array(HeroSkillSchema).length(4),
  ultimate: HeroSkillSchema,
  armySkill: HeroSkillSchema,
});

export const PetEvolutionSchema = z.object({
  stage: z.number().int().min(1).max(3),
  name: z.string().min(1),
  requires: z.object({
    bond: z.number().int().min(0),
    currency: CurrencyType.optional(),
    currencyAmount: z.number().int().min(0).optional(),
  }),
  bonusType: z.string().min(1),
  bonusValue: z.number(),
});

export const PetSchema = z.object({
  key: z.string().regex(/^[a-z0-9_]+$/),
  name: z.string().min(1),
  species: z.string().min(1),
  rarity: HeroRarity,
  category: z.enum([
    'SETTLEMENT_COMPANION',
    'SPECIALIST_ECONOMIC',
    'COMBAT_COMPANION',
    'EVOLVING_YOKAI',
    'MYTHIC_GUARDIAN',
  ]),
  freeObtainable: z.boolean(), // spec §42: every season has a free pet
  passiveBonusType: z.string().min(1),
  passiveBonusValue: z.number(),
  evolutions: z.array(PetEvolutionSchema).min(1).max(3),
});

export const TroopSchema = z.object({
  key: z.string().regex(/^[a-z0-9_]+$/),
  name: z.string().min(1),
  troopClass: TroopClass,
  tier: z.number().int().min(1).max(10),
  attack: z.number().int().positive(),
  defense: z.number().int().positive(),
  health: z.number().int().positive(),
  speed: z.number().positive(),
  trainCost: z.object({ rice: z.number().int().min(0), silver: z.number().int().min(0) }),
  trainSeconds: z.number().int().positive(),
  unlockLevel: z.number().int().min(1).max(30),
});

// A building's per-level curve is generated from a base + growth factor so the
// full 1-30 table is data-driven yet compact.
export const BuildingSchema = z.object({
  key: z.string().regex(/^[a-z0-9_]+$/),
  name: z.string().min(1),
  category: z.enum(['CENTRAL', 'PRODUCTION', 'CIVILIAN', 'MILITARY', 'SPIRITUAL', 'SEASONAL']),
  maxLevel: z.number().int().min(1).max(30),
  producesResource: ResourceType.nullable(),
  baseProduction: z.number().min(0),
  requiredForAscension: z.boolean(),
  costCurve: z.object({
    baseRice: z.number().min(0),
    baseWood: z.number().min(0),
    baseStone: z.number().min(0),
    baseIron: z.number().min(0),
    growth: z.number().min(1), // per-level multiplier
  }),
  timeCurve: z.object({ baseSeconds: z.number().int().min(0), growth: z.number().min(1) }),
});

export const RegionSchema = z.object({
  key: z.string().regex(/^[a-z0-9_]+$/),
  name: z.string().min(1),
  order: z.number().int().min(1),
  recommendedLevel: z.number().int().min(1).max(30),
  terrain: z.string().min(1),
  description: z.string().min(1),
});

export const CampaignStageSchema = z.object({
  key: z.string().regex(/^[a-z0-9_]+$/),
  chapter: z.number().int().min(1),
  order: z.number().int().min(1),
  name: z.string().min(1),
  regionKey: z.string().min(1),
  requiredLevel: z.number().int().min(1).max(30),
  enemyClass: TroopClass,
  enemyPower: z.number().int().positive(),
  firstClearRewards: z.record(z.string(), z.number()),
  narrative: z.string().min(1),
});

export const TutorialStepSchema = z.object({
  order: z.number().int().min(1),
  key: z.string().regex(/^[a-z0-9_]+$/),
  title: z.string().min(1),
  instruction: z.string().min(1),
  triggersSystem: z.string().min(1),
  grantsReward: z.record(z.string(), z.number()).optional(),
});

export const RallyConfigSchema = z.object({
  maxParticipants: z.number().int().positive(),
  minLeaderLevel: z.number().int().min(1).max(30),
  countdownSeconds: z.number().int().positive(),
  autoKickIdleSeconds: z.number().int().positive(),
  formations: z.array(z.string().min(1)).min(1),
  visibleRepresentatives: z.object({
    verySmall: z.tuple([z.number(), z.number()]),
    small: z.tuple([z.number(), z.number()]),
    medium: z.tuple([z.number(), z.number()]),
    large: z.tuple([z.number(), z.number()]),
    rally: z.tuple([z.number(), z.number()]),
  }),
});

export const StoreProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(['CURRENCY', 'HERO', 'PET', 'PROGRESSION', 'PASS', 'COSMETIC', 'BUNDLE']),
  priceUsdCents: z.number().int().min(0),
  jadeGranted: z.number().int().min(0),
  contents: z.record(z.string(), z.number()).optional(),
  active: z.boolean(),
});

export const SeasonPassTierSchema = z.object({
  tier: z.number().int().min(1),
  requiredPoints: z.number().int().min(0),
  freeReward: z.record(z.string(), z.number()),
  premiumReward: z.record(z.string(), z.number()),
});

export const SeasonSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  order: z.number().int().min(0),
  industrialCap: z.number().int().min(0), // 0 = none (Season Zero)
  standardLevelCap: z.number().int().min(1).max(30),
  catalyst: z.string().nullable(),
  purpose: z.string().min(1),
});

export type TroopClassKey = z.infer<typeof TroopClass>;
export type HeroRarityKey = z.infer<typeof HeroRarity>;
export type ResourceTypeKey = z.infer<typeof ResourceType>;
export type CurrencyTypeKey = z.infer<typeof CurrencyType>;
export type HeroClassKey = z.infer<typeof HeroClass>;

export type Hero = z.infer<typeof HeroSchema>;
export type Pet = z.infer<typeof PetSchema>;
export type Troop = z.infer<typeof TroopSchema>;
export type Building = z.infer<typeof BuildingSchema>;
export type Region = z.infer<typeof RegionSchema>;
export type CampaignStage = z.infer<typeof CampaignStageSchema>;
export type TutorialStep = z.infer<typeof TutorialStepSchema>;
export type RallyConfig = z.infer<typeof RallyConfigSchema>;
export type StoreProduct = z.infer<typeof StoreProductSchema>;
export type SeasonPassTier = z.infer<typeof SeasonPassTierSchema>;
export type SeasonMeta = z.infer<typeof SeasonSchema>;
