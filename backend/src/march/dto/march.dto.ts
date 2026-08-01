import { IsIn, IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class TroopCompositionDto {
  @IsOptional()
  @IsInt()
  infantry?: number;

  @IsOptional()
  @IsInt()
  cavalry?: number;

  @IsOptional()
  @IsInt()
  ranged?: number;
}

export class SendMarchDto {
  @IsInt()
  targetX: number;

  @IsInt()
  targetY: number;

  @IsObject()
  troops: TroopCompositionDto;

  @IsOptional()
  @IsString()
  heroId?: string;

  @IsIn(['attack', 'scout', 'gather'])
  marchType: 'attack' | 'scout' | 'gather';
}
