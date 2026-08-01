import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Minimal data-driven seed: a server, base building/troop definitions and the
 * industrial upgrade cost table. Balancing values are data, not code (spec §4.6).
 */
async function main() {
  const server = await prisma.server.upsert({
    where: { id: 'seed-server' },
    update: {},
    create: { id: 'seed-server', name: 'Season Zero', region: 'eu', environment: 'DEVELOPMENT' },
  });

  const buildings = [
    { key: 'tenshu', name: 'Tenshu', category: 'SUPPORT', requiredForAscension: true },
    { key: 'research_hall', name: 'Research Hall', category: 'RESEARCH', requiredForAscension: true },
    { key: 'hospital', name: 'Hospital', category: 'SUPPORT', requiredForAscension: true },
    { key: 'barracks', name: 'Barracks', category: 'MILITARY', requiredForAscension: true },
    { key: 'rice_paddy', name: 'Rice Paddy', category: 'ECONOMY', producesResource: 'RICE' as const, baseProduction: 100 },
    { key: 'lumber_camp', name: 'Lumber Camp', category: 'ECONOMY', producesResource: 'WOOD' as const, baseProduction: 80 },
    { key: 'catalyst_forge', name: 'Catalyst Forge', category: 'ECONOMY', producesResource: 'CATALYST' as const, baseProduction: 20 },
  ];
  for (const b of buildings) {
    await prisma.buildingDefinition.upsert({ where: { key: b.key }, update: b, create: b });
  }

  const troops = [
    { key: 'samurai_t1', name: 'Ashigaru Samurai', troopClass: 'SAMURAI_GUARD' as const, attack: 10, defense: 12, health: 100 },
    { key: 'yumi_t1', name: 'Yumi Levy', troopClass: 'YUMI_ARCHERS' as const, attack: 12, defense: 6, health: 80 },
    { key: 'komainu_t1', name: 'Komainu Outrider', troopClass: 'KOMAINU_RIDERS' as const, attack: 11, defense: 8, health: 90, speed: 130 },
  ];
  for (const t of troops) {
    await prisma.troopDefinition.upsert({ where: { key: t.key }, update: t, create: t });
  }

  // Industrial upgrade table: 10 major levels x 5 sub-stages.
  for (let major = 1; major <= 10; major++) {
    for (let sub = 1; sub <= 5; sub++) {
      await prisma.industrialUpgradeDefinition.upsert({
        where: { majorLevel_subStage: { majorLevel: major, subStage: sub } },
        update: {},
        create: {
          majorLevel: major,
          subStage: sub,
          catalystCost: BigInt(1000 * major * sub),
          durationSec: 3600 * major,
          powerGain: 500 * major,
        },
      });
    }
  }

  console.log('Seed complete for server', server.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
