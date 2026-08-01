import { IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class CreateClanDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  name: string;

  @IsString()
  @Length(3, 5)
  tag: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
