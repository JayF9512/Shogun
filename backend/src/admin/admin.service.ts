import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Admin / LiveOps operations (spec §28). Every mutating action writes an
 * AdminAuditLog entry. Server-authoritative and permission-gated in prod.
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private audit(adminUserId: string, action: string, targetType: string, targetId: string, metadata?: any) {
    return this.prisma.adminAuditLog.create({
      data: { adminUserId, action, targetType, targetId, metadata },
    });
  }

  /** Player lookup by id, display name or account email. */
  async lookupPlayer(query: string) {
    const player = await this.prisma.player.findFirst({
      where: {
        OR: [
          { id: query },
          { displayName: { contains: query, mode: 'insensitive' } },
          { account: { email: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: { account: true, settlement: true, currencyBalances: true },
    });
    if (!player) throw new NotFoundException('Player not found');
    return player;
  }

  /** Grant resources to a settlement (economy override, audited). */
  async grantResource(adminUserId: string, settlementId: string, resource: any, amount: number) {
    const stock = await this.prisma.resourceStock.upsert({
      where: { settlementId_resource: { settlementId, resource } },
      update: { amount: { increment: BigInt(amount) } },
      create: { settlementId, resource, amount: BigInt(amount) },
    });
    await this.audit(adminUserId, 'GRANT_RESOURCE', 'Settlement', settlementId, { resource, amount });
    return stock;
  }

  /** Grant currency to a player (audited, with ledger entry). */
  async grantCurrency(adminUserId: string, playerId: string, currency: any, amount: number) {
    const balance = await this.prisma.currencyBalance.upsert({
      where: { playerId_currency: { playerId, currency } },
      update: { amount: { increment: BigInt(amount) } },
      create: { playerId, currency, amount: BigInt(amount) },
    });
    await this.prisma.currencyTransaction.create({
      data: { playerId, currency, delta: BigInt(amount), reason: 'ADMIN_GRANT' },
    });
    await this.audit(adminUserId, 'GRANT_CURRENCY', 'Player', playerId, { currency, amount });
    return balance;
  }

  async banAccount(adminUserId: string, accountId: string, reason: string) {
    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: { banned: true, banReason: reason },
    });
    await this.audit(adminUserId, 'BAN', 'Account', accountId, { reason });
    return account;
  }

  async unbanAccount(adminUserId: string, accountId: string) {
    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: { banned: false, banReason: null },
    });
    await this.audit(adminUserId, 'UNBAN', 'Account', accountId);
    return account;
  }

  /** Schedule (create) an event definition. */
  async scheduleEvent(adminUserId: string, data: any) {
    const event = await this.prisma.eventDefinition.create({ data });
    await this.audit(adminUserId, 'SCHEDULE_EVENT', 'EventDefinition', event.id, { key: data.key });
    return event;
  }

  /** Override a feature flag (LiveOps kill-switch). */
  async setFeatureFlag(adminUserId: string, key: string, enabled: boolean, rolloutPct = 0) {
    const flag = await this.prisma.featureFlag.upsert({
      where: { key },
      update: { enabled, rolloutPct },
      create: { key, enabled, rolloutPct },
    });
    await this.audit(adminUserId, 'SET_FEATURE_FLAG', 'FeatureFlag', flag.id, { enabled, rolloutPct });
    return flag;
  }
}
