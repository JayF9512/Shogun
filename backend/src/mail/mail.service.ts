import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * MailService — data-driven access layer for the mail domain.
 * Server-authoritative: all reads/writes go through Prisma (spec §98).
 */
@Injectable()
export class MailService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(take = 50, skip = 0) {
    return this.prisma.mail.findMany({ take, skip });
  }

  async findOne(id: string) {
    const row = await this.prisma.mail.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Mail not found: ' + id);
    return row;
  }

  create(data: any) {
    return this.prisma.mail.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.mail.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.mail.delete({ where: { id } });
  }
}
