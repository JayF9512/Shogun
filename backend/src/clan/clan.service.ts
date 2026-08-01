import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { resolveCurrentPlayer, serializeBigInts } from '../common/player-context';
import { CreateClanDto } from './dto/clan.dto';

/**
 * Clans (spec §17). A clan is created by a Leader for a HONOUR cost; players
 * request to join and are approved by Leader/R4 officers.
 */
export const CLAN_CREATE_COST = 10000; // HONOUR
const APPROVE_RANKS = ['Leader', 'R4'];

@Injectable()
export class ClanService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ensure the player has a HONOUR balance (starter grant for new players). */
  private async ensureHonour(playerId: string) {
    const bal = await this.prisma.currencyBalance.findUnique({
      where: { playerId_currency: { playerId, currency: 'HONOUR' } },
    });
    if (!bal) {
      return this.prisma.currencyBalance.create({
        data: { playerId, currency: 'HONOUR', amount: BigInt(50000) },
      });
    }
    return bal;
  }

  async create(accountId: string, dto: CreateClanDto) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);

    const already = await this.prisma.clanMember.findUnique({ where: { playerId: player.id } });
    if (already) throw new ConflictException('Player is already in a clan');

    const tagTaken = await this.prisma.clan.findFirst({
      where: { serverId: player.serverId, tag: dto.tag },
    });
    if (tagTaken) throw new ConflictException(`Clan tag [${dto.tag}] is taken`);

    await this.ensureHonour(player.id);
    // Atomic, race-safe HONOUR spend.
    const spent = await this.prisma.currencyBalance.updateMany({
      where: { playerId: player.id, currency: 'HONOUR', amount: { gte: BigInt(CLAN_CREATE_COST) } },
      data: { amount: { decrement: BigInt(CLAN_CREATE_COST) } },
    });
    if (spent.count === 0) {
      throw new BadRequestException(`Insufficient HONOUR (need ${CLAN_CREATE_COST})`);
    }
    await this.prisma.currencyTransaction.create({
      data: {
        playerId: player.id,
        currency: 'HONOUR',
        delta: BigInt(-CLAN_CREATE_COST),
        reason: 'CLAN_CREATE',
      },
    });

    const clan = await this.prisma.clan.create({
      data: {
        serverId: player.serverId,
        name: dto.name,
        tag: dto.tag,
        description: dto.description,
        leaderId: player.id,
        power: player.power,
        members: {
          create: { playerId: player.id, rank: 'Leader', approved: true },
        },
      },
      include: { members: true },
    });
    return serializeBigInts(clan);
  }

  /** Search clans by name/tag (case-insensitive). */
  async search(q?: string, take = 50, skip = 0) {
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { tag: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const clans = await this.prisma.clan.findMany({
      where,
      take,
      skip,
      orderBy: { power: 'desc' },
    });
    const withCounts = await Promise.all(
      clans.map(async (c) => ({
        ...c,
        memberCount: await this.prisma.clanMember.count({
          where: { clanId: c.id, approved: true },
        }),
      })),
    );
    return serializeBigInts(withCounts);
  }

  async detail(id: string) {
    const clan = await this.prisma.clan.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            player: { select: { id: true, displayName: true, power: true, level: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
    if (!clan) throw new NotFoundException('Clan not found');
    return serializeBigInts(clan);
  }

  async requestJoin(accountId: string, clanId: string) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    const already = await this.prisma.clanMember.findUnique({ where: { playerId: player.id } });
    if (already) {
      throw new ConflictException(
        already.approved ? 'Player is already in a clan' : 'Join request already pending',
      );
    }
    const clan = await this.prisma.clan.findUnique({
      where: { id: clanId },
      include: { members: true },
    });
    if (!clan) throw new NotFoundException('Clan not found');
    if (clan.members.filter((m) => m.approved).length >= clan.memberCap) {
      throw new BadRequestException('Clan is full');
    }
    const member = await this.prisma.clanMember.create({
      data: { clanId, playerId: player.id, rank: 'R1', approved: false },
    });
    return serializeBigInts({ success: true, pending: true, member });
  }

  private async requireOfficer(clanId: string, accountId: string) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    const me = await this.prisma.clanMember.findUnique({ where: { playerId: player.id } });
    if (!me || me.clanId !== clanId || !APPROVE_RANKS.includes(me.rank)) {
      throw new ForbiddenException('Requires Leader or R4 rank');
    }
    return { player, me };
  }

  async approve(accountId: string, clanId: string, targetPlayerId: string) {
    await this.requireOfficer(clanId, accountId);
    const target = await this.prisma.clanMember.findUnique({ where: { playerId: targetPlayerId } });
    if (!target || target.clanId !== clanId) throw new NotFoundException('Join request not found');
    if (target.approved) throw new BadRequestException('Member already approved');
    const updated = await this.prisma.clanMember.update({
      where: { id: target.id },
      data: { approved: true, rank: 'R1' },
    });
    return serializeBigInts({ success: true, member: updated });
  }

  async kick(accountId: string, clanId: string, targetPlayerId: string) {
    const { player } = await this.requireOfficer(clanId, accountId);
    if (targetPlayerId === player.id) {
      throw new BadRequestException('Use disband to leave as leader');
    }
    const target = await this.prisma.clanMember.findUnique({ where: { playerId: targetPlayerId } });
    if (!target || target.clanId !== clanId) throw new NotFoundException('Member not found');
    if (target.rank === 'Leader') throw new ForbiddenException('Cannot kick the leader');
    await this.prisma.clanMember.delete({ where: { id: target.id } });
    return { success: true, kicked: targetPlayerId };
  }

  async disband(accountId: string, clanId: string) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) throw new NotFoundException('Clan not found');
    if (clan.leaderId !== player.id) throw new ForbiddenException('Only the leader can disband');

    // Clean up dependent rows to satisfy FK constraints.
    await this.prisma.clanMember.deleteMany({ where: { clanId } });
    await this.prisma.clanRole.deleteMany({ where: { clanId } });
    await this.prisma.clanTechnology.deleteMany({ where: { clanId } });
    await this.prisma.clanBuilding.deleteMany({ where: { clanId } });
    await this.prisma.clanTerritory.deleteMany({ where: { clanId } });
    await this.prisma.clan.delete({ where: { id: clanId } });
    return { success: true, disbanded: clanId };
  }

  /** Placeholder clan territory info (spec §17.4, filled in a later phase). */
  async territory(clanId: string) {
    const clan = await this.prisma.clan.findUnique({ where: { id: clanId } });
    if (!clan) throw new NotFoundException('Clan not found');
    const territories = await this.prisma.clanTerritory.findMany({ where: { clanId } });
    return serializeBigInts({
      clanId,
      territories,
      note: 'Territory control is a placeholder pending world-map claim rules.',
    });
  }
}
