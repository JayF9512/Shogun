import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

/**
 * Leaderboard endpoints (spec §71). Prefixed with `/leaderboards`.
 * Read-only rankings plus an admin/scheduler rebuild hook.
 */
@Controller('leaderboards')
export class LeaderboardController {
  constructor(private readonly service: LeaderboardService) {}

  /** Live global (or per-server) power ranking. */
  @Get('power')
  power(@Query('limit') limit?: string, @Query('serverId') serverId?: string) {
    return this.service.powerRanking(limit ? +limit : 100, serverId);
  }

  /** All stored snapshots. */
  @Get()
  list() {
    return this.service.listSnapshots();
  }

  /** Latest stored snapshot for a scope (GLOBAL, CLAN, EVENT). */
  @Get(':scope')
  latest(@Param('scope') scope: string) {
    return this.service.latestForScope(scope.toUpperCase());
  }

  /** Rebuild + persist the global power snapshot. */
  @Post('rebuild/power')
  rebuild(@Query('limit') limit?: string) {
    return this.service.rebuildGlobalPower(limit ? +limit : 100);
  }
}
