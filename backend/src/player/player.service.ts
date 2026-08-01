import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * PlayerService — data-driven access layer for the player domain.
 * Server-authoritative: all reads/writes go through Prisma (spec §98).
 */
@Injectable()
export class PlayerService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(take = 50, skip = 0) {
    return this.prisma.player.findMany({ take, skip });
  }

  async findOne(id: string) {
    const row = await this.prisma.player.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Player not found: ' + id);
    return row;
  }

  /**
   * Rich, aggregated profile for a player: identity, progression, currency
   * balances, settlement summary and roster counts. Read-only and
   * server-authoritative — the client renders this, never mutates it directly
   * (spec §98). BigInt fields are serialised to strings for JSON safety.
   */
  async getProfile(id: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      include: {
        currencyBalances: true,
        settlement: {
          include: { resourceStates: true },
        },
        _count: {
          select: {
            heroes: true,
            pets: true,
            troops: true,
            buildings: true,
            marches: true,
          },
        },
      },
    });
    if (!player) throw new NotFoundException('Player not found: ' + id);

    const currencies = player.currencyBalances.reduce<Record<string, string>>(
      (acc, b) => {
        acc[b.currency] = b.amount.toString();
        return acc;
      },
      {},
    );

    const resources = (player.settlement?.resourceStates ?? []).reduce<
      Record<string, { amount: string; capacity: string }>
    >((acc, s) => {
      acc[s.resource] = { amount: s.amount.toString(), capacity: s.capacity.toString() };
      return acc;
    }, {});

    return {
      id: player.id,
      displayName: player.displayName,
      serverId: player.serverId,
      level: player.level,
      tier: player.tier,
      industrialLevel: player.industrialLevel,
      power: player.power.toString(),
      vipLevel: player.vipLevel,
      online: player.online,
      currencies,
      settlement: player.settlement
        ? {
            id: player.settlement.id,
            name: player.settlement.name,
            resources,
          }
        : null,
      counts: player._count,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
    };
  }

  create(data: any) {
    return this.prisma.player.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.player.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.player.delete({ where: { id } });
  }
}
