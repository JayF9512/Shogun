using System.Collections.Generic;
using NUnit.Framework;
using ShadowsOfTheShogun.Combat;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Tests
{
    /// <summary>
    /// EditMode tests locking the client-side prediction to the backend
    /// CombatService rules (spec §14, §98). If these drift, client prediction
    /// and server resolution would disagree.
    /// </summary>
    public class BattleResolverTests
    {
        [Test]
        public void CounterTable_MatchesServer()
        {
            Assert.AreEqual(TroopClass.KomainuRiders, BattleResolver.CounteredClass(TroopClass.SamuraiGuard));
            Assert.AreEqual(TroopClass.YumiArchers, BattleResolver.CounteredClass(TroopClass.KomainuRiders));
            Assert.AreEqual(TroopClass.SamuraiGuard, BattleResolver.CounteredClass(TroopClass.YumiArchers));
        }

        [Test]
        public void HasCounterAdvantage_IsDirectional()
        {
            Assert.IsTrue(BattleResolver.HasCounterAdvantage(TroopClass.SamuraiGuard, TroopClass.KomainuRiders));
            Assert.IsFalse(BattleResolver.HasCounterAdvantage(TroopClass.KomainuRiders, TroopClass.SamuraiGuard));
        }

        [Test]
        public void StackPower_AppliesCounterBonus()
        {
            var stack = new Stack { TroopClass = TroopClass.SamuraiGuard, Count = 100, Attack = 10f };
            // vs Komainu → +25%; vs Yumi (no counter) → base.
            float withCounter = BattleResolver.StackPower(stack, TroopClass.KomainuRiders);
            float noCounter = BattleResolver.StackPower(stack, TroopClass.YumiArchers);
            Assert.AreEqual(100 * 10f * (1f + Constants.CounterBonus), withCounter, 0.001f);
            Assert.AreEqual(100 * 10f, noCounter, 0.001f);
        }

        [Test]
        public void StackPower_AppliesHeroBonus()
        {
            var stack = new Stack { TroopClass = TroopClass.YumiArchers, Count = 50, Attack = 8f, HeroBonus = 0.10f };
            float power = BattleResolver.StackPower(stack, TroopClass.KomainuRiders); // no counter
            Assert.AreEqual(50 * 8f * 1.10f, power, 0.001f);
        }

        [Test]
        public void Resolve_CounterSideWins()
        {
            var attacker = new List<Stack>
            {
                new() { TroopClass = TroopClass.SamuraiGuard, Count = 100, Attack = 10f },
            };
            var defender = new List<Stack>
            {
                new() { TroopClass = TroopClass.KomainuRiders, Count = 100, Attack = 10f },
            };
            var outcome = BattleResolver.Resolve(attacker, defender);
            Assert.AreEqual(BattleWinner.Attacker, outcome.Winner);
            Assert.Greater(outcome.Attacker.Power, outcome.Defender.Power);
        }

        [Test]
        public void Resolve_EqualForces_IsDraw()
        {
            var side = new List<Stack> { new() { TroopClass = TroopClass.SamuraiGuard, Count = 100, Attack = 10f } };
            var other = new List<Stack> { new() { TroopClass = TroopClass.SamuraiGuard, Count = 100, Attack = 10f } };
            var outcome = BattleResolver.Resolve(side, other);
            Assert.AreEqual(BattleWinner.Draw, outcome.Winner);
            Assert.AreEqual(outcome.Attacker.Losses, outcome.Defender.Losses);
        }

        [Test]
        public void Resolve_LossesNeverExceedHeadcount()
        {
            var attacker = new List<Stack> { new() { TroopClass = TroopClass.YumiArchers, Count = 10, Attack = 1f } };
            var defender = new List<Stack> { new() { TroopClass = TroopClass.SamuraiGuard, Count = 5000, Attack = 50f } };
            var outcome = BattleResolver.Resolve(attacker, defender);
            Assert.LessOrEqual(outcome.Attacker.Losses, 10);
            Assert.LessOrEqual(outcome.Defender.Losses, 5000);
        }
    }
}
