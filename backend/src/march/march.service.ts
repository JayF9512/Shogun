import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CombatService, Stack, TroopClass } from '../combat/combat.service';
import { resolveCurrentPlayer, serializeBigInts } from '../common/player-context';

/**
 * Marches: movement across the world map (spec §15, §16).
 *
 * March speed formula:
 *   base_speed = 100 tiles/hr
 *   Komainu Riders present: +30% speed
 *   Hero march skill: +variable%
 *   Travel time = distance / speed
 *   Max simultaneous marches = floor(playerLevel / 5), clamped to [1, 5]
 */

export const BASE_SPEED = 100; // tiles per hour
export const KOMAINU_SPEED_BONUS = 0.3;

// Base attack per troop for server-side march combat (deterministic).
export const TROOP_ATTACK = 10;
export const SETTLEMENT_ORIGIN = { x: 500, y: 500 };

export interface MarchComposition {
  hasKomainu: boolean;
  heroMarchBonus?: number; // e.g. 0.15 for +15%
}

export type MarchType = 'attack' | 'scout' | 'gather';

// Simple {infantry, cavalry, ranged} composition -> troop classes.
export const CLASS_BY_ROLE: Record<'infantry' | 'cavalry' | 'ranged', TroopClass> = {
  infantry: 'SAMURAI_GUARD',
  cavalry: 'KOMAINU_RIDERS',
  ranged: 'YUMI_ARCHERS',
};

export interface RoleCounts {
  infantry: number;
  cavalry: number;
  ranged: number;
}

@Injectable()
export class MarchService {
  constructor(private readonly prisma: PrismaService) {}

  /** Effective march speed in tiles/hour. */
  static speed(comp: MarchComposition): number {
    let multiplier = 1;
    if (comp.hasKomainu) multiplier += KOMAINU_SPEED_BONUS;
    multiplier += comp.heroMarchBonus ?? 0;
    return BASE_SPEED * multiplier;
  }

  /** Euclidean distance between two tiles. */
  static distance(ax: number, ay: number, bx: number, by: number): number {
    return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
  }

  /** Travel time in seconds for a given distance and composition. */
  static travelTimeSeconds(distance: number, comp: MarchComposition): number {
    const speed = MarchService.speed(comp); // tiles/hr
    if (speed <= 0) throw new BadRequestException('Invalid march speed');
    return (distance / speed) * 3600;
  }

  /** Max simultaneous marches allowed for a player level. */
  static maxSimultaneousMarches(playerLevel: number): number {
    return Math.min(5, Math.max(1, Math.floor(playerLevel / 5)));
  }

  // --- DB-backed operations -------------------------------------------------

  async createMarch(params: {
    playerId: string;
    originX: number;
    originY: number;
    targetX: number;
    targetY: number;
    hasKomainu: boolean;
    heroMarchBonus?: number;
    participants: { troopClass: 'SAMURAI_GUARD' | 'YUMI_ARCHERS' | 'KOMAINU_RIDERS'; count: number }[];
  }) {
    const player = await this.prisma.player.findUnique({
      where: { id: params.playerId },
      include: { marches: { where: { state: { in: ['GATHERING', 'MARCHING', 'IN_COMBAT'] } } } },
    });
    if (!player) throw new BadRequestException('Player not found');

    const cap = MarchService.maxSimultaneousMarches(player.level);
    if (player.marches.length >= cap) {
      throw new BadRequestException(`March cap reached (${cap})`);
    }

    const distance = MarchService.distance(
      params.originX,
      params.originY,
      params.targetX,
      params.targetY,
    );
    const comp: MarchComposition = {
      hasKomainu: params.hasKomainu,
      heroMarchBonus: params.heroMarchBonus,
    };
    const speed = MarchService.speed(comp);
    const seconds = MarchService.travelTimeSeconds(distance, comp);
    const now = new Date();

    return this.prisma.march.create({
      data: {
        playerId: params.playerId,
        state: 'MARCHING',
        originX: params.originX,
        originY: params.originY,
        targetX: params.targetX,
        targetY: params.targetY,
        speed,
        distance,
        departedAt: now,
        arrivesAt: new Date(now.getTime() + seconds * 1000),
        participants: {
          create: params.participants.map((p) => ({
            troopClass: p.troopClass,
            count: p.count,
          })),
        },
      },
      include: { participants: true },
    });
  }

