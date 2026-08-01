import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * HeroesService — data-driven access layer for the heroes domain.
 * Server-authoritative: all reads/writes go through Prisma (spec §98).
 */
@Injectable()
export class HeroesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(take = 50, skip = 0) {
    return this.prisma.playerHero.findMany({ take, skip });
  }

  async findOne(id: string) {
    const row = await this.prisma.playerHero.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Heroes not found: ' + id);
    return row;
  }

  create(data: any) {
    return this.prisma.playerHero.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.playerHero.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.playerHero.delete({ where: { id } });
  }
}
