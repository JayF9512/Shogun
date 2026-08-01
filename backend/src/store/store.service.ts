import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * StoreService — data-driven access layer for the store domain.
 * Server-authoritative: all reads/writes go through Prisma (spec §98).
 */
@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(take = 50, skip = 0) {
    return this.prisma.catalogProduct.findMany({ take, skip });
  }

  async findOne(id: string) {
    const row = await this.prisma.catalogProduct.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Store not found: ' + id);
    return row;
  }

  create(data: any) {
    return this.prisma.catalogProduct.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.catalogProduct.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.catalogProduct.delete({ where: { id } });
  }
}
