import { Test, TestingModule } from '@nestjs/testing';
import { MarchService } from '../../src/march/march.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('MarchService Integration Tests', () => {
  let service: MarchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarchService, PrismaService],
    }).compile();

    service = module.get<MarchService>(MarchService);
  });

  describe('March Speed Calculation', () => {
    it('should calculate base speed correctly (100 tiles/hr)', () => {
      const composition = {
        hasKomainu: false,
        heroMarchBonus: 0,
      };

      const speed = MarchService.speed(composition);
      expect(speed).toBe(100); // BASE_SPEED
    });

    it('should apply +30% speed bonus for Komainu-heavy marches', () => {
      const composition = {
        hasKomainu: true,
        heroMarchBonus: 0,
      };

      const speed = MarchService.speed(composition);
      
      // Komainu bonus: +30%
      // 100 * 1.3 = 130 tiles/hr
      expect(speed).toBe(130);
    });

    it('should not apply Komainu bonus if Komainu not present', () => {
      const composition = {
        hasKomainu: false,
        heroMarchBonus: 0,
      };

      const speed = MarchService.speed(composition);
      
      // No Komainu, base speed
      expect(speed).toBe(100);
    });

    it('should apply hero bonus correctly', () => {
      const composition = {
        hasKomainu: false,
        heroMarchBonus: 0.15, // +15% from hero skill
      };

      const speed = MarchService.speed(composition);
      
      // 100 * (1 + 0.15) = 115 tiles/hr
      expect(speed).toBeCloseTo(115, 1);
    });

    it('should stack Komainu and hero bonuses', () => {
      const composition = {
        hasKomainu: true,
        heroMarchBonus: 0.2, // +20% from hero
      };

      const speed = MarchService.speed(composition);
      
      // 100 * (1 + 0.3 + 0.2) = 150 tiles/hr
      expect(speed).toBe(150);
    });
  });

  describe('Travel Time Calculation', () => {
    it('should calculate travel time correctly for standard march', () => {
      const distance = MarchService.distance(0, 0, 300, 400);
      expect(distance).toBe(500); // sqrt(300^2 + 400^2)

      const composition = {
        hasKomainu: false,
        heroMarchBonus: 0,
      };

      const travelTime = MarchService.travelTimeSeconds(distance, composition);

      // Distance: 500 tiles
      // Speed: 100 tiles/hr
      // Time: 500 / 100 = 5 hours = 18000 seconds
      expect(travelTime).toBe(18000);
    });

    it('should reduce travel time with Komainu bonus', () => {
      const distance = MarchService.distance(0, 0, 300, 400);

      const composition = {
        hasKomainu: true,
        heroMarchBonus: 0,
      };

      const travelTime = MarchService.travelTimeSeconds(distance, composition);

      // Distance: 500 tiles
      // Speed: 100 * 1.3 = 130 tiles/hr
      // Time: 500 / 130 ≈ 3.846 hours ≈ 13846.15 seconds
      expect(travelTime).toBeCloseTo(13846.15, 0);
    });

    it('should handle zero distance (same tile)', () => {
      const distance = MarchService.distance(100, 200, 100, 200);
      expect(distance).toBe(0);

      const composition = {
        hasKomainu: false,
        heroMarchBonus: 0,
      };

      const travelTime = MarchService.travelTimeSeconds(distance, composition);
      expect(travelTime).toBe(0);
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate Euclidean distance correctly', () => {
      const dist = MarchService.distance(0, 0, 3, 4);
      
      // sqrt(3^2 + 4^2) = sqrt(25) = 5
      expect(dist).toBe(5);
    });

    it('should handle negative coordinates', () => {
      const dist = MarchService.distance(-10, -10, 20, 30);
      
      // sqrt(30^2 + 40^2) = sqrt(2500) = 50
      expect(dist).toBe(50);
    });
  });

  describe('Max Simultaneous Marches', () => {
    it('should return 1 march for levels 1-4', () => {
      expect(MarchService.maxSimultaneousMarches(1)).toBe(1);
      expect(MarchService.maxSimultaneousMarches(4)).toBe(1);
    });

    it('should return 1 march for levels 5-9', () => {
      expect(MarchService.maxSimultaneousMarches(5)).toBe(1);
      expect(MarchService.maxSimultaneousMarches(9)).toBe(1);
    });

    it('should return 2 marches for levels 10-14', () => {
      expect(MarchService.maxSimultaneousMarches(10)).toBe(2);
      expect(MarchService.maxSimultaneousMarches(14)).toBe(2);
    });

    it('should cap at 5 marches for level 25+', () => {
      expect(MarchService.maxSimultaneousMarches(25)).toBe(5);
      expect(MarchService.maxSimultaneousMarches(30)).toBe(5);
      expect(MarchService.maxSimultaneousMarches(100)).toBe(5);
    });
  });
});
