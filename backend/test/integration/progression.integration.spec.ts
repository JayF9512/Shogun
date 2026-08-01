import { Test, TestingModule } from '@nestjs/testing';
import { ProgressionService } from '../../src/progression/progression.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('ProgressionService Integration Tests', () => {
  let service: ProgressionService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgressionService, PrismaService],
    }).compile();

    service = module.get<ProgressionService>(ProgressionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('Industrial Ascension Gate', () => {
    it('should allow ascension when all requirements are met', () => {
      const ascensionState = {
        tenshuLevel: 30,
        militaryBuildingsMaxed: true,
        researchHallLevel: 30,
        hospitalLevel: 30,
        catalystUnlocked: true,
        serverPermitsIndustrial: true,
      };

      const result = ProgressionService.checkAscension(ascensionState);
      
      expect(result.eligible).toBe(true);
      expect(result.unmet).toHaveLength(0);
    });

    it('should reject ascension when Tenshu is not Level 30', () => {
      const ascensionState = {
        tenshuLevel: 29,
        militaryBuildingsMaxed: true,
        researchHallLevel: 30,
        hospitalLevel: 30,
        catalystUnlocked: true,
        serverPermitsIndustrial: true,
      };

      const result = ProgressionService.checkAscension(ascensionState);
      
      expect(result.eligible).toBe(false);
      expect(result.unmet).toContain('TENSHU_NOT_30');
    });

    it('should reject ascension when military buildings are not Level 30', () => {
      const ascensionState = {
        tenshuLevel: 30,
        militaryBuildingsMaxed: false,
        researchHallLevel: 30,
        hospitalLevel: 30,
        catalystUnlocked: true,
        serverPermitsIndustrial: true,
      };

      const result = ProgressionService.checkAscension(ascensionState);
      
      expect(result.eligible).toBe(false);
      expect(result.unmet).toContain('MILITARY_BUILDINGS_NOT_30');
    });
  });

  describe('Industrial Sub-Stage Progression', () => {
    it('should advance from stage 1.5 to Industrial 2.0', () => {
      const result = ProgressionService.advanceSubStage(1, 5);
      
      expect(result.majorLevel).toBe(2);
      expect(result.subStage).toBe(0);
      expect(result.publicLevel).toBe(2);
    });

    it('should advance from stage 2.3 to stage 2.4', () => {
      const result = ProgressionService.advanceSubStage(2, 3);
      
      expect(result.majorLevel).toBe(2);
      expect(result.subStage).toBe(4);
      expect(result.publicLevel).toBe(2);
    });

    it('should advance from stage 2.4 to stage 2.5', () => {
      const result = ProgressionService.advanceSubStage(2, 4);
      
      expect(result.majorLevel).toBe(2);
      expect(result.subStage).toBe(5);
      expect(result.publicLevel).toBe(2);
    });

    it('should cap at Industrial 10.0', () => {
      const result = ProgressionService.advanceSubStage(10, 0);
      
      expect(result.majorLevel).toBe(10);
      expect(result.subStage).toBe(0);
      expect(result.publicLevel).toBe(10);
      expect(result.capped).toBe(true);
    });
  });

  describe('Public Industrial Level Visibility', () => {
    it('should show Industrial 3 publicly when at stage 3.5', () => {
      const publicLevel = ProgressionService.publicIndustrialLevel(3, 5);
      
      expect(publicLevel).toBe(3);
    });

    it('should show Industrial 2 publicly when at stage 2.3', () => {
      const publicLevel = ProgressionService.publicIndustrialLevel(2, 3);
      
      expect(publicLevel).toBe(2);
    });

    it('should return 0 for level 0 (standard tier players)', () => {
      const publicLevel = ProgressionService.publicIndustrialLevel(0, 0);
      
      expect(publicLevel).toBe(0);
    });

    it('should cap at Industrial 10', () => {
      const publicLevel = ProgressionService.publicIndustrialLevel(10, 5);
      
      expect(publicLevel).toBe(10);
    });
  });
});