  // --- Phase 7: player-scoped march contract --------------------------------

  private static roleTotal(counts: RoleCounts): number {
    return (counts.infantry || 0) + (counts.cavalry || 0) + (counts.ranged || 0);
  }

  /** Available troops per class for a player, aggregated across definitions. */
  private async troopCountsByClass(playerId: string): Promise<Record<TroopClass, number>> {
    const rows = await this.prisma.playerTroops.findMany({
      where: { playerId },
      include: { definition: true },
    });
    const totals: Record<TroopClass, number> = {
      SAMURAI_GUARD: 0,
      KOMAINU_RIDERS: 0,
      YUMI_ARCHERS: 0,
    };
    for (const r of rows) totals[r.definition.troopClass] += r.count;
    return totals;
  }

  /**
   * Grant a new player a small starter army so marches are immediately usable.
   * Only fires when the player has zero troop rows (idempotent for veterans).
   */
  private async ensureStarterTroops(playerId: string) {
    const existing = await this.prisma.playerTroops.count({ where: { playerId } });
    if (existing > 0) return;
    const classes: TroopClass[] = ['SAMURAI_GUARD', 'KOMAINU_RIDERS', 'YUMI_ARCHERS'];
    for (const troopClass of classes) {
      const def = await this.prisma.troopDefinition.findFirst({ where: { troopClass } });
      if (!def) continue;
      await this.prisma.playerTroops.upsert({
        where: { playerId_definitionId: { playerId, definitionId: def.id } },
        update: {},
        create: { playerId, definitionId: def.id, count: 500 },
      });
    }
  }

  /** Adjust a player's troop count for one class (delta may be negative). */
  private async adjustClassCount(playerId: string, troopClass: TroopClass, delta: number) {
    if (delta === 0) return;
    let remaining = delta;
    const rows = await this.prisma.playerTroops.findMany({
      where: { playerId, definition: { troopClass } },
      orderBy: { count: 'desc' },
    });
    if (delta > 0 && rows.length) {
      await this.prisma.playerTroops.update({
        where: { id: rows[0].id },
        data: { count: { increment: delta } },
      });
      return;
    }
    // Negative: drain greedily across the class's definition rows.
    for (const row of rows) {
      if (remaining >= 0) break;
      const take = Math.min(row.count, -remaining);
      await this.prisma.playerTroops.update({
        where: { id: row.id },
        data: { count: { decrement: take } },
      });
      remaining += take;
    }
  }

  private roleCountsToStacks(counts: RoleCounts): Stack[] {
    const stacks: Stack[] = [];
    (['infantry', 'cavalry', 'ranged'] as const).forEach((role) => {
      const count = counts[role] || 0;
      if (count > 0) {
        stacks.push({ troopClass: CLASS_BY_ROLE[role], count, attack: TROOP_ATTACK });
      }
    });
    return stacks;
  }

  /** Send a march (spec §15). Validates troops, deducts them, schedules arrival. */
  async sendMarch(
    accountId: string,
    dto: {
      targetX: number;
      targetY: number;
      troops: Partial<RoleCounts>;
      heroId?: string;
      marchType: MarchType;
    },
  ) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    await this.ensureStarterTroops(player.id);

    const troops: RoleCounts = {
      infantry: Math.max(0, Math.floor(dto.troops?.infantry || 0)),
      cavalry: Math.max(0, Math.floor(dto.troops?.cavalry || 0)),
      ranged: Math.max(0, Math.floor(dto.troops?.ranged || 0)),
    };
    if (MarchService.roleTotal(troops) <= 0) {
      throw new BadRequestException('March must include at least one troop');
    }
    if (!['attack', 'scout', 'gather'].includes(dto.marchType)) {
      throw new BadRequestException('Invalid marchType');
    }

