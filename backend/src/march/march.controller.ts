import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { MarchService } from './march.service';
import { SendMarchDto } from './dto/march.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('march')
export class MarchController {
  constructor(private readonly service: MarchService) {}

  /** Send a march (attack / scout / gather). */
  @Post()
  @UseGuards(JwtAuthGuard)
  send(@Body() dto: SendMarchDto, @Req() req: any) {
    return this.service.sendMarch(req.user.accountId, dto);
  }

  /** List the player's marches; resolves any that have arrived. */
  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Req() req: any) {
    return this.service.listMarches(req.user.accountId);
  }

  /** Recall a march before it reaches its target. */
  @Post(':id/recall')
  @UseGuards(JwtAuthGuard)
  recall(@Param('id') id: string, @Req() req: any) {
    return this.service.recall(req.user.accountId, id);
  }
}
