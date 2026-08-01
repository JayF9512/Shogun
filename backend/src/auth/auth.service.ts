import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PlayerRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, GuestDto, BindDto } from './dto/auth.dto';

/**
 * Auth: account registration, login and session/refresh-token management.
 * Passwords are bcrypt-hashed; secrets live in env only (spec §111, §114).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private signAccessToken(account: { id: string; email: string; role: string }) {
    return this.jwt.sign(
      { sub: account.id, email: account.email, role: account.role },
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    );
  }

  private async issueSession(accountId: string, meta?: { userAgent?: string; ip?: string }) {
    const refreshToken = await bcrypt.hash(`${accountId}:${Date.now()}:${Math.random()}`, 8);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30d
    await this.prisma.session.create({
      data: {
        accountId,
        refreshToken,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ip,
        expiresAt,
      },
    });
    return refreshToken;
  }

  /**
   * Returns true when the given email is the configured owner super-admin.
   * Comparison is case-insensitive and trimmed. Empty OWNER_EMAIL disables it.
   */
  private isOwnerEmail(email: string): boolean {
    const owner = (process.env.OWNER_EMAIL || '').toLowerCase().trim();
    return owner.length > 0 && email.toLowerCase().trim() === owner;
  }

  /** New players receive a 10-day newcomer protection shield. */
  static readonly SHIELD_DAYS = 10;
  private newShieldEndsAt(): Date {
    return new Date(Date.now() + AuthService.SHIELD_DAYS * 24 * 60 * 60 * 1000);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.account.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    // The configured owner email automatically becomes the super-admin (OWNER).
    const role: PlayerRole = this.isOwnerEmail(dto.email) ? 'OWNER' : 'PLAYER';
    const account = await this.prisma.account.create({
      data: {
        email: dto.email,
        passwordHash,
        role,
        players: {
          create: {
            serverId: dto.serverId,
            displayName: dto.displayName,
            shieldEndsAt: this.newShieldEndsAt(),
          },
        },
      },
      include: { players: true },
    });

    const accessToken = this.signAccessToken(account);
    const refreshToken = await this.issueSession(account.id);
    return { accessToken, refreshToken, account: this.sanitize(account) };
  }

  /**
   * Ensure a default Server exists (Player.serverId is required). Guests and
   * the state system attach to this internal record.
   */
  private async defaultServer() {
    const existing = await this.prisma.server.findFirst({ orderBy: { createdAt: 'asc' } });
    if (existing) return existing;
    return this.prisma.server.create({
      data: { name: 'Default Realm', region: 'eu', environment: 'PRODUCTION' },
    });
  }

  /** Short human-friendly recovery code, e.g. "SHOG-7F3K9A". */
  private generateBindCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
    return `SHOG-${s}`;
  }

  /**
   * Create a guest player with no email/password. Returns the same
   * { accessToken, refreshToken, player } shape as register/login.
   */
  async guest(dto: GuestDto = {}, meta?: { userAgent?: string; ip?: string }) {
    const server = dto.serverId
      ? await this.prisma.server.findUnique({ where: { id: dto.serverId } })
      : await this.defaultServer();
    if (!server) throw new NotFoundException('Server not found');

    // Attach to the lowest-numbered open state (State 1 by default).
    let stateId: string | undefined;
    if (dto.stateNumber != null) {
      const state = await this.prisma.state.findUnique({ where: { number: Number(dto.stateNumber) } });
      stateId = state?.id;
    } else {
      const openState = await this.prisma.state.findFirst({
        where: { isOpen: true },
        orderBy: { number: 'asc' },
      });
      stateId = openState?.id;
    }

    const suffix = Math.floor(1000 + Math.random() * 9000);
    const displayName = `Warrior_${suffix}`;
    // Synthetic, unique, non-loginable email so the Account row stays valid.
    const email = `guest_${Date.now()}_${suffix}@guest.shogun.local`;
    const passwordHash = await bcrypt.hash(`${email}:${Math.random()}`, 8);

    // bindCode is unique; retry on the rare collision.
    let account;
    for (let attempt = 0; attempt < 5; attempt++) {
      const bindCode = this.generateBindCode();
      try {
        account = await this.prisma.account.create({
          data: {
            email,
            passwordHash,
            players: {
              create: {
                serverId: server.id,
                stateId,
                displayName,
                isGuest: true,
                bindCode,
                shieldEndsAt: this.newShieldEndsAt(),
              },
            },
          },
          include: { players: true },
        });
        break;
      } catch (e: any) {
        if (attempt === 4) throw e;
      }
    }

    const accessToken = this.signAccessToken(account);
    const refreshToken = await this.issueSession(account.id, meta);
    return {
      accessToken,
      refreshToken,
      player: this.serializePlayer(account.players[0]),
    };
  }

  /**
   * Bind the authenticated guest account to a real email + password.
   * Warns (needsMigration) if the target email already owns a player on a
   * different state, so the client can offer to migrate progress.
   */
  async bind(accountId: string, dto: BindDto) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { players: true },
    });
    if (!account) throw new NotFoundException('Account not found');

    const player = account.players[0];
    if (player && !player.isGuest) {
      throw new ConflictException('Account is already bound to a full profile');
    }

    // Is the target email already a real account (possibly on another state)?
    const emailTaken = await this.prisma.account.findUnique({
      where: { email: dto.email },
      include: { players: true },
    });
    if (emailTaken && emailTaken.id !== accountId) {
      const other = emailTaken.players[0];
      const sameState = other && player && other.stateId && other.stateId === player.stateId;
      return {
        needsMigration: !sameState,
        message: sameState
          ? 'An account with this email already exists on this state.'
          : 'An account with this email already exists on another state. Migration required to merge progress.',
        existingPlayerId: other?.id ?? null,
        existingStateId: other?.stateId ?? null,
      };
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const updated = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        email: dto.email,
        passwordHash,
        players: player
          ? {
              update: {
                where: { id: player.id },
                data: {
                  isGuest: false,
                  displayName: dto.displayName ?? player.displayName,
                },
              },
            }
          : undefined,
      },
      include: { players: true },
    });

    const accessToken = this.signAccessToken(updated);
    const refreshToken = await this.issueSession(updated.id);
    return {
      accessToken,
      refreshToken,
      player: this.serializePlayer(updated.players[0]),
      account: this.sanitize(updated),
    };
  }

  /** BigInt-safe player serialization for auth responses. */
  private serializePlayer(player: any) {
    if (!player) return null;
    return { ...player, power: player.power != null ? player.power.toString() : '0' };
  }

  async login(dto: LoginDto, meta?: { userAgent?: string; ip?: string }) {
    let account = await this.prisma.account.findUnique({
      where: { email: dto.email },
      include: { players: true },
    });
    if (!account) throw new UnauthorizedException('Invalid credentials');
    if (account.banned) throw new UnauthorizedException('Account banned');

    const ok = await bcrypt.compare(dto.password, account.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    // Auto-promote the configured owner email to OWNER on login. This covers
    // owners who registered before OWNER_EMAIL was set.
    const shouldBeOwner = this.isOwnerEmail(account.email) && account.role !== 'OWNER';
    const updated = await this.prisma.account.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date(), ...(shouldBeOwner ? { role: 'OWNER' as PlayerRole } : {}) },
      include: { players: true },
    });
    account = updated;

    const accessToken = this.signAccessToken(account);
    const refreshToken = await this.issueSession(account.id, meta);
    return { accessToken, refreshToken, account: this.sanitize(account) };
  }

  async refresh(refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { account: true },
    });
    if (!session || session.revoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired session');
    }
    const accessToken = this.signAccessToken(session.account);
    return { accessToken };
  }

  async logout(refreshToken: string) {
    await this.prisma.session
      .update({ where: { refreshToken }, data: { revoked: true } })
      .catch(() => undefined);
    return { success: true };
  }

  private sanitize(account: any) {
    const { passwordHash, ...rest } = account;
    return rest;
  }
}