    // March cap by level.
    const active = await this.prisma.march.count({
      where: { playerId: player.id, status: { in: ['marching', 'returning'] } },
    });
    const cap = MarchService.maxSimultaneousMarches(player.level);
    if (active >= cap) throw new BadRequestException(`March cap reached (${cap})`);

    // Validate troop availability per class.
    const available = await this.troopCountsByClass(player.id);
    const need: Partial<Record<TroopClass, number>> = {
      SAMURAI_GUARD: troops.infantry,
      KOMAINU_RIDERS: troops.cavalry,
      YUMI_ARCHERS: troops.ranged,
    };
    for (const [cls, n] of Object.entries(need) as [TroopClass, number][]) {
      if (n > 0 && available[cls] < n) {
        throw new BadRequestException(`Not enough troops of class ${cls} (have ${available[cls]}, need ${n})`);
      }
    }

    // Hero speed bonus.
    let heroMarchBonus = 0;
    if (dto.heroId) {
      const hero = await this.prisma.playerHero.findUnique({
        where: { id: dto.heroId },
        include: { definition: true },
      });
      if (hero?.definition?.marchSkillBonus) heroMarchBonus = hero.definition.marchSkillBonus;
    }

    const comp: MarchComposition = { hasKomainu: troops.cavalry > 0, heroMarchBonus };
    const distance = MarchService.distance(
      SETTLEMENT_ORIGIN.x,
      SETTLEMENT_ORIGIN.y,
      dto.targetX,
      dto.targetY,
    );
    const speed = MarchService.speed(comp);
    const seconds = MarchService.travelTimeSeconds(distance, comp);
    const now = new Date();

    // Deduct troops (they leave the city until the march returns).
    await this.adjustClassCount(player.id, 'SAMURAI_GUARD', -troops.infantry);
    await this.adjustClassCount(player.id, 'KOMAINU_RIDERS', -troops.cavalry);
    await this.adjustClassCount(player.id, 'YUMI_ARCHERS', -troops.ranged);

