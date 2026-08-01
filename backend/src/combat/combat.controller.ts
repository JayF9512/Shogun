import { Controller, Post, Body } from '@nestjs/common';
import { CombatService, Stack } from './combat.service';

class SimulateBattleDto {
  serverId: string;
  type: 'PVE' | 'PVP' | 'SIEGE' | 'RALLY';
  x: number;
  y: number;
  attacker: Stack[];
  defender: Stack[];
  attackerPlayerId?: string;
  defenderPlayerId?: string;
}

@Controller('combat')
export class CombatController {
  constructor(private readonly service: CombatService) {}

  /** Deterministic dry-run resolution (no persistence). */
  @Post('simulate')
  simulate(@Body() body: { attacker: Stack[]; defender: Stack[] }) {
    return CombatService.resolve(body.attacker, body.defender);
  }

  @Post('resolve')
  resolve(@Body() body: SimulateBattleDto) {
    return this.service.recordBattle(body);
  }
}
