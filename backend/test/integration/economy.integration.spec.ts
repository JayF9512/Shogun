import { Test, TestingModule } from '@nestjs/testing';
import { EconomyService } from '../../src/economy/economy.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('EconomyService Integration Tests', () => {
  let service: EconomyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EconomyService, PrismaService],
    }).compile();

    service = module.get<EconomyService>(EconomyService);
  });

  describe('Resource Production Formulas', () => {
    it('should produce correct amounts per building level', () => {
      // Level 1 building: base * (1 + 0.1 * 0) = base * 1.0
      const level1Production = EconomyService.productionPerHour('RICE', 1, 0);
      expect(level1Production).toBe(100);

      // Level 5 building: base * (1 + 0.1 * 4) = base * 1.4
      const level5Production = EconomyService.productionPerHour('WOOD', 5, 0);
      expect(level5Production).toBe(80 * 1.4);

      // Level 10 building: base * (1 + 0.1 * 9) = base * 1.9
      const level10Production = EconomyService.productionPerHour('STONE', 10, 0);
      expect(level10Production).toBe(60 * 1.9);
    });

    it('should apply +10% multiplier per building level above 1', () => {
      const multiplier1 = EconomyService.levelMultiplier(1);
      expect(multiplier1).toBe(1.0);

      const multiplier10 = EconomyService.levelMultiplier(10);
      expect(multiplier10).toBeCloseTo(1.9, 10);

      const multiplier30 = EconomyService.levelMultiplier(30);
      expect(multiplier30).toBeCloseTo(3.9, 10);
    });

    it('should calculate tick correctly for 1-hour period', () => {
      const productionPerHour = EconomyService.productionPerHour('RICE', 1, 0);
      const newStock = EconomyService.tick({
        productionPerHour,
        elapsedSeconds: 3600, // 1 hour
        current: 10000,
        capacity: 1000000,
      });

      // Level 1 rice: 100/hr
      // 1 hour tick: 100
      // New stock: 10000 + 100 = 10100
      expect(newStock).toBe(10100);
    });

    it('should clamp resources to storage capacity', () => {
      const productionPerHour = EconomyService.productionPerHour('WOOD', 10, 0);
      const newStock = EconomyService.tick({
        productionPerHour,
        elapsedSeconds: 3600, // 1 hour
        current: 99900,
        capacity: 100000,
      });

      // Level 10 wood: 80 * 1.9 = 152/hr
      // 1 hour tick would produce 152
      // Current stock 99900 + 152 = 100052 → clamped to 100000
      expect(newStock).toBe(100000);
    });

    it('should produce 0 CATALYST before Industrial 1', () => {
      const standardProduction = EconomyService.productionPerHour(
        'CATALYST',
        1,
        0, // industrialLevel = 0
      );
      expect(standardProduction).toBe(0);
    });

    it('should produce CATALYST after Industrial 1', () => {
      const industrialProduction = EconomyService.productionPerHour(
        'CATALYST',
        1,
        1, // industrialLevel = 1
      );
      
      // Base catalyst: 20/hr, level 1: 20 * 1.0 = 20
      expect(industrialProduction).toBe(20);
    });
  });

  describe('Resource Storage Caps', () => {
    it('should not exceed storage limit even with large tick intervals', () => {
      // Simulate 10 hours of production
      const productionPerHour = EconomyService.productionPerHour('IRON', 20, 0);
      const newStock = EconomyService.tick({
        productionPerHour,
        elapsedSeconds: 36000, // 10 hours
        current: 50000,
        capacity: 60000,
      });

      // Level 20 iron: 40 * 2.9 = 116/hr
      // 10 hours: 1160 production
      // Current 50000 + 1160 = 51160 (under cap)
      expect(newStock).toBe(51160);

      // Now test with capping
      const cappedStock = EconomyService.tick({
        productionPerHour,
        elapsedSeconds: 36000,
        current: 59500,
        capacity: 60000,
      });
      
      // 59500 + 1160 = 60660 → clamped to 60000
      expect(cappedStock).toBe(60000);
    });
  });

  describe('Catalyst Unlock Gate', () => {
    it('should unlock CATALYST at exactly Industrial 1', () => {
      const beforeIndustrial = EconomyService.productionPerHour(
        'CATALYST',
        30,
        0, // industrialLevel = 0
      );
      expect(beforeIndustrial).toBe(0);

      const atIndustrial1 = EconomyService.productionPerHour('CATALYST', 1, 1);
      expect(atIndustrial1).toBeGreaterThan(0);
      expect(atIndustrial1).toBe(20); // Base 20/hr at level 1
    });
  });

  describe('Multi-Resource Production', () => {
    it('should handle all resource types correctly', () => {
      const buildingLevel = 15;
      const elapsedSeconds = 7200; // 2 hours

      const resources = [
        { type: 'RICE' as const, base: 100 },
        { type: 'WOOD' as const, base: 80 },
        { type: 'STONE' as const, base: 60 },
        { type: 'IRON' as const, base: 40 },
        { type: 'CHARCOAL' as const, base: 30 },
      ];

      resources.forEach(({ type, base }) => {
        const productionPerHour = EconomyService.productionPerHour(type, buildingLevel, 0);
        const newStock = EconomyService.tick({
          productionPerHour,
          elapsedSeconds,
          current: 10000,
          capacity: 500000,
        });

        // Level 15: multiplier = 1 + 0.1 * 14 = 2.4
        // Production per hour = base * 2.4
        // 2 hours = base * 2.4 * 2
        const expected = 10000 + (base * 2.4 * 2);
        expect(newStock).toBe(expected);
      });
    });
  });
});
