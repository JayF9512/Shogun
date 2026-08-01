import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/** Initialise (generate) a state's map. Provide stateId or stateNumber. */
export class InitStateDto {
  @IsOptional()
  @IsString()
  stateId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  stateNumber?: number;
}

/** A single map coordinate (0..1199 on each axis). */
export class CoordinateDto {
  @IsInt()
  @Min(0)
  @Max(1199)
  x!: number;

  @IsInt()
  @Min(0)
  @Max(1199)
  y!: number;
}
