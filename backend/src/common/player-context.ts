import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Resolve the game Player for an authenticated Account.
 *
 * The JWT only carries the accountId; every player-scoped endpoint needs the
 * associated Player row. An account currently maps to a single active player
 * (one realm at a time), so we take the earliest-created player.
 */
export async function resolveCurrentPlayer(prisma: PrismaService, accountId: string) {
  const player = await prisma.player.findFirst({
    where: { accountId },
    orderBy: { createdAt: 'asc' },
  });
  if (!player) throw new NotFoundException('No player found for this account');
  return player;
}

/** BigInt-safe deep serializer for API responses (BigInt -> string). */
export function serializeBigInts<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v)),
  );
}
