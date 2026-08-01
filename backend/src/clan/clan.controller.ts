import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClanService } from './clan.service';
import { CreateClanDto } from './dto/clan.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('clans')
export class ClanController {
  constructor(private readonly service: ClanService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateClanDto, @Req() req: any) {
    return this.service.create(req.user.accountId, dto);
  }

  @Get()
  search(@Query('q') q?: string, @Query('take') take?: string, @Query('skip') skip?: string) {
    return this.service.search(q, take ? +take : 50, skip ? +skip : 0);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Get(':id/territory')
  territory(@Param('id') id: string) {
    return this.service.territory(id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  join(@Param('id') id: string, @Req() req: any) {
    return this.service.requestJoin(req.user.accountId, id);
  }

  @Post(':id/members/:playerId/approve')
  @UseGuards(JwtAuthGuard)
  approve(@Param('id') id: string, @Param('playerId') playerId: string, @Req() req: any) {
    return this.service.approve(req.user.accountId, id, playerId);
  }

  @Post(':id/members/:playerId/kick')
  @UseGuards(JwtAuthGuard)
  kick(@Param('id') id: string, @Param('playerId') playerId: string, @Req() req: any) {
    return this.service.kick(req.user.accountId, id, playerId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  disband(@Param('id') id: string, @Req() req: any) {
    return this.service.disband(req.user.accountId, id);
  }
}
