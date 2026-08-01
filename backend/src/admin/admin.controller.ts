import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminActor, AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  AdminEmailDto,
  BanDto,
  FeatureFlagDto,
  GrantCurrencyDto,
  GrantResourceDto,
  ScheduleEventDto,
} from './dto/admin.dto';

/**
 * Admin endpoints (spec §28). Protected by JwtAuthGuard + RolesGuard.
 * - OWNER-only: appoint/demote administrators and read the audit log.
 * - ADMIN (and OWNER): all LiveOps/player operations.
 * The acting admin is resolved from the JWT (req.user), never the request body.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly service: AdminService) {}

  /** Build the audit actor from the authenticated request. */
  private actor(req: any): AdminActor {
    return {
      accountId: req.user?.accountId,
      email: req.user?.email,
      role: req.user?.role,
      ip: req.ip || req.headers?.['x-forwarded-for'] || undefined,
    };
  }

  // --- Owner-only: administrator management + audit log ---------------------

  @Post('appoint')
  @Roles('OWNER')
  appoint(@Req() req: any, @Body() body: AdminEmailDto) {
    return this.service.appointAdmin(this.actor(req), body.email);
  }

  @Post('demote')
  @Roles('OWNER')
  demote(@Req() req: any, @Body() body: AdminEmailDto) {
    return this.service.demoteAdmin(this.actor(req), body.email);
  }

  @Get('admins')
  @Roles('OWNER')
  admins() {
    return this.service.listAdmins();
  }

  @Get('log')
  @Roles('OWNER')
  log(@Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 200;
    return this.service.getLog(Number.isFinite(n) ? n : 200);
  }

  // --- Admin (or Owner): LiveOps / player operations -----------------------

  @Get('players/lookup')
  @Roles('ADMIN')
  lookup(@Query('q') q: string) {
    return this.service.lookupPlayer(q);
  }

  @Post('settlements/:id/grant-resource')
  @Roles('ADMIN')
  grantResource(
    @Req() req: any,
    @Param('id') settlementId: string,
    @Body() body: GrantResourceDto,
  ) {
    return this.service.grantResource(this.actor(req), settlementId, body.resource, body.amount);
  }

  @Post('players/:id/grant-currency')
  @Roles('ADMIN')
  grantCurrency(
    @Req() req: any,
    @Param('id') playerId: string,
    @Body() body: GrantCurrencyDto,
  ) {
    return this.service.grantCurrency(this.actor(req), playerId, body.currency, body.amount);
  }

  @Post('accounts/:id/ban')
  @Roles('ADMIN')
  ban(@Req() req: any, @Param('id') accountId: string, @Body() body: BanDto) {
    return this.service.banAccount(this.actor(req), accountId, body.reason);
  }

  @Post('accounts/:id/unban')
  @Roles('ADMIN')
  unban(@Req() req: any, @Param('id') accountId: string) {
    return this.service.unbanAccount(this.actor(req), accountId);
  }

  @Post('events/schedule')
  @Roles('ADMIN')
  scheduleEvent(@Req() req: any, @Body() body: ScheduleEventDto) {
    return this.service.scheduleEvent(this.actor(req), body.event);
  }

  @Post('feature-flags')
  @Roles('ADMIN')
  setFlag(@Req() req: any, @Body() body: FeatureFlagDto) {
    return this.service.setFeatureFlag(this.actor(req), body.key, body.enabled, body.rolloutPct);
  }
}
