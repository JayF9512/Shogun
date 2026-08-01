import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CurrencyType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { resolveCurrentPlayer, serializeBigInts } from '../common/player-context';

/**
 * MailService — player inbox for the current authenticated player.
 * Server-authoritative: all reads/writes go through Prisma (spec §98).
 *
 * Field mapping onto the shared Mail model:
 *   recipientId  -> owner of the inbox
 *   senderId     -> optional sender player
 *   attachments  -> reward payload, e.g. { "HONOUR": 500, "JADE": 10 }
 *   read/claimed -> lifecycle flags
 */
@Injectable()
export class MailService {
  constructor(private readonly prisma: PrismaService) {}

  /** Inbox for the current player, unread first then newest first. */
  async inbox(accountId: string) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    const rows = await this.prisma.mail.findMany({
      where: { recipientId: player.id },
      orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
    });
    return serializeBigInts(rows);
  }

  private async ownedMail(accountId: string, id: string) {
    const player = await resolveCurrentPlayer(this.prisma, accountId);
    const mail = await this.prisma.mail.findUnique({ where: { id } });
    if (!mail || mail.recipientId !== player.id) {
      throw new NotFoundException('Mail not found: ' + id);
    }
    return { player, mail };
  }

  /** Mark a single mail as read (ownership enforced). */
  async markRead(accountId: string, id: string) {
    const { mail } = await this.ownedMail(accountId, id);
    if (mail.read) return serializeBigInts(mail);
    const updated = await this.prisma.mail.update({
      where: { id },
      data: { read: true },
    });
    return serializeBigInts(updated);
  }

  /**
   * Claim reward attachments. Idempotent — a mail can only be claimed once.
   * Credits each currency in `attachments` to the player's CurrencyBalance.
   */
  async claim(accountId: string, id: string) {
    const { player, mail } = await this.ownedMail(accountId, id);
    if (mail.claimed) {
      throw new BadRequestException('Mail already claimed');
    }

    const attachments = (mail.attachments ?? {}) as Record<string, unknown>;
    const validCurrencies = Object.values(CurrencyType) as string[];
    const credited: Record<string, string> = {};

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const [key, rawValue] of Object.entries(attachments)) {
        const currency = key.toUpperCase();
        if (!validCurrencies.includes(currency)) continue;
        const amount = BigInt(Math.trunc(Number(rawValue) || 0));
        if (amount <= 0n) continue;
        const balance = await tx.currencyBalance.upsert({
          where: {
            playerId_currency: {
              playerId: player.id,
              currency: currency as CurrencyType,
            },
          },
          create: {
            playerId: player.id,
            currency: currency as CurrencyType,
            amount,
          },
          update: { amount: { increment: amount } },
        });
        credited[currency] = balance.amount.toString();
      }
      return tx.mail.update({
        where: { id },
        data: { claimed: true, read: true },
      });
    });

    return { mail: serializeBigInts(updated), credited };
  }

  /** Delete a single mail (ownership enforced). */
  async remove(accountId: string, id: string) {
    await this.ownedMail(accountId, id);
    await this.prisma.mail.delete({ where: { id } });
    return { deleted: true, id };
  }
}
