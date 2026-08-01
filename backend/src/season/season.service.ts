import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * SeasonService — data-driven access layer for the season domain.
 * Server-authoritative: all reads/writes go through Prisma (spec §98).
 */
@Injectable()
export class SeasonService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(take = 50, skip = 0) {
    return this.prisma.season_.findMany({ take, skip });
  }

  async findOne(id: string) {
    const row = await this.prisma.season_.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Season not found: ' + id);
    return row;
  }

  create(data: any) {
    return this.prisma.season_.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.season_.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.season_.delete({ where: { id } });
  }
}
