using UnityEngine;

namespace ShadowsOfTheShogun.Data.Definitions
{
    /// <summary>Data-driven troop class config (spec §7, §8).</summary>
    [CreateAssetMenu(menuName = "Shogun/Troop Definition", fileName = "TroopDefinition")]
    public class TroopDefinitionSO : ScriptableObject
    {
        [Header("Identity")]
        public string troopClass;         // SAMURAI_GUARD | YUMI_ARCHERS | KOMAINU_RIDERS
        public string displayNameKey;
        public Sprite icon;
        public GameObject prefab;

        [Header("Base Stats (tier 1)")]
        public int attack = 10;
        public int defense = 10;
        public int trainTimeSeconds = 30;
        public long riceCost = 50;
        public long ironCost = 20;

        [Header("Movement")]
        public bool isMounted;            // Komainu are mounted (+30% march)

        [Header("Counter")]
        [Tooltip("Class this troop counters (deals +25% to).")]
        public string countersClass;      // matches CombatService counter table
    }
}
