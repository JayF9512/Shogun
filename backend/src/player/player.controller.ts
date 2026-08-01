import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PlayerService } from './player.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BreakShieldDto } from './dto/player.dto';

@Controller('players')
export class PlayerController {
  constructor(private readonly service: PlayerService) {}

  /**
   * The authenticated player's own profile including newcomer-shield status.
   * Declared before ':id' so the literal path is not captured as an id.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) {
    return this.service.getMe(req.user.accountId);
  }

  /** Voluntarily break the newcomer shield (requires confirm=true). */
  @Post('shield/break')
  @UseGuards(JwtAuthGuard)
  breakShield(@Req() req: any, @Body() body: BreakShieldDto) {
    return this.service.breakShield(req.user.accountId, body.confirm === true);
  }

  @Get()
  findAll(@Query('take') take?: string, @Query('skip') skip?: string) {
    return this.service.findAll(take ? +take : 50, skip ? +skip : 0);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /** Rich aggregated profile: progression, currencies, settlement, roster counts. */
  @Get(':id/profile')
  getProfile(@Param('id') id: string) {
    return this.service.getProfile(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
