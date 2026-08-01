import { Controller, Post, Param } from '@nestjs/common';
import { EconomyService } from './economy.service';

@Controller('economy')
export class EconomyController {
  constructor(private readonly service: EconomyService) {}

  /** Force a production tick for a settlement (also runs on a schedule). */
  @Post('settlements/:settlementId/tick')
  tick(@Param('settlementId') settlementId: string) {
    return this.service.tickSettlement(settlementId);
  }
}
