import { Building, ResourceTypeKey as ResourceType } from '../types';

/**
 * Launch building catalogue (spec §33) with data-driven L1-30 cost/time curves.
 * The full per-level table is derived from base + growth so designers tune two
 * numbers instead of 30 rows per building. Ascension-required buildings flagged
 * per spec §10.1.
 */

type Def = {
  key: string;
  name: string;
  category: Building['category'];
  producesResource?: ResourceType;
  baseProduction?: number;
  requiredForAscension?: boolean;
  // cost/time overrides; defaults applied below.
  costGrowth?: number;
  timeGrowth?: number;
  baseSeconds?: number;
};

const DEFS: Def[] = [
  // Central progression
  { key: 'tenshu', name: 'Tenshu', category: 'CENTRAL', requiredForAscension: true, costGrowth: 1.28, baseSeconds: 120 },
  { key: 'research_hall', name: 'Research Hall', category: 'CENTRAL', requiredForAscension: true },
  { key: 'messenger_post', name: 'Messenger Post', category: 'CENTRAL' },
  { key: 'seasonal_district', name: 'Seasonal District', category: 'SEASONAL', requiredForAscension: true },
  { key: 'legacy_archive', name: 'Legacy Archive', category: 'CENTRAL' },
  // Production
  { key: 'rice_terraces', name: 'Rice Terraces', category: 'PRODUCTION', producesResource: 'RICE', baseProduction: 100 },
  { key: 'bamboo_grove', name: 'Bamboo Grove', category: 'PRODUCTION', producesResource: 'WOOD', baseProduction: 80 },
  { key: 'stone_quarry', name: 'Stone Quarry', category: 'PRODUCTION', producesResource: 'STONE', baseProduction: 70 },
  { key: 'iron_mine', name: 'Iron Mine', category: 'PRODUCTION', producesResource: 'IRON', baseProduction: 60 },
  { key: 'charcoal_kiln', name: 'Charcoal Kiln', category: 'PRODUCTION', producesResource: 'CHARCOAL', baseProduction: 50 },
  { key: 'fishing_dock', name: 'Fishing Dock', category: 'PRODUCTION', producesResource: 'RICE', baseProduction: 40 },
  { key: 'silver_market', name: 'Silver Market', category: 'PRODUCTION' },
  // Civilian support
  { key: 'residential_district', name: 'Residential District', category: 'CIVILIAN' },
  { key: 'kitchen', name: 'Kitchen', category: 'CIVILIAN' },
  { key: 'herbalist_hut', name: 'Herbalist Hut', category: 'CIVILIAN' },
  { key: 'tea_house', name: 'Tea House', category: 'CIVILIAN' },
  { key: 'storehouse', name: 'Storehouse', category: 'CIVILIAN' },
  { key: 'tailor', name: 'Tailor', category: 'CIVILIAN' },
  { key: 'water_well', name: 'Water Well', category: 'CIVILIAN' },
  // Military
  { key: 'samurai_dojo', name: 'Samurai Dojo', category: 'MILITARY', requiredForAscension: true },
  { key: 'yumi_range', name: 'Yumi Range', category: 'MILITARY' },
  { key: 'guardian_stables', name: 'Guardian Stables', category: 'MILITARY' },
  { key: 'drill_yard', name: 'Drill Yard', category: 'MILITARY' },
  { key: 'field_hospital', name: 'Field Hospital', category: 'MILITARY', requiredForAscension: true },
  { key: 'watchtower', name: 'Watchtower', category: 'MILITARY' },
  { key: 'castle_walls', name: 'Castle Walls', category: 'MILITARY' },
  { key: 'war_room', name: 'War Room', category: 'MILITARY' },
  // Spiritual and crafting
  { key: 'shrine', name: 'Shrine', category: 'SPIRITUAL' },
  { key: 'blacksmith', name: 'Blacksmith', category: 'SPIRITUAL' },
  { key: 'equipment_workshop', name: 'Equipment Workshop', category: 'SPIRITUAL' },
  { key: 'pet_garden', name: 'Pet Garden', category: 'SPIRITUAL' },
  { key: 'clan_hall', name: 'Clan Hall', category: 'SPIRITUAL' },
];

export const buildings: Building[] = DEFS.map((d) => ({
  key: d.key,
  name: d.name,
  category: d.category,
  maxLevel: 30,
  producesResource: d.producesResource ?? null,
  baseProduction: d.baseProduction ?? 0,
  requiredForAscension: d.requiredForAscension ?? false,
  costCurve: {
    baseRice: 200,
    baseWood: 150,
    baseStone: d.category === 'MILITARY' || d.category === 'CENTRAL' ? 120 : 60,
    baseIron: d.category === 'MILITARY' ? 80 : 30,
    growth: d.costGrowth ?? 1.25,
  },
  timeCurve: {
    baseSeconds: d.baseSeconds ?? 60,
    growth: d.timeGrowth ?? 1.22,
  },
}));

/** Deterministic helper: full cost/time for a given building at a target level. */
export function buildingCostAtLevel(b: Building, level: number) {
  const g = Math.pow(b.costCurve.growth, level - 1);
  return {
    rice: Math.round(b.costCurve.baseRice * g),
    wood: Math.round(b.costCurve.baseWood * g),
    stone: Math.round(b.costCurve.baseStone * g),
    iron: Math.round(b.costCurve.baseIron * g),
    seconds: Math.round(b.timeCurve.baseSeconds * Math.pow(b.timeCurve.growth, level - 1)),
    production: b.producesResource ? Math.round(b.baseProduction * (1 + 0.1 * (level - 1))) : 0,
  };
}
