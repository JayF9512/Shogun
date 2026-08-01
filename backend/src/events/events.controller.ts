import { Controller, Get, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { AddPointsDto } from './dto/events.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get()
  listActive() {
    return this.service.listActive();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  detail(@Param('id') id: string, @Req() req: any) {
    return this.service.detail(id, req.user?.accountId);
  }

  /** Internal hook: add points to the current player's event progress. */
  @Post(':id/add-points')
  @UseGuards(JwtAuthGuard)
  addPoints(@Param('id') id: string, @Body() dto: AddPointsDto, @Req() req: any) {
    return this.service.addPoints(req.user.accountId, id, dto.points);
  }
}
