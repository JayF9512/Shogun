using System;

namespace ShadowsOfTheShogun.Data
{
    /// <summary>Player profile + progression. Mirrors backend Player entity.</summary>
    [Serializable]
    public class PlayerData
    {
        public string id;
        public string accountId;
        public string serverId;
        public string displayName;
        public int level;                 // Standard level 1-30
        public long xp;
        public string tier;               // STANDARD | INDUSTRIAL
        public int industrialLevel;       // 0-10 (public)
        public int industrialSubStage;    // 0-5 (private, owner-only)
        public string clanId;
        public int power;
        public DateTime createdAt;
    }
}
