import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { MapService } from './map.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CoordinateDto, InitStateDto } from './dto/map.dto';

/** Coordinate-map endpoints (Stage 1). */
@Controller('map')
export class MapController {
  constructor(private readonly service: MapService) {}

  /** Generate a state's map (mines/monsters/structures). ADMIN or OWNER. */
  @Post('init-state')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  initState(@Body() body: InitStateDto) {
    return this.service.initState(body);
  }

  /** Read a window of tiles around (x,y). */
  @Get('tiles')
  tiles(
    @Query('stateId') stateId: string,
    @Query('x') x?: string,
    @Query('y') y?: string,
    @Query('range') range?: string,
  ) {
    const cx = x ? parseInt(x, 10) : 600;
    const cy = y ? parseInt(y, 10) : 600;
    const r = range ? parseInt(range, 10) : 25;
    return this.service.tiles(stateId, cx, cy, r);
  }

  /** Place the authenticated player's castle (2x2) at (x,y). */
  @Post('place-castle')
  @UseGuards(JwtAuthGuard)
  placeCastle(@Req() req: any, @Body() body: CoordinateDto) {
    return this.service.placeCastle(req.user.accountId, body.x, body.y);
  }

  /** Move the authenticated player's castle to a free (x,y). */
  @Post('teleport')
  @UseGuards(JwtAuthGuard)
  teleport(@Req() req: any, @Body() body: CoordinateDto) {
    return this.service.teleport(req.user.accountId, body.x, body.y);
  }
}
