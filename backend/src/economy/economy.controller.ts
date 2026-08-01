import { Controller, Post, Get, Param, Req, UseGuards } from '@nestjs/common';
import { EconomyService } from './economy.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('economy')
export class EconomyController {
  constructor(private readonly service: EconomyService) {}

  /**
   * Player-triggered production tick (spec §98). Called on login/resume,
   * rate-limited to once per minute per player.
   */
  @Post('tick')
  @UseGuards(JwtAuthGuard)
  tickPlayer(@Req() req: any) {
    return this.service.playerTick(req.user.accountId);
  }

  /** All resource balances + production rates for the current player. */
  @Get('resources')
  @UseGuards(JwtAuthGuard)
  resources(@Req() req: any) {
    return this.service.playerResources(req.user.accountId);
  }

  /** Force a production tick for a specific settlement (also runs on a schedule). */
  @Post('settlements/:settlementId/tick')
  tick(@Param('settlementId') settlementId: string) {
    return this.service.tickSettlement(settlementId);
  }
}
