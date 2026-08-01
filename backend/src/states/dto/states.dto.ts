import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateStateDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsInt()
  @Min(1)
  number: number;

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  playerCap?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  openThreshold?: number;
}

export class RequestMigrationDto {
  @IsInt()
  @Min(1)
  targetStateNumber: number;
}
