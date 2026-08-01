import { Controller, Get, Param } from '@nestjs/common';
import { ContentService } from './content.service';

/**
 * Read-only content catalogue endpoints (spec §71 Season Zero content).
 * Prefixed with `/content`. Client fetches definitions; state stays server-side.
 */
@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get()
  getAll() {
    return this.content.getSeasonZero();
  }

  @Get('heroes')
  getHeroes() {
    return this.content.getHeroes();
  }

  @Get('heroes/:key')
  getHero(@Param('key') key: string) {
    return this.content.getHero(key);
  }

  @Get('pets')
  getPets() {
    return this.content.getPets();
  }

  @Get('troops')
  getTroops() {
    return this.content.getTroops();
  }

  @Get('buildings')
  getBuildings() {
    return this.content.getBuildings();
  }

  @Get('buildings/:key/curve')
  getBuildingCurve(@Param('key') key: string) {
    return this.content.getBuildingCurve(key);
  }

  @Get('regions')
  getRegions() {
    return this.content.getRegions();
  }

  @Get('campaign')
  getCampaign() {
    return this.content.getCampaign();
  }

  @Get('tutorial')
  getTutorial() {
    return this.content.getTutorial();
  }

  @Get('store')
  getStore() {
    return this.content.getStore();
  }

  @Get('rally')
  getRally() {
    return this.content.getRally();
  }
}
