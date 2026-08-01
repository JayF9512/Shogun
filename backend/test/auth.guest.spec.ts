import { AuthService } from '../src/auth/auth.service';

/**
 * Guest-account flow (Phase 6). Prisma + JWT are mocked so the test is a fast
 * unit test that exercises the service logic without a live database.
 */
describe('AuthService — guest accounts', () => {
  function makePrisma() {
    return {
      server: {
        findUnique: jest.fn(),
        findFirst: jest.fn().mockResolvedValue({ id: 'srv-1', name: 'Default' }),
        create: jest.fn(),
      },
      state: {
        findUnique: jest.fn(),
        findFirst: jest.fn().mockResolvedValue({ id: 'state-391', number: 391, isOpen: true }),
      },
      account: {
        create: jest.fn().mockImplementation(({ data }: any) =>
          Promise.resolve({
            id: 'acc-1',
            email: data.email,
            role: 'PLAYER',
            players: [
              {
                id: 'ply-1',
                displayName: data.players.create.displayName,
                isGuest: true,
                bindCode: data.players.create.bindCode,
                serverId: data.players.create.serverId,
                stateId: data.players.create.stateId,
                power: BigInt(0),
              },
            ],
          }),
        ),
      },
      session: { create: jest.fn().mockResolvedValue({ id: 'sess-1' }) },
    } as any;
  }

  const jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') } as any;

  it('creates a guest player attached to the open state and returns tokens', async () => {
    const prisma = makePrisma();
    const service = new AuthService(prisma, jwt);

    const result = await service.guest({});

    expect(prisma.account.create).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.refreshToken).toBeDefined();
    expect(result.player.isGuest).toBe(true);
    expect(result.player.displayName).toMatch(/^Warrior_\d{4}$/);
    // Attached to the seeded open state.
    expect(result.player.stateId).toBe('state-391');
  });

  it('generates bind codes in the SHOG-XXXXXX format', () => {
    const prisma = makePrisma();
    const service = new AuthService(prisma, jwt);
    const code = (service as any).generateBindCode();
    expect(code).toMatch(/^SHOG-[A-Z0-9]{6}$/);
  });
});
