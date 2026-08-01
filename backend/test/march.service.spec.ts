import { MarchService, BASE_SPEED, KOMAINU_SPEED_BONUS } from '../src/march/march.service';

describe('MarchService — speed & travel time', () => {
  it('uses base speed of 100 tiles/hr with no bonuses', () => {
    expect(MarchService.speed({ hasKomainu: false })).toBe(BASE_SPEED);
  });

  it('adds +30% speed when Komainu Riders are present', () => {
    expect(MarchService.speed({ hasKomainu: true })).toBeCloseTo(BASE_SPEED * (1 + KOMAINU_SPEED_BONUS));
  });

  it('stacks hero march bonus additively with the Komainu bonus', () => {
    const speed = MarchService.speed({ hasKomainu: true, heroMarchBonus: 0.2 });
    expect(speed).toBeCloseTo(100 * (1 + 0.3 + 0.2));
  });

  it('computes euclidean distance', () => {
    expect(MarchService.distance(0, 0, 3, 4)).toBe(5);
  });

  it('computes travel time = distance / speed', () => {
    // 100 tiles at 100 tiles/hr = 1 hour = 3600s
    expect(MarchService.travelTimeSeconds(100, { hasKomainu: false })).toBeCloseTo(3600);
    // With Komainu (130 tiles/hr), same distance is faster
    const faster = MarchService.travelTimeSeconds(100, { hasKomainu: true });
    expect(faster).toBeLessThan(3600);
    expect(faster).toBeCloseTo((100 / 130) * 3600);
  });

  it('caps simultaneous marches at floor(level/5) within [1,5]', () => {
    expect(MarchService.maxSimultaneousMarches(1)).toBe(1);
    expect(MarchService.maxSimultaneousMarches(4)).toBe(1);
    expect(MarchService.maxSimultaneousMarches(10)).toBe(2);
    expect(MarchService.maxSimultaneousMarches(25)).toBe(5);
    expect(MarchService.maxSimultaneousMarches(100)).toBe(5);
  });
});
