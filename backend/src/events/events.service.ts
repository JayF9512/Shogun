import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { resolveCurrentPlayer, serializeBigInts } from '../common/player-context';

/**
 * Events & LiveOps (spec §72). Events are time-boxed scoring competitions.
 * Points are added by other game services (marches, builds, kills) and by the
 * internal add-points hook.
 */
@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  /** List currently active events (isActive flag AND within the time window). */
  async listActive() {
    const now = new Date();
    const events = await this.prisma.eventDefinition.findMany({
      where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { endsAt: 'asc' },
    });
    return serializeBigInts(events);
  }

  /** Event detail including the current player's points, if authenticated. */
  async detail(id: string, accountId?: string) {
    const event = await this.prisma.eventDefinition.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    let myProgress: any = null;
    if (accountId) {
      const player = await resolveCurrentPlayer(this.prisma, accountId);
      const progress = await this.prisma.eventProgress.findUnique({
        where: { eventId_playerId: { eventId: id, playerId: player.id } },
      });
      myProgress = progress
        ? { points: Number(progress.score), claimed: progress.claimed }
        : { points: 0, claimed: false };
    }
    return serializeBigInts({ ...event, myProgress });
  }

  /**
   * Add points to a player's event progress (internal hook). Upserts the
   * EventProgress row and increments the score atomically.
   */
  async addPoints(accountId: string, eventId: string, points: number) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    const event = await this.prisma.eventDefinition.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const progress = await this.prisma.eventProgress.upsert({
      where: { eventId_playerId: { eventId, playerId: player.id } },
      update: { score: { increment: BigInt(points) } },
      create: { eventId, playerId: player.id, score: BigInt(points) },
    });
    return serializeBigInts({
      eventId,
      playerId: player.id,
      points: Number(progress.score),
    });
  }
}
