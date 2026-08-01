import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { resolveCurrentPlayer, serializeBigInts } from '../common/player-context';

/**
 * Onboarding tutorial (steps 0-12 mapped to Tenshu / keep levels). Each step
 * unlocks one or more features and awards a small resource grant so new players
 * always have enough to take the next action. Progress is stored per-player in
 * TutorialProgress; completedSteps / unlockedFeatures are JSON arrays so the
 * step table below can evolve without a schema migration.
 */
export interface TutorialStepDef {
  step: number;
  title: string;
  /** Feature keys unlocked when this step is completed. */
  unlocks: string[];
  /** Resource grants awarded on completion (resource -> amount). */
  rewards: Record<string, number>;
}

// Rewards use valid ResourceType enum keys only: RICE, WOOD, STONE, IRON,
// CHARCOAL, CATALYST. Premium/soft currencies are handled separately.
export const TUTORIAL_STEPS: TutorialStepDef[] = [
  { step: 0, title: 'Welcome to your domain', unlocks: ['MOVE_CAMERA'], rewards: { RICE: 1000, WOOD: 1000 } },
  { step: 1, title: 'Build the Tenshu (keep)', unlocks: ['BUILD_TENSHU'], rewards: { WOOD: 2000 } },
  { step: 2, title: 'Gather resources', unlocks: ['RESOURCE_NODES'], rewards: { RICE: 2000, WOOD: 2000 } },
  { step: 3, title: 'Train your first troops', unlocks: ['TRAIN_TROOPS'], rewards: { IRON: 1000 } },
  { step: 4, title: 'Construct a barracks', unlocks: ['BUILD_BARRACKS'], rewards: { WOOD: 3000, STONE: 1000 } },
  { step: 5, title: 'Scout the map', unlocks: ['MAP_SCOUT'], rewards: { RICE: 1500 } },
  { step: 6, title: 'Attack a monster', unlocks: ['ATTACK_MONSTER'], rewards: { IRON: 2000 } },
  { step: 7, title: 'Occupy a mine', unlocks: ['OCCUPY_MINE'], rewards: { STONE: 2000 } },
  { step: 8, title: 'Recruit a hero', unlocks: ['RECRUIT_HERO'], rewards: { CHARCOAL: 1000 } },
  { step: 9, title: 'Join a clan', unlocks: ['CLAN_BROWSER'], rewards: { RICE: 2000 } },
  { step: 10, title: 'Upgrade the Tenshu', unlocks: ['TENSHU_UPGRADE'], rewards: { WOOD: 5000, STONE: 5000 } },
  { step: 11, title: 'Open the store', unlocks: ['STORE'], rewards: { IRON: 3000 } },
  { step: 12, title: 'Tutorial complete', unlocks: ['ALL_FEATURES'], rewards: { RICE: 5000, WOOD: 5000, IRON: 5000 } },
];

@Injectable()
export class TutorialService {
  constructor(private readonly prisma: PrismaService) {}

  /** Full step catalogue (client renders the tutorial UI from this). */
  steps() {
    return TUTORIAL_STEPS;
  }

  private async ensureProgress(playerId: string) {
    return this.prisma.tutorialProgress.upsert({
      where: { playerId },
      update: {},
      create: { playerId },
    });
  }

  /** The current player's tutorial progress (creating a row on first read). */
  async getProgress(accountId: string) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    const progress = await this.ensureProgress(player.id);
    return {
      ...progress,
      totalSteps: TUTORIAL_STEPS.length,
      steps: TUTORIAL_STEPS,
    };
  }

  /**
   * Mark a step complete: records it, advances currentStep, unlocks the step's
   * features and awards its resource grant. Idempotent — re-completing a step
   * does not re-award resources.
   */
  async completeStep(accountId: string, step: number, _data?: Record<string, any>) {
    const def = TUTORIAL_STEPS.find((s) => s.step === step);
    if (!def) throw new BadRequestException(`Unknown tutorial step: ${step}`);

    const player = await resolveCurrentPlayer(this.prisma, accountId);
    const progress = await this.ensureProgress(player.id);

    const completed: number[] = Array.isArray(progress.completedSteps)
      ? (progress.completedSteps as number[])
      : [];
    const unlocked: string[] = Array.isArray(progress.unlockedFeatures)
      ? (progress.unlockedFeatures as string[])
      : [];

    const alreadyDone = completed.includes(step);
    if (!alreadyDone) {
      completed.push(step);
      for (const f of def.unlocks) if (!unlocked.includes(f)) unlocked.push(f);
    }

    const nextStep = Math.min(Math.max(progress.currentStep, step + 1), TUTORIAL_STEPS.length);
    const updated = await this.prisma.tutorialProgress.update({
      where: { playerId: player.id },
      data: {
        currentStep: nextStep,
        completedSteps: completed,
        unlockedFeatures: unlocked,
      },
    });

    // Award the step's resource grant once (only the first time it completes).
    let awarded: Record<string, number> = {};
    if (!alreadyDone) {
      const settlement = await this.prisma.settlement.findUnique({
        where: { playerId: player.id },
        select: { id: true },
      });
      if (settlement) awarded = await this.awardResources(settlement.id, def.rewards);
    }

    return serializeBigInts({
      success: true,
      step,
      alreadyCompleted: alreadyDone,
      awarded,
      progress: updated,
    });
  }

  /** Increment settlement resource stocks for a reward grant. */
  private async awardResources(settlementId: string, rewards: Record<string, number>) {
    const applied: Record<string, number> = {};
    for (const [resource, amount] of Object.entries(rewards)) {
      if (!amount) continue;
      try {
        await this.prisma.resourceStock.upsert({
          where: { settlementId_resource: { settlementId, resource: resource as any } },
          update: { amount: { increment: BigInt(amount) } },
          create: { settlementId, resource: resource as any, amount: BigInt(amount) },
        });
        applied[resource] = amount;
      } catch {
        // Unknown resource enum value — skip rather than fail the whole step.
      }
    }
    return applied;
  }
}
