import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * FeatureFlagsService — data-driven access layer for the feature-flags domain.
 * Server-authoritative: all reads/writes go through Prisma (spec §98).
 */
@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(take = 50, skip = 0) {
    return this.prisma.featureFlag.findMany({ take, skip });
  }

  async findOne(id: string) {
    const row = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('FeatureFlags not found: ' + id);
    return row;
  }

  create(data: any) {
    return this.prisma.featureFlag.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.featureFlag.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.featureFlag.delete({ where: { id } });
  }
}
