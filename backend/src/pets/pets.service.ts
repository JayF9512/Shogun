import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * PetsService — data-driven access layer for the pets domain.
 * Server-authoritative: all reads/writes go through Prisma (spec §98).
 */
@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(take = 50, skip = 0) {
    return this.prisma.playerPet.findMany({ take, skip });
  }

  async findOne(id: string) {
    const row = await this.prisma.playerPet.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Pets not found: ' + id);
    return row;
  }

  create(data: any) {
    return this.prisma.playerPet.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.playerPet.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.playerPet.delete({ where: { id } });
  }
}
