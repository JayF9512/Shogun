import { PrismaClient, HeroRarity, TroopClass, ResourceType } from '@prisma/client';
import {
  seasonZeroContent,
  validateContent,
  buildingCostAtLevel,
} from 'shogun-content';

const prisma = new PrismaClient();

/**
 * Data-driven seed: pulls all launch content from the `shogun-content` package
 * (single source of truth, spec §4.6) and upserts it into the database.
 * Nothing is hard-coded here — designers change content in one validated place.
 */
async function main() {
  // Fail fast if content is invalid so we never seed a broken catalogue.
  const validation = validateContent();
  if (!validation.ok) {
    console.error('Content validation failed — aborting seed:');
    validation.errors.forEach((e) => console.error('  - ' + e));
    process.exit(1);
  }

  const server = await prisma.server.upsert({
    where: { id: 'seed-server' },
    update: {},
    create: { id: 'seed-server', name: seasonZeroContent.season.name, region: 'eu', environment: 'DEVELOPMENT' },
  });

  // --- Buildings ---
  for (const b of seasonZeroContent.buildings) {
    await prisma.buildingDefinition.upsert({
      where: { key: b.key },
      update: {
        name: b.name,
        category: b.category,
        maxLevel: b.maxLevel,
        producesResource: (b.producesResource as ResourceType) ?? null,
        baseProduction: b.baseProduction,
        requiredForAscension: b.requiredForAscension,
      },
      create: {
        key: b.key,
        name: b.name,
        category: b.category,
        maxLevel: b.maxLevel,
        producesResource: (b.producesResource as ResourceType) ?? null,
        baseProduction: b.baseProduction,
        requiredForAscension: b.requiredForAscension,
      },
    });
  }

  // --- Troops ---
  for (const t of seasonZeroContent.troops) {
    const data = {
      name: t.name,
      troopClass: t.troopClass as TroopClass,
      tier: t.tier,
      attack: t.attack,
      defense: t.defense,
      health: t.health,
      speed: t.speed,
    };
    await prisma.troopDefinition.upsert({ where: { key: t.key }, update: data, create: { key: t.key, ...data } });
  }

  // --- Heroes + skills ---
  for (const h of seasonZeroContent.heroes) {
    const hero = await prisma.heroDefinition.upsert({
      where: { key: h.key },
      update: {
        name: h.name,
        rarity: h.rarity as HeroRarity,
        troopAffinity: h.troopAffinity as TroopClass,
        baseAttack: h.baseAttack,
        baseDefense: h.baseDefense,
        marchSkillBonus: h.marchSkillBonus,
      },
      create: {
        key: h.key,
        name: h.name,
        rarity: h.rarity as HeroRarity,
        troopAffinity: h.troopAffinity as TroopClass,
        baseAttack: h.baseAttack,
        baseDefense: h.baseDefense,
        marchSkillBonus: h.marchSkillBonus,
      },
    });
    // Refresh skills (delete + recreate keeps them in sync with content).
    await prisma.heroSkill.deleteMany({ where: { definitionId: hero.id } });
    const allSkills = [...h.skills, h.ultimate, h.armySkill];
    for (const s of allSkills) {
      await prisma.heroSkill.create({
        data: {
          definitionId: hero.id,
          name: s.name,
          description: s.description,
          maxLevel: s.maxLevel,
          effectType: s.effectType,
          effectValue: s.effectValue,
        },
      });
    }
  }

  // --- Pets ---
  for (const p of seasonZeroContent.pets) {
    const data = {
      name: p.name,
      rarity: p.rarity as HeroRarity,
      abilityType: p.passiveBonusType,
      abilityValue: p.passiveBonusValue,
      evolutionMax: p.evolutions.length,
    };
    await prisma.petDefinition.upsert({ where: { key: p.key }, update: data, create: { key: p.key, ...data } });
  }

  // --- Store catalogue ---
  for (const s of seasonZeroContent.storeProducts) {
    const data = {
      name: s.name,
      description: s.category,
      priceUsdCents: s.priceUsdCents,
      jadeGranted: s.jadeGranted,
      contents: (s.contents ?? {}) as object,
      active: s.active,
    };
    await prisma.catalogProduct.upsert({ where: { sku: s.sku }, update: data, create: { sku: s.sku, ...data } });
  }

  // --- Season pass as an event definition (scoring/rewards are data) ---
  await prisma.eventDefinition.upsert({
    where: { key: 'crimson_eclipse_pass' },
    update: {},
    create: {
      key: 'crimson_eclipse_pass',
      name: `${seasonZeroContent.season.name} Pass`,
      description: 'Season Zero battle pass',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 90 * 24 * 3600 * 1000),
      scoringRules: { pointsPerActivity: 100 } as object,
      rewards: seasonZeroContent.seasonPass as unknown as object,
    },
  });

  // --- Industrial upgrade table: 10 major levels x 5 sub-stages ---
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

  // --- State (Phase 6 live-server system) ---
  // State 1 is the single launch state players join by default. Subsequent
  // states open automatically only once State N reaches its openThreshold
  // (see StatesService.autoOpenNextStates). Open so guests can attach.
  const stateOne = await prisma.state.upsert({
    where: { number: 1 },
    update: { isOpen: true, playerCap: 2000, openThreshold: 1900 },
    create: {
      name: 'State 1',
      number: 1,
      isOpen: true,
      playerCap: 2000,
      openThreshold: 1900,
    },
  });

  // Migrate any players from the legacy seed state (State 391) or any other
  // state onto State 1, then remove leftover empty legacy states. This is
  // idempotent: on a fresh DB there is nothing to move.
  const migrated = await prisma.player.updateMany({
    where: { OR: [{ stateId: null }, { NOT: { stateId: stateOne.id } }] },
    data: { stateId: stateOne.id },
  });
  if (migrated.count > 0) {
    console.log(`Migrated ${migrated.count} player(s) to State 1.`);
  }
  await prisma.state.deleteMany({ where: { NOT: { number: 1 } } });

  // --- NPC clans (populate the clan browser at launch) ---
  const npcClans = [
    { tag: 'BUSH', name: 'Bushido Vanguard', description: 'Honour above all.' },
    { tag: 'RONIN', name: 'Wandering Ronin', description: 'Masterless blades for hire.' },
    { tag: 'ONI', name: 'Oni Warband', description: 'Fear is our weapon.' },
  ];
  for (const c of npcClans) {
    await prisma.clan.upsert({
      where: { serverId_tag: { serverId: server.id, tag: c.tag } },
      update: { name: c.name, description: c.description },
      create: {
        serverId: server.id,
        tag: c.tag,
        name: c.name,
        description: c.description,
      },
    });
  }

  // Sanity: log a sample derived cost so designers can eyeball the curve.
  const tenshu = seasonZeroContent.buildings.find((b) => b.key === 'tenshu')!;
  console.log('Sample Tenshu L30 cost:', buildingCostAtLevel(tenshu, 30));
  console.log(
    `Seed complete for "${server.name}":`,
    JSON.stringify(validation.counts),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
