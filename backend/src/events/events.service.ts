import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * EventsService — data-driven access layer for the events domain.
 * Server-authoritative: all reads/writes go through Prisma (spec §98).
 */
@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(take = 50, skip = 0) {
    return this.prisma.eventDefinition.findMany({ take, skip });
  }

  async findOne(id: string) {
    const row = await this.prisma.eventDefinition.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Events not found: ' + id);
    return row;
  }

  create(data: any) {
    return this.prisma.eventDefinition.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.eventDefinition.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.eventDefinition.delete({ where: { id } });
  }
}
