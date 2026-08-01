import { CampaignStage, TroopClassKey as TroopClass } from '../types';

/**
 * Season Zero campaign — "The Crimson Eclipse" (spec §71).
 * Six chapters mapped to the Levels 1-30 bands (spec §9), each with PvE stages
 * whose enemy class rotates through the counter triangle so players learn it.
 * The finale repairs the seal beneath the settlement (spec §71 finale).
 */

const CHAPTERS: {
  chapter: number;
  region: string;
  baseLevel: number;
  title: string;
  enemyClasses: TroopClass[];
}[] = [
  { chapter: 1, region: 'sakura_plains', baseLevel: 1, title: 'Ashes of the Village', enemyClasses: ['SAMURAI_GUARD', 'YUMI_ARCHERS', 'KOMAINU_RIDERS'] },
  { chapter: 2, region: 'sakura_plains', baseLevel: 6, title: 'The First Banner', enemyClasses: ['YUMI_ARCHERS', 'KOMAINU_RIDERS', 'SAMURAI_GUARD'] },
  { chapter: 3, region: 'iron_mountains', baseLevel: 11, title: 'Blades in the Peaks', enemyClasses: ['KOMAINU_RIDERS', 'SAMURAI_GUARD', 'YUMI_ARCHERS'] },
  { chapter: 4, region: 'mistwood_province', baseLevel: 16, title: 'Whispers in the Mist', enemyClasses: ['SAMURAI_GUARD', 'YUMI_ARCHERS', 'KOMAINU_RIDERS'] },
  { chapter: 5, region: 'spirit_marshes', baseLevel: 22, title: 'The Corrupted Fen', enemyClasses: ['YUMI_ARCHERS', 'KOMAINU_RIDERS', 'SAMURAI_GUARD'] },
  { chapter: 6, region: 'spirit_marshes', baseLevel: 27, title: 'Repair the Seal', enemyClasses: ['KOMAINU_RIDERS', 'SAMURAI_GUARD', 'YUMI_ARCHERS'] },
];

const STAGE_NARRATIVE: Record<number, string[]> = {
  1: [
    'You return to a village of ash. Survivors gather behind the ruined Tenshu.',
    'Bandits test your fledgling guard at the broken gate.',
    'The first hero pledges their blade to your cause.',
  ],
  2: [
    'A rival clan raises its banner over the plains.',
    'Yumi levies harass your supply lines.',
    'You claim the first watchtower and light the beacon.',
  ],
  3: [
    'The Iron Mountains bristle with mounted raiders.',
    'A Komainu warband blocks the mountain pass.',
    'You seize the iron mine that will arm your host.',
  ],
  4: [
    'Fog swallows the road into Mistwood.',
    'Shrine guardians mistake you for the enemy.',
    'An Onmyoji reveals the eclipse was no accident.',
  ],
  5: [
    'Corruption seeps from the marsh into your ranks.',
    'Yokai-touched soldiers rise against you.',
    'You find the fractured seal at the marsh heart.',
  ],
  6: [
    'The architects of the eclipse make their stand.',
    'The final guardian bars the seal chamber.',
    'You repair the seal — and learn the eclipse was deliberate.',
  ],
};

function buildCampaign(): CampaignStage[] {
  const out: CampaignStage[] = [];
  for (const ch of CHAPTERS) {
    for (let i = 0; i < 3; i++) {
      const order = i + 1;
      const level = Math.min(30, ch.baseLevel + i * 2);
      const powerBase = 500 * ch.chapter;
      out.push({
        key: `s0_c${ch.chapter}_s${order}`,
        chapter: ch.chapter,
        order,
        name: `${ch.title} ${order}`,
        regionKey: ch.region,
        requiredLevel: level,
        enemyClass: ch.enemyClasses[i % 3],
        enemyPower: Math.round(powerBase * Math.pow(1.4, i)),
        firstClearRewards: {
          HONOUR: 100 * ch.chapter,
          RICE: 500 * ch.chapter,
          heroShards: ch.chapter >= 3 && i === 2 ? 10 : 0,
        },
        narrative: STAGE_NARRATIVE[ch.chapter][i],
      });
    }
  }
  return out;
}

export const campaign: CampaignStage[] = buildCampaign();
