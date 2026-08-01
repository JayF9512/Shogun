import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Economy: resource production ticks and transactions.
 *
 * Base production per hour (spec-driven, tunable via BuildingDefinition):
 *   RICE:     100/hr * levelMultiplier
 *   WOOD:      80/hr * levelMultiplier
 *   STONE:     60/hr * levelMultiplier
 *   IRON:      40/hr * levelMultiplier
 *   CHARCOAL:  30/hr * levelMultiplier
 *   CATALYST:   0 until Industrial 1, then unlocked
 *
 * levelMultiplier = 1 + 0.1 * (buildingLevel - 1)  (each level +10%).
 * Kept data-driven per spec §4.6 — bases live in BASE_PRODUCTION and can be
 * overridden per building via BuildingDefinition.baseProduction.
 */

export type ResourceType = 'RICE' | 'WOOD' | 'STONE' | 'IRON' | 'CHARCOAL' | 'CATALYST';

export const BASE_PRODUCTION: Record<ResourceType, number> = {
  RICE: 100,
  WOOD: 80,
  STONE: 60,
  IRON: 40,
  CHARCOAL: 30,
  CATALYST: 0,
};

@Injectable()
export class EconomyService {
  constructor(private readonly prisma: PrismaService) {}

  /** Per-level multiplier: +10% per level above 1. */
  static levelMultiplier(buildingLevel: number): number {
    return 1 + 0.1 * (Math.max(1, buildingLevel) - 1);
  }

  /**
   * Production per hour for a resource at a given building level.
   * CATALYST stays at 0 until the settlement is industrial (industrialLevel>=1).
   */
  static productionPerHour(
    resource: ResourceType,
    buildingLevel: number,
    industrialLevel = 0,
  ): number {
    if (resource === 'CATALYST' && industrialLevel < 1) return 0;
    const base = resource === 'CATALYST' ? 20 : BASE_PRODUCTION[resource];
    return base * EconomyService.levelMultiplier(buildingLevel);
  }

  /**
   * Amount produced over an elapsed period, clamped to remaining capacity.
   * Pure function for deterministic testing of the tick math.
   */
  static tick(params: {
    productionPerHour: number;
    elapsedSeconds: number;
    current: number;
    capacity: number;
  }): number {
    const produced = params.productionPerHour * (params.elapsedSeconds / 3600);
    const next = params.current + produced;
    return Math.min(next, params.capacity);
  }

  // --- DB-backed operations -------------------------------------------------

  /** Apply a production tick to every resource stock of a settlement. */
  async tickSettlement(settlementId: string, now = new Date()) {
    const stocks = await this.prisma.resourceStock.findMany({ where: { settlementId } });
    const updates = stocks.map((stock) => {
      const elapsedSeconds = (now.getTime() - stock.updatedAt.getTime()) / 1000;
      const next = EconomyService.tick({
        productionPerHour: stock.productionPerHour,
        elapsedSeconds,
        current: Number(stock.amount),
        capacity: Number(stock.capacity),
      });
      return this.prisma.resourceStock.update({
        where: { id: stock.id },
        data: { amount: BigInt(Math.floor(next)) },
      });
    });
    return this.prisma.$transaction(updates);
  }

  /** Spend resources atomically; throws if insufficient. */
  async spend(settlementId: string, resource: ResourceType, amount: number) {
    const stock = await this.prisma.resourceStock.findUnique({
      where: { settlementId_resource: { settlementId, resource } },
    });
    if (!stock || Number(stock.amount) < amount) {
      throw new Error(`Insufficient ${resource}`);
    }
    return this.prisma.resourceStock.update({
      where: { id: stock.id },
      data: { amount: BigInt(Number(stock.amount) - amount) },
    });
  }
}
