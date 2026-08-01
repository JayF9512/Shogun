import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ClanService — data-driven access layer for the clan domain.
 * Server-authoritative: all reads/writes go through Prisma (spec §98).
 */
@Injectable()
export class ClanService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(take = 50, skip = 0) {
    return this.prisma.clan.findMany({ take, skip });
  }

  async findOne(id: string) {
    const row = await this.prisma.clan.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Clan not found: ' + id);
    return row;
  }

  create(data: any) {
    return this.prisma.clan.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.clan.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.clan.delete({ where: { id } });
  }
}
