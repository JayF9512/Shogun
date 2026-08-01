import { Region } from '../types';

/** Four launch regions (spec §45). */
export const regions: Region[] = [
  {
    key: 'sakura_plains',
    name: 'Sakura Plains',
    order: 1,
    recommendedLevel: 1,
    terrain: 'PLAIN',
    description: 'Rolling grasslands beneath perpetual blossom — the starting cradle of every clan.',
  },
  {
    key: 'iron_mountains',
    name: 'Iron Mountains',
    order: 2,
    recommendedLevel: 10,
    terrain: 'MOUNTAIN',
    description: 'Jagged peaks rich in iron and stone, guarded by bandit strongholds.',
  },
  {
    key: 'mistwood_province',
    name: 'Mistwood Province',
    order: 3,
    recommendedLevel: 18,
    terrain: 'FOREST',
    description: 'Fog-shrouded forests where shrines and Yokai hide among ancient cedars.',
  },
  {
    key: 'spirit_marshes',
    name: 'Spirit Marshes',
    order: 4,
    recommendedLevel: 26,
    terrain: 'MARSH',
    description: 'Corrupted wetlands near the broken seal — the heart of the Crimson Eclipse.',
  },
];
