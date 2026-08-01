using System;

namespace ShadowsOfTheShogun.Data
{
    /// <summary>The three military classes (spec §7.3).</summary>
    public enum TroopClass
    {
        SamuraiGuard,   // beats Komainu
        YumiArchers,    // beats Samurai
        KomainuRiders,  // beats Yumi
    }

    /// <summary>Aggregate troop counts a player owns of one class/tier.</summary>
    [Serializable]
    public class TroopData
    {
        public string id;
        public string troopClass;         // SAMURAI_GUARD | YUMI_ARCHERS | KOMAINU_RIDERS
        public int tier;                  // promotion tier
        public int count;
        public int wounded;               // in hospital, recoverable
        public int attack;
        public int defense;
    }
}
