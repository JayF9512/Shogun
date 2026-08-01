import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Leaderboard skeleton (spec §71 competitive / LiveOps). Provides a live
 * "power" ranking computed straight from the Player table, plus read access to
 * stored snapshots in the `Leaderboard` model and a rebuild that materialises
 * the current power ranking as a snapshot for fast reads.
 *
 * Server-authoritative: rankings are derived from persisted state only.
 */
@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** Live top-N players by power, optionally scoped to a server. */
  async powerRanking(limit = 100, serverId?: string) {
    const players = await this.prisma.player.findMany({
      where: serverId ? { serverId } : undefined,
      orderBy: { power: 'desc' },
      take: Math.min(Math.max(limit, 1), 500),
      select: {
        id: true,
        displayName: true,
        serverId: true,
        level: true,
        power: true,
      },
    });
    return players.map((p, i) => ({
      rank: i + 1,
      playerId: p.id,
      displayName: p.displayName,
      serverId: p.serverId,
      level: p.level,
      score: p.power.toString(),
    }));
  }

  /** All stored leaderboard snapshots (most recent first). */
  listSnapshots() {
    return this.prisma.leaderboard.findMany({ orderBy: { refreshedAt: 'desc' } });
  }

  /** Latest stored snapshot for a scope (GLOBAL, CLAN, EVENT). */
  latestForScope(scope: string) {
    return this.prisma.leaderboard.findFirst({
      where: { scope },
      orderBy: { refreshedAt: 'desc' },
    });
  }

  /**
   * Materialise the current global power ranking as a stored snapshot. Called
   * on a schedule (or by admin) so clients read a cached board instead of
   * recomputing every request.
   */
  async rebuildGlobalPower(limit = 100) {
    const entries = await this.powerRanking(limit);
    return this.prisma.leaderboard.create({
      data: { scope: 'GLOBAL', entries, refreshedAt: new Date() },
    });
  }
}
