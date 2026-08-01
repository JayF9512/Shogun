import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * SettlementService — data-driven access layer for the settlement domain.
 * Server-authoritative: all reads/writes go through Prisma (spec §98).
 */
@Injectable()
export class SettlementService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(take = 50, skip = 0) {
    return this.prisma.settlement.findMany({ take, skip });
  }

  async findOne(id: string) {
    const row = await this.prisma.settlement.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Settlement not found: ' + id);
    return row;
  }

  create(data: any) {
    return this.prisma.settlement.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.settlement.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.settlement.delete({ where: { id } });
  }
}
