import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

/**
 * Admin endpoints (spec §28). In production these are protected by an admin
 * JWT guard + AdminPermission checks; the adminUserId is taken from the token.
 */
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('players/lookup')
  lookup(@Query('q') q: string) {
    return this.service.lookupPlayer(q);
  }

  @Post('settlements/:id/grant-resource')
  grantResource(
    @Param('id') settlementId: string,
    @Body() body: { adminUserId: string; resource: string; amount: number },
  ) {
    return this.service.grantResource(body.adminUserId, settlementId, body.resource, body.amount);
  }

  @Post('players/:id/grant-currency')
  grantCurrency(
    @Param('id') playerId: string,
    @Body() body: { adminUserId: string; currency: string; amount: number },
  ) {
    return this.service.grantCurrency(body.adminUserId, playerId, body.currency, body.amount);
  }

  @Post('accounts/:id/ban')
  ban(@Param('id') accountId: string, @Body() body: { adminUserId: string; reason: string }) {
    return this.service.banAccount(body.adminUserId, accountId, body.reason);
  }

  @Post('accounts/:id/unban')
  unban(@Param('id') accountId: string, @Body() body: { adminUserId: string }) {
    return this.service.unbanAccount(body.adminUserId, accountId);
  }

  @Post('events/schedule')
  scheduleEvent(@Body() body: { adminUserId: string; event: any }) {
    return this.service.scheduleEvent(body.adminUserId, body.event);
  }

  @Post('feature-flags')
  setFlag(
    @Body() body: { adminUserId: string; key: string; enabled: boolean; rolloutPct?: number },
  ) {
    return this.service.setFeatureFlag(body.adminUserId, body.key, body.enabled, body.rolloutPct);
  }
}
