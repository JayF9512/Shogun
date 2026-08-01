import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * TroopsService — data-driven access layer for the troops domain.
 * Server-authoritative: all reads/writes go through Prisma (spec §98).
 */
@Injectable()
export class TroopsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(take = 50, skip = 0) {
    return this.prisma.playerTroops.findMany({ take, skip });
  }

  async findOne(id: string) {
    const row = await this.prisma.playerTroops.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Troops not found: ' + id);
    return row;
  }

  create(data: any) {
    return this.prisma.playerTroops.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.playerTroops.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.playerTroops.delete({ where: { id } });
  }
}
