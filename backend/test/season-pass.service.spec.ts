import { SeasonPassService } from '../src/season/season-pass.service';
import { seasonPass } from 'shogun-content';

/**
 * Pure unit tests for the Season Pass tier math. The points→tier mapping is the
 * core server-authoritative rule and must be deterministic (spec §71), so it is
 * tested in isolation from Prisma I/O.
 */
describe('SeasonPassService.currentTier', () => {
  it('is tier 0 below the first threshold', () => {
    expect(SeasonPassService.currentTier(0)).toBe(0);
    expect(SeasonPassService.currentTier(seasonPass[0].requiredPoints - 1)).toBe(0);
  });

  it('reaches tier 1 exactly at its required points', () => {
    expect(SeasonPassService.currentTier(seasonPass[0].requiredPoints)).toBe(1);
  });

  it('maps mid-ladder points to the highest fully-earned tier', () => {
    const t5 = seasonPass[4]; // tier 5
    expect(SeasonPassService.currentTier(t5.requiredPoints)).toBe(5);
    expect(SeasonPassService.currentTier(t5.requiredPoints + 1)).toBe(5);
  });

  it('caps at the maximum tier no matter how many points', () => {
    const max = seasonPass.length;
    const huge = seasonPass[max - 1].requiredPoints * 10;
    expect(SeasonPassService.currentTier(huge)).toBe(max);
  });

  it('is monotonic across the whole ladder', () => {
    let prev = 0;
    for (const t of seasonPass) {
      const got = SeasonPassService.currentTier(t.requiredPoints);
      expect(got).toBeGreaterThanOrEqual(prev);
      prev = got;
    }
  });
});
