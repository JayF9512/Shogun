using System;
using System.Collections.Generic;

namespace ShadowsOfTheShogun.Data
{
    /// <summary>Server-resolved battle outcome + report (spec §14).</summary>
    [Serializable]
    public class BattleData
    {
        public string id;
        public string type;               // PVE | PVP | SIEGE | RALLY
        public int x;
        public int y;
        public string winner;             // ATTACKER | DEFENDER | DRAW
        public SideResult attacker;
        public SideResult defender;
        public int fearGained;
        public List<LootItem> loot = new();
        public DateTime resolvedAt;
    }

    [Serializable]
    public class SideResult
    {
        public string playerId;
        public float power;
        public int losses;
    }

    [Serializable]
    public class LootItem
    {
        public string resource;
        public long amount;
    }
}
