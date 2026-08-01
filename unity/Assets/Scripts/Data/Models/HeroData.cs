using System;
using System.Collections.Generic;

namespace ShadowsOfTheShogun.Data
{
    /// <summary>A hero owned by the player (roster entry).</summary>
    [Serializable]
    public class HeroData
    {
        public string id;
        public string definitionKey;
        public string name;
        public int level;
        public int stars;
        public string rarity;             // COMMON..LEGENDARY
        public int attack;
        public int defense;
        public float marchBonus;          // +% march speed contribution
        public float combatBonus;         // multiplicative combat bonus
        public List<HeroSkill> skills = new();
        public List<HeroRelationship> relationships = new();
        public string equippedPetId;
    }

    [Serializable]
    public class HeroSkill
    {
        public string key;
        public string name;
        public int level;
        public int maxLevel;
        public bool unlocked;
        public List<string> prerequisites = new();
    }

    [Serializable]
    public class HeroRelationship
    {
        public string otherHeroId;
        public string otherHeroName;
        public int points;                // 0-100 affinity
        public int tier;                  // relationship tier
    }
}
