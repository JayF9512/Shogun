import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { resolveCurrentPlayer, serializeBigInts } from '../common/player-context';
import { CreateStateDto } from './dto/states.dto';

/**
 * State/server system (spec §6). A "state" is a numbered realm players join.
 * Season-end migration is allowed only to nearby states (±20 by number).
 */
export const MIGRATION_RANGE = 20;

@Injectable()
export class StatesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Default per-state capacity and the threshold that opens the next state. */
  static readonly DEFAULT_PLAYER_CAP = 2000;
  static readonly DEFAULT_OPEN_THRESHOLD = 1900;

  async create(dto: CreateStateDto) {
    const existing = await this.prisma.state.findUnique({ where: { number: dto.number } });
    if (existing) throw new ConflictException(`State ${dto.number} already exists`);
    const state = await this.prisma.state.create({
      data: {
        name: dto.name,
        number: dto.number,
        isOpen: dto.isOpen ?? true,
        playerCap: dto.playerCap ?? StatesService.DEFAULT_PLAYER_CAP,
        openThreshold: dto.openThreshold ?? StatesService.DEFAULT_OPEN_THRESHOLD,
      },
    });
    await this.autoOpenNextStates();
    return state;
  }

  /**
   * Progressive state opening: a state N+1 only opens once state N has reached
   * its openThreshold. When the highest existing state crosses its threshold,
   * the next consecutive state is created (open); any pre-existing but closed
   * next state is opened. Idempotent and safe to call on every list/join.
   */
  async autoOpenNextStates() {
    const states = await this.prisma.state.findMany({ orderBy: { number: 'asc' } });
    if (states.length === 0) return;

    for (const state of states) {
      const count = await this.prisma.player.count({ where: { stateId: state.id } });
      if (count < state.openThreshold) continue;

      const nextNumber = state.number + 1;
      const next = await this.prisma.state.findUnique({ where: { number: nextNumber } });
      if (!next) {
        await this.prisma.state.create({
          data: {
            name: `State ${nextNumber}`,
            number: nextNumber,
            isOpen: true,
            playerCap: StatesService.DEFAULT_PLAYER_CAP,
            openThreshold: StatesService.DEFAULT_OPEN_THRESHOLD,
          },
        });
      } else if (!next.isOpen) {
        await this.prisma.state.update({ where: { id: next.id }, data: { isOpen: true } });
      }
    }
  }

  async list() {
    // Ensure progressive opening is up to date before returning the list.
    await this.autoOpenNextStates();
    const states = await this.prisma.state.findMany({ orderBy: { number: 'asc' } });
    const withCounts = await Promise.all(
      states.map(async (s) => ({
        ...s,
        playerCount: await this.prisma.player.count({ where: { stateId: s.id } }),
      })),
    );
    return withCounts.map((s) => ({
      ...s,
      isFull: s.playerCount >= s.playerCap,
      openProgress: Math.min(1, s.playerCount / s.openThreshold),
    }));
  }

  async detail(id: string) {
    const state = await this.prisma.state.findUnique({ where: { id } });
    if (!state) throw new NotFoundException('State not found');
    const playerCount = await this.prisma.player.count({ where: { stateId: id } });
    const topPlayers = await this.prisma.player.findMany({
      where: { stateId: id },
      orderBy: { power: 'desc' },
      take: 10,
      select: { id: true, displayName: true, power: true, level: true, tier: true },
    });
    return serializeBigInts({ ...state, playerCount, topPlayers });
  }

  async join(accountId: string, stateId: string) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    if (player.stateId) {
      throw new ConflictException('Player already belongs to a state');
    }
    const state = await this.prisma.state.findUnique({ where: { id: stateId } });
    if (!state) throw new NotFoundException('State not found');
    if (!state.isOpen) throw new BadRequestException('State is closed to new players');

    const count = await this.prisma.player.count({ where: { stateId } });
    if (count >= state.playerCap) throw new BadRequestException('State is full');

    const updated = await this.prisma.player.update({
      where: { id: player.id },
      data: { stateId },
    });
    // Opening this state's successor may now be warranted.
    await this.autoOpenNextStates();
    return serializeBigInts({ success: true, player: updated });
  }

  /** States the current player is allowed to migrate to (±20 by number). */
  async availableMigrations(accountId: string) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    if (!player.stateId) {
      throw new BadRequestException('Player has no current state to migrate from');
    }
    const current = await this.prisma.state.findUnique({ where: { id: player.stateId } });
    if (!current) throw new NotFoundException('Current state not found');

    const candidates = await this.prisma.state.findMany({
      where: {
        isOpen: true,
        number: {
          gte: current.number - MIGRATION_RANGE,
          lte: current.number + MIGRATION_RANGE,
        },
        NOT: { id: current.id },
      },
      orderBy: { number: 'asc' },
    });
    const withCounts = await Promise.all(
      candidates.map(async (s) => ({
        ...s,
        playerCount: await this.prisma.player.count({ where: { stateId: s.id } }),
      })),
    );
    return { currentState: current, available: withCounts };
  }

  async requestMigration(accountId: string, fromStateId: string, targetStateNumber: number) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    if (player.stateId !== fromStateId) {
      throw new ForbiddenException('Player does not belong to this state');
    }
    const current = await this.prisma.state.findUnique({ where: { id: fromStateId } });
    if (!current) throw new NotFoundException('Current state not found');

    const target = await this.prisma.state.findUnique({ where: { number: targetStateNumber } });
    if (!target) throw new NotFoundException('Target state not found');
    if (!target.isOpen) throw new BadRequestException('Target state is closed');
    if (Math.abs(target.number - current.number) > MIGRATION_RANGE) {
      throw new BadRequestException(
        `Migration only allowed within ±${MIGRATION_RANGE} states (from ${current.number})`,
      );
    }
    const count = await this.prisma.player.count({ where: { stateId: target.id } });
    if (count >= target.playerCap) throw new BadRequestException('Target state is full');

    const updated = await this.prisma.player.update({
      where: { id: player.id },
      data: { stateId: target.id },
    });
    return serializeBigInts({
      success: true,
      message: `Migrated from State ${current.number} to State ${target.number}`,
      player: updated,
    });
  }
}
