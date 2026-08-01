import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { resolveCurrentPlayer, serializeBigInts } from '../common/player-context';

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

export const ALL_RESOURCES: ResourceType[] = [
  'RICE',
  'WOOD',
  'STONE',
  'IRON',
  'CHARCOAL',
  'CATALYST',
];

/** Minimum seconds between player-triggered ticks (rate limit: 1/min). */
export const TICK_COOLDOWN_SECONDS = 60;

@Injectable()
export class EconomyService {
  // Per-player last-tick timestamps for rate limiting (single-instance server).
  private readonly lastPlayerTick = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensure the player has a settlement with a stock row for every resource.
   * Guests start bare, so we lazily provision one on first economy access.
   */
  private async ensureSettlement(playerId: string, industrialLevel = 0) {
    let settlement = await this.prisma.settlement.findUnique({ where: { playerId } });
    if (!settlement) {
      settlement = await this.prisma.settlement.create({ data: { playerId } });
    }
    const existing = await this.prisma.resourceStock.findMany({
      where: { settlementId: settlement.id },
    });
    const have = new Set(existing.map((s) => s.resource));
    const missing = ALL_RESOURCES.filter((r) => !have.has(r));
    if (missing.length) {
      await this.prisma.resourceStock.createMany({
        data: missing.map((resource) => ({
          settlementId: settlement!.id,
          resource,
          amount: BigInt(0),
          productionPerHour: EconomyService.productionPerHour(resource, 1, industrialLevel),
        })),
      });
    }
    return settlement;
  }

  /**
   * Player-scoped production tick (spec §98): called on login/resume. Rate
   * limited to once per minute per player. Applies elapsed production to every
   * resource stock and returns the new balances.
   */
  async playerTick(accountId: string) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    const now = Date.now();
    const last = this.lastPlayerTick.get(player.id) ?? 0;
    if (now - last < TICK_COOLDOWN_SECONDS * 1000) {
      const retryIn = Math.ceil((TICK_COOLDOWN_SECONDS * 1000 - (now - last)) / 1000);
      throw new BadRequestException(`Tick rate limit reached. Retry in ${retryIn}s`);
    }

    const settlement = await this.ensureSettlement(player.id, player.industrialLevel);
    await this.tickSettlement(settlement.id);
    this.lastPlayerTick.set(player.id, now);

    const stocks = await this.prisma.resourceStock.findMany({
      where: { settlementId: settlement.id },
    });
    return serializeBigInts({
      settlementId: settlement.id,
      tickedAt: new Date().toISOString(),
      resources: stocks.map((s) => ({
        resource: s.resource,
        amount: s.amount,
        capacity: s.capacity,
        productionPerHour: s.productionPerHour,
      })),
    });
  }

  /** All resource balances + production rates for the current player. */
  async playerResources(accountId: string) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    const settlement = await this.ensureSettlement(player.id, player.industrialLevel);
    const stocks = await this.prisma.resourceStock.findMany({
      where: { settlementId: settlement.id },
      orderBy: { resource: 'asc' },
    });
    return serializeBigInts({
      settlementId: settlement.id,
      resources: stocks.map((s) => ({
        resource: s.resource,
        amount: s.amount,
        capacity: s.capacity,
        productionPerHour: s.productionPerHour,
      })),
    });
  }

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

  /**
   * Spend resources atomically; throws if insufficient.
   *
   * Uses a single conditional `updateMany` (WHERE amount >= cost) so two
   * concurrent spends can never drive a balance negative — the second one
   * matches zero rows and is rejected. This is the race-safe pattern for a
   * server-authoritative economy (spec §98).
   */
  async spend(settlementId: string, resource: ResourceType, amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Spend amount must be a positive number');
    }
    const cost = BigInt(Math.ceil(amount));
    const result = await this.prisma.resourceStock.updateMany({
      where: { settlementId, resource, amount: { gte: cost } },
      data: { amount: { decrement: cost } },
    });
    if (result.count === 0) {
      throw new Error(`Insufficient ${resource}`);
    }
    return this.prisma.resourceStock.findUnique({
      where: { settlementId_resource: { settlementId, resource } },
    });
  }
}
