using System;
using UnityEngine;

namespace ShadowsOfTheShogun.Data.Definitions
{
    /// <summary>
    /// Data-driven building config (spec §4.6, §11). Balance values live here so
    /// designers tune buildings without code changes. The server owns the
    /// authoritative copy; this is used for presentation and client prediction.
    /// </summary>
    [CreateAssetMenu(menuName = "Shogun/Building Definition", fileName = "BuildingDefinition")]
    public class BuildingDefinitionSO : ScriptableObject
    {
        [Header("Identity")]
        public string key;                // matches BuildingData.definitionKey
        public string displayNameKey;     // localisation key
        public string category;           // MILITARY | ECONOMY | SUPPORT
        public Sprite icon;
        public GameObject prefab;

        [Header("Progression")]
        public int maxLevel = 30;
        public int unlockPlayerLevel = 1;
        public BuildingLevelTier[] tiers;

        public BuildingLevelTier TierFor(int level)
        {
            if (tiers == null || tiers.Length == 0) return null;
            int idx = Mathf.Clamp(level - 1, 0, tiers.Length - 1);
            return tiers[idx];
        }
    }

    [Serializable]
    public class BuildingLevelTier
    {
        public int level;
        public long riceCost;
        public long woodCost;
        public long stoneCost;
        public long ironCost;
        public int buildTimeSeconds;
        public int requiredTenshuLevel;
    }
}
