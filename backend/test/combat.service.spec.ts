import { CombatService, Stack, COUNTER_BONUS } from '../src/combat/combat.service';

describe('CombatService — three-class counter system', () => {
  it('encodes the rock-paper-scissors counter chain', () => {
    // Samurai > Komainu > Yumi > Samurai
    expect(CombatService.counteredClass('SAMURAI_GUARD')).toBe('KOMAINU_RIDERS');
    expect(CombatService.counteredClass('KOMAINU_RIDERS')).toBe('YUMI_ARCHERS');
    expect(CombatService.counteredClass('YUMI_ARCHERS')).toBe('SAMURAI_GUARD');
  });

  it('recognises counter advantage in both directions', () => {
    expect(CombatService.hasCounterAdvantage('SAMURAI_GUARD', 'KOMAINU_RIDERS')).toBe(true);
    expect(CombatService.hasCounterAdvantage('KOMAINU_RIDERS', 'SAMURAI_GUARD')).toBe(false);
    expect(CombatService.hasCounterAdvantage('YUMI_ARCHERS', 'SAMURAI_GUARD')).toBe(true);
  });

  it('applies the +25% counter bonus to stack power', () => {
    const stack: Stack = { troopClass: 'SAMURAI_GUARD', count: 100, attack: 10 };
    const vsCountered = CombatService.stackPower(stack, 'KOMAINU_RIDERS');
    const vsNeutral = CombatService.stackPower(stack, 'YUMI_ARCHERS'); // yumi counters samurai, not countered
    expect(vsCountered).toBe(100 * 10 * (1 + COUNTER_BONUS));
    expect(vsNeutral).toBe(100 * 10);
    expect(vsCountered).toBeGreaterThan(vsNeutral);
  });

  it('applies hero bonus multiplicatively', () => {
    const stack: Stack = { troopClass: 'YUMI_ARCHERS', count: 50, attack: 8, heroBonus: 0.2 };
    const power = CombatService.stackPower(stack, 'KOMAINU_RIDERS'); // neutral matchup
    expect(power).toBeCloseTo(50 * 8 * 1.2);
  });

  it('a countering army beats an equal-sized countered army', () => {
    const attacker: Stack[] = [{ troopClass: 'SAMURAI_GUARD', count: 1000, attack: 10 }];
    const defender: Stack[] = [{ troopClass: 'KOMAINU_RIDERS', count: 1000, attack: 10 }];
    const outcome = CombatService.resolve(attacker, defender);
    expect(outcome.winner).toBe('ATTACKER');
    expect(outcome.attacker.power).toBeGreaterThan(outcome.defender.power);
    // loser takes proportionally more casualties
    expect(outcome.defender.losses).toBeGreaterThan(outcome.attacker.losses);
  });

  it('produces a draw for identical armies', () => {
    const a: Stack[] = [{ troopClass: 'SAMURAI_GUARD', count: 500, attack: 10 }];
    const b: Stack[] = [{ troopClass: 'SAMURAI_GUARD', count: 500, attack: 10 }];
    const outcome = CombatService.resolve(a, b);
    expect(outcome.winner).toBe('DRAW');
    expect(outcome.attacker.power).toBe(outcome.defender.power);
  });
});
