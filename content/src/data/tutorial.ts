import { TutorialStep } from '../types';

/**
 * First-session tutorial flow (spec §9 Levels 1-5, critical for retention).
 * Each step triggers a real server-authoritative system so the tutorial is not
 * a scripted illusion. Rewards bootstrap the early economy.
 */
export const tutorial: TutorialStep[] = [
  { order: 1, key: 'arrive_ruined_village', title: 'A Village in Ashes', instruction: 'Survey your ruined mountain village.', triggersSystem: 'SETTLEMENT_VIEW' },
  { order: 2, key: 'repair_tenshu', title: 'Raise the Tenshu', instruction: 'Begin repairs on the Tenshu keep.', triggersSystem: 'CONSTRUCTION', grantsReward: { RICE: 500, WOOD: 500 } },
  { order: 3, key: 'build_rice_terraces', title: 'Feed Your People', instruction: 'Construct Rice Terraces to produce food.', triggersSystem: 'CONSTRUCTION' },
  { order: 4, key: 'collect_resources', title: 'Gather the Harvest', instruction: 'Collect produced resources from your buildings.', triggersSystem: 'ECONOMY_TICK', grantsReward: { RICE: 300 } },
  { order: 5, key: 'recruit_first_hero', title: 'A Blade Pledged', instruction: 'Recruit your first hero, Miko Hina.', triggersSystem: 'HERO_GRANT', grantsReward: { heroKey_shrine_maiden_hina: 1 } },
  { order: 6, key: 'train_samurai', title: 'Form the Guard', instruction: 'Train your first Samurai Guard.', triggersSystem: 'TROOP_TRAINING', grantsReward: { RICE: 200, SILVER: 200 } },
  { order: 7, key: 'first_campaign_battle', title: 'Repel the Bandits', instruction: 'Clear the first campaign stage.', triggersSystem: 'COMBAT', grantsReward: { HONOUR: 100 } },
  { order: 8, key: 'open_world_map', title: 'The Wider World', instruction: 'Open the world map and scout a resource node.', triggersSystem: 'WORLD_MAP' },
  { order: 9, key: 'adopt_first_pet', title: 'A Loyal Companion', instruction: 'Adopt Shiro the White Fox.', triggersSystem: 'PET_GRANT', grantsReward: { petKey_shiro_white_fox: 1 } },
  { order: 10, key: 'join_clan', title: 'Strength in Numbers', instruction: 'Join or found a clan.', triggersSystem: 'CLAN', grantsReward: { JADE: 50 } },
];
