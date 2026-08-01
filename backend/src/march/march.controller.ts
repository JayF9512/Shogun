import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { MarchService } from './march.service';

@Controller('marches')
export class MarchController {
  constructor(private readonly service: MarchService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.createMarch(body);
  }

  @Get('players/:playerId/cap')
  cap(@Param('playerId') _playerId: string) {
    // Returns the pure formula result for a provided level via query in real use.
    return { note: 'Use max = clamp(floor(level/5), 1, 5)' };
  }
}
