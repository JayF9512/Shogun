using System.Collections.Generic;
using UnityEngine;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Combat
{
    /// <summary>One class stack entering a battle.</summary>
    public struct Stack
    {
        public TroopClass TroopClass;
        public int Count;
        public float Attack;
        public float HeroBonus;   // multiplicative, e.g. 0.1 for +10%
    }

    public struct SidePrediction
    {
        public float Power;
        public int Losses;
    }

    public enum BattleWinner { Attacker, Defender, Draw }

    public struct BattlePrediction
    {
        public BattleWinner Winner;
        public SidePrediction Attacker;
        public SidePrediction Defender;
        public int FearGained;
    }

    /// <summary>
    /// Client-side battle prediction that reproduces the backend CombatService
    /// EXACTLY (spec §14, §98). It is used only for pre-battle previews and
    /// prediction; the server remains authoritative for the real outcome.
    ///
    /// Counter table (+25% attack vs the class you counter):
    ///   SAMURAI_GUARD  → beats KOMAINU_RIDERS
    ///   KOMAINU_RIDERS → beats YUMI_ARCHERS
    ///   YUMI_ARCHERS   → beats SAMURAI_GUARD
    ///
    ///   stackPower = count * attack * (1 + counterBonus) * (1 + heroBonus)
    ///   sidePower  = Σ stackPower(vs enemy dominant class)
    ///   losses     = round(count * enemyPower / (atkPower + defPower))
    /// </summary>
    public static class BattleResolver
    {
        /// <summary>Class that <paramref name="attacker"/> counters.</summary>
        public static TroopClass CounteredClass(TroopClass attacker) => attacker switch
        {
            TroopClass.SamuraiGuard => TroopClass.KomainuRiders,
            TroopClass.KomainuRiders => TroopClass.YumiArchers,
            TroopClass.YumiArchers => TroopClass.SamuraiGuard,
            _ => TroopClass.SamuraiGuard,
        };

        public static bool HasCounterAdvantage(TroopClass attacker, TroopClass defender)
            => CounteredClass(attacker) == defender;

        public static float StackPower(Stack stack, TroopClass vsClass)
        {
            float counterBonus = HasCounterAdvantage(stack.TroopClass, vsClass)
                ? Constants.CounterBonus : 0f;
            float heroBonus = 1f + stack.HeroBonus;
            return stack.Count * stack.Attack * (1f + counterBonus) * heroBonus;
        }

        public static TroopClass DominantClass(IReadOnlyList<Stack> side)
        {
            if (side == null || side.Count == 0) return TroopClass.SamuraiGuard;
            var best = side[0];
            for (int i = 1; i < side.Count; i++)
                if (side[i].Count > best.Count) best = side[i];
            return best.TroopClass;
        }

        public static float SidePower(IReadOnlyList<Stack> side, IReadOnlyList<Stack> enemy)
        {
            var dominant = DominantClass(enemy);
            float sum = 0f;
            for (int i = 0; i < side.Count; i++) sum += StackPower(side[i], dominant);
            return sum;
        }

        private static int Count(IReadOnlyList<Stack> side)
        {
            int n = 0;
            for (int i = 0; i < side.Count; i++) n += side[i].Count;
            return n;
        }

        /// <summary>Deterministic prediction matching CombatService.resolve.</summary>
        public static BattlePrediction Resolve(IReadOnlyList<Stack> attacker, IReadOnlyList<Stack> defender)
        {
            float atkPower = SidePower(attacker, defender);
            float defPower = SidePower(defender, attacker);
            int atkCount = Count(attacker);
            int defCount = Count(defender);

            BattleWinner winner = BattleWinner.Draw;
            if (atkPower > defPower) winner = BattleWinner.Attacker;
            else if (defPower > atkPower) winner = BattleWinner.Defender;

            float total = atkPower + defPower;
            if (total <= 0f) total = 1f;

            int atkLosses = Mathf.Min(atkCount, Mathf.RoundToInt(atkCount * (defPower / total)));
            int defLosses = Mathf.Min(defCount, Mathf.RoundToInt(defCount * (atkPower / total)));

            return new BattlePrediction
            {
                Winner = winner,
                Attacker = new SidePrediction { Power = atkPower, Losses = atkLosses },
                Defender = new SidePrediction { Power = defPower, Losses = defLosses },
                FearGained = Mathf.RoundToInt((atkLosses + defLosses) * 0.5f),
            };
        }
    }
}
