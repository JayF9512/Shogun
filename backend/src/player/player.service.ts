import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * PlayerService — data-driven access layer for the player domain.
 * Server-authoritative: all reads/writes go through Prisma (spec §98).
 */
@Injectable()
export class PlayerService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(take = 50, skip = 0) {
    return this.prisma.player.findMany({ take, skip });
  }

  async findOne(id: string) {
    const row = await this.prisma.player.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Player not found: ' + id);
    return row;
  }

  create(data: any) {
    return this.prisma.player.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.player.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.player.delete({ where: { id } });
  }
}
