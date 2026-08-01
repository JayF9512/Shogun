import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { IsInt, IsIn, IsOptional, IsString, Min } from 'class-validator';
import { SeasonPassService } from './season-pass.service';

class AddPointsDto {
  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  seasonKey?: string;
}

class ClaimDto {
  @IsInt()
  @Min(1)
  tier!: number;

  @IsIn(['free', 'premium'])
  track!: 'free' | 'premium';

  @IsOptional()
  @IsString()
  seasonKey?: string;
}

/**
 * Season Pass endpoints (spec §71). Prefixed with `/season-pass`.
 * Definition is read-only; progress is server-authoritative per player.
 */
@Controller('season-pass')
export class SeasonPassController {
  constructor(private readonly pass: SeasonPassService) {}

  /** The static tier ladder (points thresholds + rewards). */
  @Get()
  definition() {
    return this.pass.definition();
  }

  /** A player's current progress, current tier and claimable tiers. */
  @Get(':playerId')
  getProgress(@Param('playerId') playerId: string, @Query('seasonKey') seasonKey?: string) {
    return this.pass.getProgress(playerId, seasonKey);
  }

  /** Grant pass points to a player (earned via play). */
  @Post(':playerId/points')
  addPoints(@Param('playerId') playerId: string, @Body() dto: AddPointsDto) {
    return this.pass.addPoints(playerId, dto.amount, dto.seasonKey);
  }

  /** Unlock the premium track (called after a verified pass purchase). */
  @Post(':playerId/unlock-premium')
  unlockPremium(@Param('playerId') playerId: string, @Body('seasonKey') seasonKey?: string) {
    return this.pass.unlockPremium(playerId, seasonKey);
  }

  /** Claim a tier reward on the free or premium track. */
  @Post(':playerId/claim')
  claim(@Param('playerId') playerId: string, @Body() dto: ClaimDto) {
    return this.pass.claim(playerId, dto.tier, dto.track, dto.seasonKey);
  }
}
