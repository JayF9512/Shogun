import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/** Appoint or demote an administrator by email (OWNER only). */
export class AdminEmailDto {
  @IsEmail()
  email!: string;
}

export class GrantResourceDto {
  @IsString()
  @IsNotEmpty()
  resource!: string;

  @IsNumber()
  amount!: number;
}

export class GrantCurrencyDto {
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsNumber()
  amount!: number;
}

export class BanDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class ScheduleEventDto {
  @IsObject()
  event!: Record<string, any>;
}

export class FeatureFlagDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  rolloutPct?: number;
}

export class AdminLogQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}
