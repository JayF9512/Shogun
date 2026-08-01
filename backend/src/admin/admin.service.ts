import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlayerRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** The acting admin, resolved from the JWT (req.user) plus request IP. */
export interface AdminActor {
  accountId: string;
  email: string;
  role: string;
  ip?: string;
}

/**
 * Admin / LiveOps operations (spec §28). Every mutating action writes an
 * AdminLog entry keyed by the acting account id + email so the trail survives
 * role changes. Access is gated by JwtAuthGuard + RolesGuard on the controller.
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Write an immutable audit-log row for a privileged action. */
  private audit(
    actor: AdminActor,
    action: string,
    targetType?: string,
    targetId?: string,
    details?: any,
  ) {
    return this.prisma.adminLog.create({
      data: {
        adminId: actor.accountId,
        adminEmail: actor.email,
        action,
        targetType,
        targetId,
        details: details ?? undefined,
        ipAddress: actor.ip,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Owner-only: appoint / demote administrators.
  // ---------------------------------------------------------------------------

  /** Promote an account (by email) to ADMIN. OWNER only. */
  async appointAdmin(actor: AdminActor, email: string) {
    const target = await this.prisma.account.findUnique({ where: { email } });
    if (!target) throw new NotFoundException('No account with that email');
    if (target.role === 'OWNER') {
      throw new BadRequestException('Cannot change the role of the owner');
    }
    const updated = await this.prisma.account.update({
      where: { id: target.id },
      data: { role: 'ADMIN' as PlayerRole },
    });
    await this.audit(actor, 'APPOINT_ADMIN', 'Account', target.id, {
      email,
      previousRole: target.role,
    });
    return { id: updated.id, email: updated.email, role: updated.role };
  }

  /** Demote an ADMIN/MODERATOR account (by email) back to PLAYER. OWNER only. */
  async demoteAdmin(actor: AdminActor, email: string) {
    const target = await this.prisma.account.findUnique({ where: { email } });
    if (!target) throw new NotFoundException('No account with that email');
    if (target.role === 'OWNER') {
      throw new BadRequestException('The owner cannot be demoted');
    }
    const updated = await this.prisma.account.update({
      where: { id: target.id },
      data: { role: 'PLAYER' as PlayerRole },
    });
    await this.audit(actor, 'DEMOTE_ADMIN', 'Account', target.id, {
      email,
      previousRole: target.role,
    });
    return { id: updated.id, email: updated.email, role: updated.role };
  }

  /** List all privileged accounts (OWNER/ADMIN/MODERATOR). OWNER only. */
  async listAdmins() {
    const admins = await this.prisma.account.findMany({
      where: { role: { in: ['OWNER', 'ADMIN', 'MODERATOR'] as PlayerRole[] } },
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { role: 'asc' },
    });
    return admins;
  }

  /** Read the admin audit log (most recent first). OWNER only. */
  async getLog(limit = 200) {
    return this.prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 500),
    });
  }

  // ---------------------------------------------------------------------------
  // Player / economy operations (ADMIN or OWNER).
  // ---------------------------------------------------------------------------

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
  async grantResource(actor: AdminActor, settlementId: string, resource: any, amount: number) {
    const stock = await this.prisma.resourceStock.upsert({
      where: { settlementId_resource: { settlementId, resource } },
      update: { amount: { increment: BigInt(amount) } },
      create: { settlementId, resource, amount: BigInt(amount) },
    });
    await this.audit(actor, 'GRANT_RESOURCE', 'Settlement', settlementId, { resource, amount });
    return stock;
  }

  /** Grant currency to a player (audited, with ledger entry). */
  async grantCurrency(actor: AdminActor, playerId: string, currency: any, amount: number) {
    const balance = await this.prisma.currencyBalance.upsert({
      where: { playerId_currency: { playerId, currency } },
      update: { amount: { increment: BigInt(amount) } },
      create: { playerId, currency, amount: BigInt(amount) },
    });
    await this.prisma.currencyTransaction.create({
      data: { playerId, currency, delta: BigInt(amount), reason: 'ADMIN_GRANT' },
    });
    await this.audit(actor, 'GRANT_CURRENCY', 'Player', playerId, { currency, amount });
    return balance;
  }

  async banAccount(actor: AdminActor, accountId: string, reason: string) {
    const target = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!target) throw new NotFoundException('Account not found');
    if (target.role === 'OWNER') throw new ForbiddenException('Cannot ban the owner');
    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: { banned: true, banReason: reason },
    });
    await this.audit(actor, 'BAN', 'Account', accountId, { reason });
    return { id: account.id, email: account.email, banned: account.banned };
  }

  async unbanAccount(actor: AdminActor, accountId: string) {
    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: { banned: false, banReason: null },
    });
    await this.audit(actor, 'UNBAN', 'Account', accountId);
    return { id: account.id, email: account.email, banned: account.banned };
  }

  /** Schedule (create) an event definition. */
  async scheduleEvent(actor: AdminActor, data: any) {
    const event = await this.prisma.eventDefinition.create({ data });
    await this.audit(actor, 'SCHEDULE_EVENT', 'EventDefinition', event.id, { key: data.key });
    return event;
  }

  /** Override a feature flag (LiveOps kill-switch). */
  async setFeatureFlag(actor: AdminActor, key: string, enabled: boolean, rolloutPct = 0) {
    const flag = await this.prisma.featureFlag.upsert({
      where: { key },
      update: { enabled, rolloutPct },
      create: { key, enabled, rolloutPct },
    });
    await this.audit(actor, 'SET_FEATURE_FLAG', 'FeatureFlag', flag.id, { enabled, rolloutPct });
    return flag;
  }
}
