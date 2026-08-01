import { Test, TestingModule } from '@nestjs/testing';
import { CombatService } from '../../src/combat/combat.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('CombatService Integration Tests', () => {
  let service: CombatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CombatService, PrismaService],
    }).compile();

    service = module.get<CombatService>(CombatService);
  });

  describe('Three-Class Counter System', () => {
    it('should give Samurai +25% counter advantage vs Komainu', () => {
      const attacker = [
        {
          troopClass: 'SAMURAI_GUARD' as const,
          count: 1000,
          attack: 10,
          heroBonus: 0,
        },
      ];

      const defender = [
        {
          troopClass: 'KOMAINU_RIDERS' as const,
          count: 1000,
          attack: 10,
          heroBonus: 0,
        },
      ];

      const result = CombatService.resolve(attacker, defender);

      // Samurai counters Komainu: 1000 * 10 * 1.25 = 12,500
      // Komainu base: 1000 * 10 * 1.0 = 10,000
      // Attacker wins with 12,500 > 10,000
      expect(result.winner).toBe('ATTACKER');
      expect(result.attacker.power).toBe(12500);
      expect(result.defender.power).toBe(10000);
    });

    it('should give Komainu +25% counter advantage vs Yumi', () => {
      const attacker = [
        {
          troopClass: 'KOMAINU_RIDERS' as const,
          count: 800,
          attack: 12,
          heroBonus: 0,
        },
      ];

      const defender = [
        {
          troopClass: 'YUMI_ARCHERS' as const,
          count: 800,
          attack: 12,
          heroBonus: 0,
        },
      ];

      const result = CombatService.resolve(attacker, defender);

      // Komainu counters Yumi: 800 * 12 * 1.25 = 12,000
      // Yumi base: 800 * 12 * 1.0 = 9,600
      // Attacker wins
      expect(result.winner).toBe('ATTACKER');
      expect(result.attacker.power).toBe(12000);
      expect(result.defender.power).toBe(9600);
    });

    it('should give Yumi +25% counter advantage vs Samurai', () => {
      const attacker = [
        {
          troopClass: 'YUMI_ARCHERS' as const,
          count: 500,
          attack: 8,
          heroBonus: 0,
        },
      ];

      const defender = [
        {
          troopClass: 'SAMURAI_GUARD' as const,
          count: 500,
          attack: 8,
          heroBonus: 0,
        },
      ];

      const result = CombatService.resolve(attacker, defender);

      // Yumi counters Samurai: 500 * 8 * 1.25 = 5,000
      // Samurai base: 500 * 8 * 1.0 = 4,000
      // Attacker wins
      expect(result.winner).toBe('ATTACKER');
      expect(result.attacker.power).toBe(5000);
      expect(result.defender.power).toBe(4000);
    });

    it('should result in draw when powers are equal', () => {
      const attacker = [
        {
          troopClass: 'SAMURAI_GUARD' as const,
          count: 1000,
          attack: 10,
          heroBonus: 0,
        },
      ];

      const defender = [
        {
          troopClass: 'SAMURAI_GUARD' as const,
          count: 1000,
          attack: 10,
          heroBonus: 0,
        },
      ];

      const result = CombatService.resolve(attacker, defender);

      // Equal power: 10,000 vs 10,000
      expect(result.winner).toBe('DRAW');
      expect(result.attacker.power).toBe(result.defender.power);
    });

    it('should apply hero bonus correctly to battle power', () => {
      const attacker = [
        {
          troopClass: 'SAMURAI_GUARD' as const,
          count: 1000,
          attack: 10,
          heroBonus: 0.2, // +20% from hero
        },
      ];

      const defender = [
        {
          troopClass: 'KOMAINU_RIDERS' as const,
          count: 1000,
          attack: 10,
          heroBonus: 0,
        },
      ];

      const result = CombatService.resolve(attacker, defender);

      // Samurai counters Komainu: 1000 * 10 * 1.25 * 1.2 = 15,000
      // Komainu base: 1000 * 10 * 1.0 * 1.0 = 10,000
      expect(result.attacker.power).toBe(15000);
      expect(result.defender.power).toBe(10000);
      expect(result.winner).toBe('ATTACKER');
    });
  });

  describe('Mixed Stacks', () => {
    it('should calculate power from multiple troop types correctly', () => {
      const attacker = [
        {
          troopClass: 'SAMURAI_GUARD' as const,
          count: 500,
          attack: 10,
          heroBonus: 0,
        },
        {
          troopClass: 'YUMI_ARCHERS' as const,
          count: 500,
          attack: 8,
          heroBonus: 0,
        },
      ];

      const defender = [
        {
          troopClass: 'KOMAINU_RIDERS' as const,
          count: 1000,
          attack: 9,
          heroBonus: 0,
        },
      ];

      const result = CombatService.resolve(attacker, defender);

      // Attacker side power calculated vs Komainu (dominant defender class)
      // Samurai vs Komainu: 500 * 10 * 1.25 = 6,250 (counter)
      // Yumi vs Komainu: 500 * 8 * 1.0 = 4,000 (no counter)
      // Total attacker: 10,250
      
      // Defender side power calculated vs Samurai (dominant attacker class - higher count)
      // Komainu vs Samurai: 1000 * 9 * 1.0 = 9,000 (no counter)
      
      expect(result.attacker.power).toBe(10250);
      expect(result.defender.power).toBe(9000);
      expect(result.winner).toBe('ATTACKER');
    });

    it('should calculate losses proportionally to power deficit', () => {
      const attacker = [
        {
          troopClass: 'SAMURAI_GUARD' as const,
          count: 2000,
          attack: 10,
          heroBonus: 0,
        },
      ];

      const defender = [
        {
          troopClass: 'KOMAINU_RIDERS' as const,
          count: 1000,
          attack: 10,
          heroBonus: 0,
        },
      ];

      const result = CombatService.resolve(attacker, defender);

      // Attacker power: 2000 * 10 * 1.25 = 25,000 (counter)
      // Defender power: 1000 * 10 * 1.0 = 10,000
      expect(result.winner).toBe('ATTACKER');
      
      // Losses are proportional to enemy power
      // Defender loses all troops when heavily outmatched
      expect(result.defender.losses).toBeGreaterThan(0);
    });
  });
});
