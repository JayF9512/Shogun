import { EconomyService, BASE_PRODUCTION } from '../src/economy/economy.service';

describe('EconomyService — production math', () => {
  it('has correct base rates per spec', () => {
    expect(BASE_PRODUCTION.RICE).toBe(100);
    expect(BASE_PRODUCTION.WOOD).toBe(80);
    expect(BASE_PRODUCTION.STONE).toBe(60);
    expect(BASE_PRODUCTION.IRON).toBe(40);
    expect(BASE_PRODUCTION.CHARCOAL).toBe(30);
    expect(BASE_PRODUCTION.CATALYST).toBe(0);
  });

  it('applies +10% production per building level', () => {
    expect(EconomyService.levelMultiplier(1)).toBe(1);
    expect(EconomyService.levelMultiplier(11)).toBeCloseTo(2); // +100% at level 11
    expect(EconomyService.productionPerHour('RICE', 1)).toBe(100);
    expect(EconomyService.productionPerHour('RICE', 11)).toBeCloseTo(200);
  });

  it('keeps CATALYST at zero until Industrial 1', () => {
    expect(EconomyService.productionPerHour('CATALYST', 20, 0)).toBe(0);
    expect(EconomyService.productionPerHour('CATALYST', 1, 1)).toBeGreaterThan(0);
  });

  it('accrues resources proportional to elapsed time', () => {
    // 100/hr for 30 minutes => +50
    const next = EconomyService.tick({
      productionPerHour: 100,
      elapsedSeconds: 1800,
      current: 0,
      capacity: 1000,
    });
    expect(next).toBeCloseTo(50);
  });

  it('clamps production to storage capacity', () => {
    const next = EconomyService.tick({
      productionPerHour: 100,
      elapsedSeconds: 3600 * 100,
      current: 950,
      capacity: 1000,
    });
    expect(next).toBe(1000);
  });
});
