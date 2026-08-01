import { Pet } from '../types';

/**
 * Three starter pets for Season Zero (spec §42). Shiro is free-obtainable to
 * satisfy the rule that every season includes a free pet. White Fox evolution
 * branches follow spec §43.
 */
export const pets: Pet[] = [
  {
    key: 'shiro_white_fox',
    name: 'Shiro',
    species: 'White Fox',
    rarity: 'RARE',
    category: 'SETTLEMENT_COMPANION',
    freeObtainable: true,
    passiveBonusType: 'RICE_PRODUCTION_PCT',
    passiveBonusValue: 0.05,
    evolutions: [
      { stage: 1, name: 'Shrine Guardian', requires: { bond: 100, currency: 'HONOUR', currencyAmount: 500 }, bonusType: 'SETTLEMENT_DEFENSE_PCT', bonusValue: 0.05 },
      { stage: 2, name: 'Trickster Kitsune', requires: { bond: 300, currency: 'HONOUR', currencyAmount: 1500 }, bonusType: 'RESOURCE_GATHER_PCT', bonusValue: 0.1 },
      { stage: 3, name: 'Shadow Fox', requires: { bond: 600, currency: 'FEAR', currencyAmount: 2000 }, bonusType: 'MARCH_STEALTH_PCT', bonusValue: 0.12 },
    ],
  },
  {
    key: 'momo_spirit_cat',
    name: 'Momo',
    species: 'Spirit Cat',
    rarity: 'RARE',
    category: 'SPECIALIST_ECONOMIC',
    freeObtainable: false,
    passiveBonusType: 'SILVER_INCOME_PCT',
    passiveBonusValue: 0.06,
    evolutions: [
      { stage: 1, name: 'Fortune Cat', requires: { bond: 100, currency: 'HONOUR', currencyAmount: 500 }, bonusType: 'MARKET_YIELD_PCT', bonusValue: 0.08 },
      { stage: 2, name: 'Nekomata', requires: { bond: 300, currency: 'FEAR', currencyAmount: 1200 }, bonusType: 'TAX_INCOME_PCT', bonusValue: 0.12 },
    ],
  },
  {
    key: 'taro_tanuki',
    name: 'Taro',
    species: 'Tanuki',
    rarity: 'COMMON',
    category: 'COMBAT_COMPANION',
    freeObtainable: false,
    passiveBonusType: 'TROOP_TRAINING_SPEED_PCT',
    passiveBonusValue: 0.05,
    evolutions: [
      { stage: 1, name: 'Trickster Tanuki', requires: { bond: 100, currency: 'HONOUR', currencyAmount: 400 }, bonusType: 'TRAINING_COST_REDUCTION_PCT', bonusValue: 0.06 },
      { stage: 2, name: 'War Tanuki', requires: { bond: 300, currency: 'FEAR', currencyAmount: 1000 }, bonusType: 'TROOP_ATTACK_PCT', bonusValue: 0.08 },
    ],
  },
];
