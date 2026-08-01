import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Progression: standard levels 1-30, then Industrial Ascension (I1 -> I10).
 *
 * Industrial Ascension gate (spec §10.1):
 *   - Tenshu Level 30
 *   - All required military buildings Level 30
 *   - Research Hall Level 30
 *   - Hospital Level 30
 *   - Industrial Catalyst resource unlocked
 *   - Server permits industrial progression (season/server-age)
 *
 * Industrial sub-stage system (spec §12, §13, §15):
 *   - Each Industrial level I1-I10 has 5 private sub-stages (X.1..X.5)
 *   - Only completed full Industrial levels are public
 *   - Sub-stage progress is visible only to the owning player
 */

export const STANDARD_MAX_LEVEL = 30;
export const INDUSTRIAL_MAX_LEVEL = 10;
export const SUB_STAGES_PER_LEVEL = 5;

export interface AscensionState {
  tenshuLevel: number;
  militaryBuildingsMaxed: boolean;
  researchHallLevel: number;
  hospitalLevel: number;
  catalystUnlocked: boolean;
  serverPermitsIndustrial: boolean;
}

export interface AscensionCheck {
  eligible: boolean;
  unmet: string[];
}

@Injectable()
export class ProgressionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pure eligibility check for Industrial Ascension (spec §10.1). */
  static checkAscension(state: AscensionState): AscensionCheck {
    const unmet: string[] = [];
    if (state.tenshuLevel < STANDARD_MAX_LEVEL) unmet.push('TENSHU_NOT_30');
    if (!state.militaryBuildingsMaxed) unmet.push('MILITARY_BUILDINGS_NOT_30');
    if (state.researchHallLevel < STANDARD_MAX_LEVEL) unmet.push('RESEARCH_HALL_NOT_30');
    if (state.hospitalLevel < STANDARD_MAX_LEVEL) unmet.push('HOSPITAL_NOT_30');
    if (!state.catalystUnlocked) unmet.push('CATALYST_LOCKED');
    if (!state.serverPermitsIndustrial) unmet.push('SERVER_NOT_INDUSTRIAL');
    return { eligible: unmet.length === 0, unmet };
  }

  /**
   * Compute the public industrial level from private progress.
   * Only completed full levels are public (spec §13):
   *   1.0 -> 1, 1.4 -> 1, 2.0 -> 2, 9.5 -> 9, 10.0 -> 10
   */
  static publicIndustrialLevel(majorLevel: number, subStage: number): number {
    if (majorLevel <= 0) return 0;
    // While mid sub-stage (X.1..X.5) the public level stays at the last
    // completed major level, i.e. majorLevel itself once X.0 is reached.
    return Math.min(majorLevel, INDUSTRIAL_MAX_LEVEL);
  }

  /**
   * Advance one sub-stage. Returns the new {majorLevel, subStage, publicLevel}.
   * Completing X.5 rolls over to (X+1).0 and bumps the public level.
   */
  static advanceSubStage(majorLevel: number, subStage: number) {
    if (majorLevel >= INDUSTRIAL_MAX_LEVEL && subStage >= 0) {
      // Industrial 10 is the initial cap (spec §11). Do not assume I11.
      if (majorLevel === INDUSTRIAL_MAX_LEVEL) {
        return {
          majorLevel,
          subStage: 0,
          publicLevel: INDUSTRIAL_MAX_LEVEL,
          capped: true,
        };
      }
    }
    let nextMajor = majorLevel;
    let nextSub = subStage + 1;
    if (nextSub > SUB_STAGES_PER_LEVEL) {
      nextMajor = Math.min(majorLevel + 1, INDUSTRIAL_MAX_LEVEL);
      nextSub = 0;
    }
    return {
      majorLevel: nextMajor,
      subStage: nextSub,
      publicLevel: ProgressionService.publicIndustrialLevel(nextMajor, nextSub),
      capped: nextMajor >= INDUSTRIAL_MAX_LEVEL && nextSub === 0,
    };
  }

  /**
   * Visibility rule: what a viewer may see of a building's industrial state.
   * Owner and admins see sub-stage detail; everyone else sees only public.
   */
  static visibleIndustrialProgress(
    majorLevel: number,
    subStage: number,
    viewer: 'OWNER' | 'ADMIN' | 'PUBLIC',
  ) {
    const publicLevel = ProgressionService.publicIndustrialLevel(majorLevel, subStage);
    if (viewer === 'PUBLIC') {
      return { publicLevel };
    }
    return { publicLevel, majorLevel, subStage };
  }

  // --- DB-backed operations -------------------------------------------------

  async getAscensionStatus(playerId: string): Promise<AscensionCheck> {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: {
        settlement: true,
        buildings: { include: { definition: true } },
      },
    });
    if (!player) throw new NotFoundException('Player not found');

    const level = (key: string) =>
      player.buildings.find((b) => b.definition.key === key)?.level ?? 0;
    const military = player.buildings.filter((b) => b.definition.category === 'MILITARY');

    const state: AscensionState = {
      tenshuLevel: player.settlement?.tenshuLevel ?? 0,
      militaryBuildingsMaxed:
        military.length > 0 && military.every((b) => b.level >= STANDARD_MAX_LEVEL),
      researchHallLevel: level('research_hall'),
      hospitalLevel: level('hospital'),
      catalystUnlocked: player.industrialLevel > 0 || level('catalyst_forge') > 0,
      serverPermitsIndustrial: true,
    };
    return ProgressionService.checkAscension(state);
  }

  async ascend(playerId: string) {
    const status = await this.getAscensionStatus(playerId);
    if (!status.eligible) {
      throw new BadRequestException({ message: 'Ascension requirements unmet', unmet: status.unmet });
    }
    return this.prisma.player.update({
      where: { id: playerId },
      data: { tier: 'INDUSTRIAL', industrialLevel: 1 },
    });
  }
}
