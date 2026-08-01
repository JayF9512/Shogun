using UnityEngine;

namespace ShadowsOfTheShogun.Data.Definitions
{
    /// <summary>Data-driven hero config (spec §9, §13).</summary>
    [CreateAssetMenu(menuName = "Shogun/Hero Definition", fileName = "HeroDefinition")]
    public class HeroDefinitionSO : ScriptableObject
    {
        [Header("Identity")]
        public string key;
        public string displayNameKey;
        public string rarity;             // COMMON..LEGENDARY
        public Sprite portrait;
        public GameObject prefab;

        [Header("Base Stats")]
        public int baseAttack = 100;
        public int baseDefense = 100;
        public float baseMarchBonus = 0.05f;
        public float baseCombatBonus = 0.10f;

        [Header("Affinity")]
        public string preferredTroopClass;
        [TextArea] public string loreKey;
    }
}
