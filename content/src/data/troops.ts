import { Troop, TroopClassKey as TroopClass } from '../types';

/**
 * Troop tiers 1-10 across the three launch classes (spec §30). Higher tiers are
 * gated by settlement level and released gradually. Season Zero ships tiers 1-6
 * as trainable; 7-10 are defined for the progression curve and later unlock.
 */
const TIER_NAMES = [
  'Refugee Militia',
  'Trained Retainers',
  'Clan Soldiers',
  'Veteran Warriors',
  'Elite Guard',
  'Daimyo Guard',
  'Shogunate Guard',
  'Ascended Guard',
  'Industrial Guard',
  'Mythic Guard',
];

// Per-class stat archetype: [attack, defense, health, speed] at tier 1.
// Samurai > Komainu > Yumi > Samurai counter triangle (spec combat rules).
const CLASS_BASE: Record<
  TroopClass,
  { name: string; attack: number; defense: number; health: number; speed: number }
> = {
  SAMURAI_GUARD: { name: 'Samurai', attack: 12, defense: 14, health: 120, speed: 100 },
  YUMI_ARCHERS: { name: 'Yumi', attack: 16, defense: 7, health: 85, speed: 100 },
  KOMAINU_RIDERS: { name: 'Komainu Rider', attack: 14, defense: 10, health: 100, speed: 135 },
};

const CLASSES: TroopClass[] = ['SAMURAI_GUARD', 'YUMI_ARCHERS', 'KOMAINU_RIDERS'];

// Stat growth ~1.35x per tier; unlock every ~3 levels.
function buildTroops(): Troop[] {
  const out: Troop[] = [];
  for (const cls of CLASSES) {
    const base = CLASS_BASE[cls];
    for (let tier = 1; tier <= 10; tier++) {
      const g = Math.pow(1.35, tier - 1);
      out.push({
        key: `${cls.toLowerCase()}_t${tier}`,
        name: `${TIER_NAMES[tier - 1]} ${base.name}`,
        troopClass: cls,
        tier,
        attack: Math.round(base.attack * g),
        defense: Math.round(base.defense * g),
        health: Math.round(base.health * g),
        speed: base.speed,
        trainCost: {
          rice: Math.round(50 * g),
          silver: Math.round(30 * g),
        },
        trainSeconds: Math.round(30 * Math.pow(1.25, tier - 1)),
        unlockLevel: Math.min(30, 1 + (tier - 1) * 3),
      });
    }
  }
  return out;
}

export const troops: Troop[] = buildTroops();
