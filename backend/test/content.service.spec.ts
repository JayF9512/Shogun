import { NotFoundException } from '@nestjs/common';
import { ContentService } from '../src/content/content.service';

/**
 * Unit tests for the Content catalogue service. Pure — no database. Verifies the
 * backend correctly surfaces the shared `shogun-content` package and derives
 * building curves deterministically.
 */
describe('ContentService', () => {
  const service = new ContentService();

  it('returns the full Season Zero catalogue with a passing validation report', () => {
    const all = service.getSeasonZero();
    expect(all.validation.ok).toBe(true);
    expect(all.heroes).toHaveLength(12);
    expect(all.pets).toHaveLength(3);
    expect(all.regions).toHaveLength(4);
  });

  it('serves the 12 launch heroes and looks one up by key', () => {
    expect(service.getHeroes()).toHaveLength(12);
    const hero = service.getHero('takeda_shingen');
    expect(hero.name).toBe('Takeda Shingen');
    expect(hero.skills).toHaveLength(4);
  });

  it('throws NotFound for an unknown hero key', () => {
    expect(() => service.getHero('does_not_exist')).toThrow(NotFoundException);
  });

  it('derives a 30-level building curve that grows monotonically', () => {
    const curve = service.getBuildingCurve('tenshu');
    expect(curve.levels).toHaveLength(30);
    expect(curve.levels[29].rice).toBeGreaterThan(curve.levels[0].rice);
    expect(curve.levels[29].seconds).toBeGreaterThan(curve.levels[0].seconds);
  });

  it('throws NotFound for an unknown building curve', () => {
    expect(() => service.getBuildingCurve('nope')).toThrow(NotFoundException);
  });

  it('exposes store products and a 30-tier season pass', () => {
    const store = service.getStore();
    expect(store.products.length).toBeGreaterThan(0);
    expect(store.pass).toHaveLength(30);
  });

  it('exposes campaign, tutorial, regions and rally config', () => {
    expect(service.getCampaign()).toHaveLength(18);
    expect(service.getTutorial().length).toBeGreaterThan(0);
    expect(service.getRegions()).toHaveLength(4);
    expect(service.getRally().maxParticipants).toBeGreaterThan(0);
  });
});
