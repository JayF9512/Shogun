import { Controller, Get, Post, Param } from '@nestjs/common';
import { ProgressionService } from './progression.service';

@Controller('progression')
export class ProgressionController {
  constructor(private readonly service: ProgressionService) {}

  @Get(':playerId/ascension')
  status(@Param('playerId') playerId: string) {
    return this.service.getAscensionStatus(playerId);
  }

  @Post(':playerId/ascend')
  ascend(@Param('playerId') playerId: string) {
    return this.service.ascend(playerId);
  }
}