    const march = await this.prisma.march.create({
      data: {
        playerId: player.id,
        state: 'MARCHING',
        status: 'marching',
        marchType: dto.marchType,
        troopComposition: troops as any,
        heroId: dto.heroId ?? null,
        originX: SETTLEMENT_ORIGIN.x,
        originY: SETTLEMENT_ORIGIN.y,
        targetX: dto.targetX,
        targetY: dto.targetY,
        speed,
        distance,
        departedAt: now,
        arrivesAt: new Date(now.getTime() + seconds * 1000),
      },
    });
    return serializeBigInts(march);
  }

  /** List a player's marches, resolving any that have arrived first. */
  async listMarches(accountId: string) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    await this.resolveDueMarches(player.id);
    const marches = await this.prisma.march.findMany({
      where: { playerId: player.id, status: { in: ['marching', 'returning', 'arrived'] } },
      orderBy: { departedAt: 'desc' },
    });
    return serializeBigInts(marches);
  }

  /** Recall a march before it arrives — it turns around and heads home. */
  async recall(accountId: string, marchId: string) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    const march = await this.prisma.march.findUnique({ where: { id: marchId } });
    if (!march || march.playerId !== player.id) throw new NotFoundException('March not found');
    if (march.status !== 'marching') {
      throw new BadRequestException(`Cannot recall a march in status "${march.status}"`);
    }
    const now = new Date();
    const comp: MarchComposition = {
      hasKomainu: ((march.troopComposition as any)?.cavalry || 0) > 0,
    };
    const seconds = MarchService.travelTimeSeconds(march.distance, comp);
    const updated = await this.prisma.march.update({
      where: { id: marchId },
      data: {
        status: 'returning',
        state: 'RETURNING',
        departedAt: now,
        arrivesAt: new Date(now.getTime() + seconds * 1000),
      },
    });
    return serializeBigInts(updated);
  }

  /** Resolve all of a player's marches whose arrival time has passed. */
  private async resolveDueMarches(playerId: string) {
    const now = new Date();
    const due = await this.prisma.march.findMany({
      where: {
        playerId,
        status: { in: ['marching', 'returning'] },
        arrivesAt: { lte: now },
      },
    });
    for (const march of due) {
      if (march.status === 'marching') {
        await this.resolveArrival(march);
      } else if (march.status === 'returning') {
        await this.resolveReturn(march);
      }
    }
  }

  /** March reached its target: fight / gather / scout, then head home. */
  private async resolveArrival(march: any) {
    const troops: RoleCounts = (march.troopComposition as RoleCounts) || {
      infantry: 0,
      cavalry: 0,
      ranged: 0,
    };
    let result: any = { type: march.marchType };
    let survivors: RoleCounts = { ...troops };

    if (march.marchType === 'attack') {
      const attacker = this.roleCountsToStacks(troops);
      // Deterministic NPC defender scaled by distance from home.
      const defenderSize = Math.max(50, Math.round(march.distance));
      const defender: Stack[] = [
        { troopClass: 'SAMURAI_GUARD', count: Math.round(defenderSize * 0.34), attack: TROOP_ATTACK },
        { troopClass: 'KOMAINU_RIDERS', count: Math.round(defenderSize * 0.33), attack: TROOP_ATTACK },
        { troopClass: 'YUMI_ARCHERS', count: Math.round(defenderSize * 0.33), attack: TROOP_ATTACK },
      ];
      const outcome = CombatService.resolve(attacker, defender);
      const sent = MarchService.roleTotal(troops) || 1;
      const survivalRatio = Math.max(0, 1 - outcome.attacker.losses / sent);
      survivors = {
        infantry: Math.floor(troops.infantry * survivalRatio),
        cavalry: Math.floor(troops.cavalry * survivalRatio),
        ranged: Math.floor(troops.ranged * survivalRatio),
      };
      result = { type: 'attack', outcome, survivalRatio, survivors };
    } else if (march.marchType === 'gather') {
      // Credit a modest resource haul to the player's settlement.
      const settlement = await this.prisma.settlement.findUnique({
        where: { playerId: march.playerId },
      });
      const haul = Math.round(MarchService.roleTotal(troops) * 5);
      if (settlement) {
        await this.prisma.resourceStock.updateMany({
          where: { settlementId: settlement.id, resource: 'RICE' },
          data: { amount: { increment: BigInt(haul) } },
        });
      }
      result = { type: 'gather', gathered: { RICE: haul } };
    } else {
      result = { type: 'scout', revealed: { x: march.targetX, y: march.targetY } };
    }

    // Turn around and head home carrying the survivors.
    const comp: MarchComposition = { hasKomainu: (survivors.cavalry || 0) > 0 };
    const seconds = MarchService.travelTimeSeconds(march.distance, comp);
    const now = new Date();
    await this.prisma.march.update({
      where: { id: march.id },
      data: {
        status: 'returning',
        state: 'RETURNING',
        troopComposition: survivors as any,
        resultJson: serializeBigInts(result),
        departedAt: now,
        arrivesAt: new Date(now.getTime() + seconds * 1000),
      },
    });
  }

  /** March arrived home: return surviving troops to the city. */
  private async resolveReturn(march: any) {
    const troops: RoleCounts = (march.troopComposition as RoleCounts) || {
      infantry: 0,
      cavalry: 0,
      ranged: 0,
    };
    await this.adjustClassCount(march.playerId, 'SAMURAI_GUARD', troops.infantry || 0);
    await this.adjustClassCount(march.playerId, 'KOMAINU_RIDERS', troops.cavalry || 0);
    await this.adjustClassCount(march.playerId, 'YUMI_ARCHERS', troops.ranged || 0);
    await this.prisma.march.update({
      where: { id: march.id },
      data: { status: 'arrived', state: 'IDLE', resolvedAt: new Date() },
    });
  }
}
