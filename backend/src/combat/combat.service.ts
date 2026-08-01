import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Three-class counter system (spec §3, §7.3):
 *   SAMURAI_GUARD  beats  KOMAINU_RIDERS
 *   KOMAINU_RIDERS beats  YUMI_ARCHERS
 *   YUMI_ARCHERS   beats  SAMURAI_GUARD
 *
 * Counter bonus: +25% attack against the class you counter.
 * Battle power = troops * attack * (1 + counterBonus) * heroBonus
 *
 * All combat is resolved server-side (spec §98). The pure helpers below are
 * intentionally free of I/O so they can be unit-tested deterministically.
 */
export type TroopClass = 'SAMURAI_GUARD' | 'YUMI_ARCHERS' | 'KOMAINU_RIDERS';

export const COUNTER_BONUS = 0.25;

export interface Stack {
  troopClass: TroopClass;
  count: number;
  attack: number;
  heroBonus?: number; // multiplicative, e.g. 0.1 for +10%
}

export interface SideResult {
  power: number;
  losses: number;
}

export interface BattleOutcome {
  winner: 'ATTACKER' | 'DEFENDER' | 'DRAW';
  attacker: SideResult;
  defender: SideResult;
  fearGained: number;
}

@Injectable()
export class CombatService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the class that `attacker` counters (deals bonus damage to). */
  static counteredClass(attacker: TroopClass): TroopClass {
    switch (attacker) {
      case 'SAMURAI_GUARD':
        return 'KOMAINU_RIDERS';
      case 'KOMAINU_RIDERS':
        return 'YUMI_ARCHERS';
      case 'YUMI_ARCHERS':
        return 'SAMURAI_GUARD';
    }
  }

  /** True when `attacker` has the counter advantage over `defender`. */
  static hasCounterAdvantage(attacker: TroopClass, defender: TroopClass): boolean {
    return CombatService.counteredClass(attacker) === defender;
  }

  /**
   * Power of a single stack against a specific enemy class.
   * Applies the +25% counter bonus when the stack counters `vsClass`.
   */
  static stackPower(stack: Stack, vsClass: TroopClass): number {
    const counterBonus = CombatService.hasCounterAdvantage(stack.troopClass, vsClass)
      ? COUNTER_BONUS
      : 0;
    const heroBonus = 1 + (stack.heroBonus ?? 0);
    return stack.count * stack.attack * (1 + counterBonus) * heroBonus;
  }

  /**
   * Total power of a side's stacks against the enemy's dominant class.
   * The dominant class is the enemy class with the largest headcount.
   */
  static sidePower(side: Stack[], enemy: Stack[]): number {
    const dominant = CombatService.dominantClass(enemy);
    return side.reduce((sum, s) => sum + CombatService.stackPower(s, dominant), 0);
  }

  static dominantClass(side: Stack[]): TroopClass {
    if (side.length === 0) return 'SAMURAI_GUARD';
    return side.reduce((best, s) => (s.count > best.count ? s : best)).troopClass;
  }

  /**
   * Resolve a battle between two sides. Losses scale with the ratio of the
   * losing side's power to the winning side's power (the weaker side loses
   * proportionally more troops). Fully deterministic.
   */
  static resolve(attacker: Stack[], defender: Stack[]): BattleOutcome {
    const atkPower = CombatService.sidePower(attacker, defender);
    const defPower = CombatService.sidePower(defender, attacker);
    const atkCount = attacker.reduce((n, s) => n + s.count, 0);
    const defCount = defender.reduce((n, s) => n + s.count, 0);

    let winner: BattleOutcome['winner'] = 'DRAW';
    if (atkPower > defPower) winner = 'ATTACKER';
    else if (defPower > atkPower) winner = 'DEFENDER';

    const total = atkPower + defPower || 1;
    // Loser loses more; winner loses in proportion to the fight's closeness.
    const attackerLosses = Math.min(atkCount, Math.round(atkCount * (defPower / total)));
    const defenderLosses = Math.min(defCount, Math.round(defCount * (atkPower / total)));

    return {
      winner,
      attacker: { power: atkPower, losses: attackerLosses },
      defender: { power: defPower, losses: defenderLosses },
      fearGained: Math.round((attackerLosses + defenderLosses) * 0.5),
    };
  }

  /** Persist a resolved battle and its report. */
  async recordBattle(params: {
    serverId: string;
    type: 'PVE' | 'PVP' | 'SIEGE' | 'RALLY';
    x: number;
    y: number;
    attacker: Stack[];
    defender: Stack[];
    attackerPlayerId?: string;
    defenderPlayerId?: string;
  }) {
    const outcome = CombatService.resolve(params.attacker, params.defender);
    const battle = await this.prisma.battle.create({
      data: {
        serverId: params.serverId,
        type: params.type,
        x: params.x,
        y: params.y,
        resolvedAt: new Date(),
        winnerPlayerId:
          outcome.winner === 'ATTACKER'
            ? params.attackerPlayerId
            : outcome.winner === 'DEFENDER'
              ? params.defenderPlayerId
              : null,
        report: { create: { summary: outcome as any, fearGained: outcome.fearGained } },
      },
      include: { report: true },
    });
    return { battle, outcome };
  }
}
