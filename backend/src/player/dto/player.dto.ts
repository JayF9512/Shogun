// DTOs for the player module. Extend with class-validator decorated fields
// as concrete endpoints are hardened. Requests are validated globally via
// ValidationPipe (whitelist + transform).
import { IsBoolean, IsOptional } from 'class-validator';

export class CreatePlayerDto {}
export class UpdatePlayerDto {}

/** Confirmation payload for permanently breaking the newcomer shield. */
export class BreakShieldDto {
  @IsOptional()
  @IsBoolean()
  confirm?: boolean;
}
