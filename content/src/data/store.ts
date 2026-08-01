import { StoreProduct, SeasonPassTier } from '../types';

/**
 * Season Zero store catalogue (spec §88) and Crimson Eclipse season pass.
 * Free/paid paths ship together (spec §118.15). Prices in USD cents.
 */
export const storeProducts: StoreProduct[] = [
  // Currency packs
  { sku: 'jade_small', name: 'Handful of Jade', category: 'CURRENCY', priceUsdCents: 499, jadeGranted: 500, active: true },
  { sku: 'jade_medium', name: 'Pouch of Jade', category: 'CURRENCY', priceUsdCents: 999, jadeGranted: 1100, active: true },
  { sku: 'jade_large', name: 'Chest of Jade', category: 'CURRENCY', priceUsdCents: 4999, jadeGranted: 6000, active: true },
  { sku: 'jade_huge', name: 'Vault of Jade', category: 'CURRENCY', priceUsdCents: 9999, jadeGranted: 13000, active: true },
  // Heroes
  { sku: 'hero_nasu_no_yoichi', name: 'Nasu no Yoichi Recruit', category: 'HERO', priceUsdCents: 1999, jadeGranted: 0, contents: { heroKey_nasu_no_yoichi: 1 }, active: true },
  { sku: 'hero_hattori_hanzo', name: 'Hattori Hanzo Recruit', category: 'HERO', priceUsdCents: 2999, jadeGranted: 0, contents: { heroKey_hattori_hanzo: 1 }, active: true },
  // Pets
  { sku: 'pet_momo_bundle', name: 'Momo Spirit Cat Bundle', category: 'PET', priceUsdCents: 1499, jadeGranted: 200, contents: { petKey_momo_spirit_cat: 1 }, active: true },
  // Progression packs (spec §71 progression packs)
  { sku: 'pack_starter', name: "Warlord's Starter Pack", category: 'PROGRESSION', priceUsdCents: 499, jadeGranted: 300, contents: { RICE: 5000, WOOD: 5000, speedups_60m: 5 }, active: true },
  { sku: 'pack_builder', name: 'Master Builder Pack', category: 'PROGRESSION', priceUsdCents: 1999, jadeGranted: 800, contents: { STONE: 20000, IRON: 15000, speedups_8h: 6 }, active: true },
  // Battle pass
  { sku: 'pass_crimson_eclipse', name: 'Crimson Eclipse Pass', category: 'PASS', priceUsdCents: 999, jadeGranted: 0, contents: { seasonPass: 1 }, active: true },
  // Cosmetic
  { sku: 'skin_crimson_tenshu', name: 'Crimson Tenshu Skin', category: 'COSMETIC', priceUsdCents: 799, jadeGranted: 0, contents: { skin_crimson_tenshu: 1 }, active: true },
];

/** Crimson Eclipse season pass — 30 tiers, free + premium tracks. */
export const seasonPass: SeasonPassTier[] = Array.from({ length: 30 }, (_, i): SeasonPassTier => {
  const tier = i + 1;
  const freeReward: Record<string, number> =
    tier % 5 === 0 ? { JADE: 50, RICE: 1000 * tier } : { HONOUR: 100 * tier };
  const premiumReward: Record<string, number> =
    tier % 10 === 0 ? { JADE: 300, heroShards: 20 } : { JADE: 80, RICE: 2000 * tier };
  return { tier, requiredPoints: tier * 1000, freeReward, premiumReward };
});
