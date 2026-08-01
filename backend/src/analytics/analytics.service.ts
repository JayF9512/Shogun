import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * AnalyticsService — data-driven access layer for the analytics domain.
 * Server-authoritative: all reads/writes go through Prisma (spec §98).
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(take = 50, skip = 0) {
    return this.prisma.analyticsEvent.findMany({ take, skip });
  }

  async findOne(id: string) {
    const row = await this.prisma.analyticsEvent.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Analytics not found: ' + id);
    return row;
  }

  create(data: any) {
    return this.prisma.analyticsEvent.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.analyticsEvent.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.analyticsEvent.delete({ where: { id } });
  }
}
