import { IsInt, IsObject, IsOptional, Max, Min } from 'class-validator';

/** Mark a tutorial step complete. `step` is the step index (0-12). */
export class CompleteStepDto {
  @IsInt()
  @Min(0)
  @Max(12)
  step!: number;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
