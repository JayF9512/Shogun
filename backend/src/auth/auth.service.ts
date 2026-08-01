import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

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

  async register(dto: RegisterDto) {
    const existing = await this.prisma.account.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const account = await this.prisma.account.create({
      data: {
        email: dto.email,
        passwordHash,
        players: {
          create: {
            serverId: dto.serverId,
            displayName: dto.displayName,
          },
        },
      },
      include: { players: true },
    });

    const accessToken = this.signAccessToken(account);
    const refreshToken = await this.issueSession(account.id);
    return { accessToken, refreshToken, account: this.sanitize(account) };
  }

  async login(dto: LoginDto, meta?: { userAgent?: string; ip?: string }) {
    const account = await this.prisma.account.findUnique({
      where: { email: dto.email },
      include: { players: true },
    });
    if (!account) throw new UnauthorizedException('Invalid credentials');
    if (account.banned) throw new UnauthorizedException('Account banned');

    const ok = await bcrypt.compare(dto.password, account.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.account.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

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
