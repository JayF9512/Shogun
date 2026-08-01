import { Injectable, NotFoundException } from '@nestjs/common';
import {
  seasonZeroContent,
  validateContent,
  buildingCostAtLevel,
  Hero,
  Building,
} from 'shogun-content';

/**
 * Serves the read-only Season Zero content catalogue from the shared
 * `shogun-content` package. The catalogue is the single source of truth for
 * launch content (spec §4.6); the client renders it, the server owns state.
 */
@Injectable()
export class ContentService {
  /** Full catalogue plus a validation summary. */
  getSeasonZero() {
    return { ...seasonZeroContent, validation: validateContent() };
  }

  getHeroes(): Hero[] {
    return seasonZeroContent.heroes;
  }

  getHero(key: string): Hero {
    const hero = seasonZeroContent.heroes.find((h) => h.key === key);
    if (!hero) throw new NotFoundException(`Unknown hero "${key}"`);
    return hero;
  }

  getPets() {
    return seasonZeroContent.pets;
  }

  getTroops() {
    return seasonZeroContent.troops;
  }

  getBuildings(): Building[] {
    return seasonZeroContent.buildings;
  }

  /** Deterministic cost/time/production for a building at a target level. */
  getBuildingCurve(key: string) {
    const building = seasonZeroContent.buildings.find((b) => b.key === key);
    if (!building) throw new NotFoundException(`Unknown building "${key}"`);
    const levels = [] as ReturnType<typeof buildingCostAtLevel>[];
    for (let lvl = 1; lvl <= building.maxLevel; lvl++) {
      levels.push(buildingCostAtLevel(building, lvl));
    }
    return { key, name: building.name, maxLevel: building.maxLevel, levels };
  }

  getRegions() {
    return seasonZeroContent.regions;
  }

  getCampaign() {
    return seasonZeroContent.campaign;
  }

  getTutorial() {
    return seasonZeroContent.tutorial;
  }

  getStore() {
    return { products: seasonZeroContent.storeProducts, pass: seasonZeroContent.seasonPass };
  }

  getRally() {
    return seasonZeroContent.rally;
  }
}
