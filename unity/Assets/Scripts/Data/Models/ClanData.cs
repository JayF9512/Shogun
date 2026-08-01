using System;
using System.Collections.Generic;

namespace ShadowsOfTheShogun.Data
{
    /// <summary>Clan overview (spec §18).</summary>
    [Serializable]
    public class ClanData
    {
        public string id;
        public string name;
        public string tag;
        public int level;
        public long power;
        public int memberCount;
        public int memberCap;
        public string announcement;
        public List<ClanMember> members = new();
        public List<ClanTech> technologies = new();
    }

    [Serializable]
    public class ClanMember
    {
        public string playerId;
        public string displayName;
        public string role;               // LEADER | OFFICER | RETAINER | MEMBER
        public int power;
        public DateTime lastActive;
    }

    [Serializable]
    public class ClanTech
    {
        public string key;
        public string name;
        public int level;
        public int maxLevel;
    }
}
