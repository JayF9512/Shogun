import {
  ProgressionService,
  AscensionState,
  INDUSTRIAL_MAX_LEVEL,
} from '../src/progression/progression.service';

const fullyEligible = (): AscensionState => ({
  tenshuLevel: 30,
  militaryBuildingsMaxed: true,
  researchHallLevel: 30,
  hospitalLevel: 30,
  catalystUnlocked: true,
  serverPermitsIndustrial: true,
});

describe('ProgressionService — Industrial Ascension gate (spec §10.1)', () => {
  it('permits ascension when every requirement is met', () => {
    const result = ProgressionService.checkAscension(fullyEligible());
    expect(result.eligible).toBe(true);
    expect(result.unmet).toHaveLength(0);
  });

  it('blocks ascension below Tenshu 30', () => {
    const state = { ...fullyEligible(), tenshuLevel: 29 };
    const result = ProgressionService.checkAscension(state);
    expect(result.eligible).toBe(false);
    expect(result.unmet).toContain('TENSHU_NOT_30');
  });

  it('blocks ascension when catalyst is locked and reports all gaps', () => {
    const state: AscensionState = {
      tenshuLevel: 20,
      militaryBuildingsMaxed: false,
      researchHallLevel: 10,
      hospitalLevel: 5,
      catalystUnlocked: false,
      serverPermitsIndustrial: false,
    };
    const result = ProgressionService.checkAscension(state);
    expect(result.eligible).toBe(false);
    expect(result.unmet).toEqual(
      expect.arrayContaining([
        'TENSHU_NOT_30',
        'MILITARY_BUILDINGS_NOT_30',
        'RESEARCH_HALL_NOT_30',
        'HOSPITAL_NOT_30',
        'CATALYST_LOCKED',
        'SERVER_NOT_INDUSTRIAL',
      ]),
    );
  });
});

describe('ProgressionService — Industrial sub-stage visibility (spec §12/§13)', () => {
  it('shows only the completed major level publicly', () => {
    expect(ProgressionService.publicIndustrialLevel(1, 0)).toBe(1);
    expect(ProgressionService.publicIndustrialLevel(1, 4)).toBe(1);
    expect(ProgressionService.publicIndustrialLevel(5, 4)).toBe(5);
    expect(ProgressionService.publicIndustrialLevel(9, 5)).toBe(9);
    expect(ProgressionService.publicIndustrialLevel(10, 0)).toBe(10);
  });

  it('hides sub-stage detail from the public but reveals it to the owner', () => {
    const asPublic = ProgressionService.visibleIndustrialProgress(3, 2, 'PUBLIC');
    expect(asPublic).toEqual({ publicLevel: 3 });
    expect((asPublic as any).subStage).toBeUndefined();

    const asOwner = ProgressionService.visibleIndustrialProgress(3, 2, 'OWNER');
    expect(asOwner).toEqual({ publicLevel: 3, majorLevel: 3, subStage: 2 });

    const asAdmin = ProgressionService.visibleIndustrialProgress(3, 2, 'ADMIN');
    expect(asAdmin).toMatchObject({ subStage: 2 });
  });

  it('advances sub-stages and rolls over at X.5 to (X+1).0', () => {
    expect(ProgressionService.advanceSubStage(1, 0)).toMatchObject({ majorLevel: 1, subStage: 1 });
    expect(ProgressionService.advanceSubStage(1, 5)).toMatchObject({ majorLevel: 2, subStage: 0 });
    // public level only bumps once the new major .0 is reached
    expect(ProgressionService.advanceSubStage(1, 5).publicLevel).toBe(2);
  });

  it('caps at Industrial 10 and never assumes Industrial 11', () => {
    const capped = ProgressionService.advanceSubStage(INDUSTRIAL_MAX_LEVEL, 0);
    expect(capped.majorLevel).toBe(INDUSTRIAL_MAX_LEVEL);
    expect(capped.capped).toBe(true);
    expect(capped.majorLevel).toBeLessThanOrEqual(INDUSTRIAL_MAX_LEVEL);
  });
});
