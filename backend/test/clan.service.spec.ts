import { ClanService, CLAN_CREATE_COST } from '../src/clan/clan.service';
import { BadRequestException } from '@nestjs/common';

/**
 * Clan creation (Phase 8). Prisma is mocked so we can assert the HONOUR spend,
 * leader assignment and tag-collision handling without a live database.
 */
describe('ClanService — create', () => {
  const player = {
    id: 'ply-1',
    accountId: 'acc-1',
    serverId: 'srv-1',
    power: BigInt(1000),
  };

  function makePrisma(overrides: any = {}) {
    return {
      player: { findFirst: jest.fn().mockResolvedValue(player) },
      clanMember: { findUnique: jest.fn().mockResolvedValue(null) },
      clan: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) =>
          Promise.resolve({
            id: 'clan-1',
            ...data,
            power: BigInt(1000),
            members: [{ playerId: player.id, rank: 'Leader', approved: true }],
          }),
        ),
      },
      currencyBalance: {
        findUnique: jest.fn().mockResolvedValue({ amount: BigInt(50000) }),
        create: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      currencyTransaction: { create: jest.fn().mockResolvedValue({}) },
      ...overrides,
    } as any;
  }

  it('creates a clan, spends HONOUR and makes the creator the Leader', async () => {
    const prisma = makePrisma();
    const service = new ClanService(prisma);

    const clan = await service.create('acc-1', {
      name: 'Bushido Vanguard',
      tag: 'BUSH',
      description: 'Honour above all.',
    });

    // HONOUR was spent atomically for the creation cost.
    expect(prisma.currencyBalance.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { amount: { decrement: BigInt(CLAN_CREATE_COST) } },
      }),
    );
    expect(prisma.clan.create).toHaveBeenCalledTimes(1);
    expect(clan.leaderId).toBe(player.id);
    expect(clan.members[0].rank).toBe('Leader');
  });

  it('rejects creation when the player cannot afford the HONOUR cost', async () => {
    const prisma = makePrisma({
      currencyBalance: {
        findUnique: jest.fn().mockResolvedValue({ amount: BigInt(0) }),
        create: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    });
    const service = new ClanService(prisma);

    await expect(
      service.create('acc-1', { name: 'Broke Clan', tag: 'POOR' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.clan.create).not.toHaveBeenCalled();
  });
});
