import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

export interface MarchComposition {
  hasKomainu: boolean;
  heroMarchBonus?: number; // e.g. 0.15 for +15%
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
}
