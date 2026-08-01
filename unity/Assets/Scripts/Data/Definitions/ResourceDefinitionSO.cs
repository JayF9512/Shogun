using UnityEngine;

namespace ShadowsOfTheShogun.Data.Definitions
{
    /// <summary>Data-driven resource config (spec §12).</summary>
    [CreateAssetMenu(menuName = "Shogun/Resource Definition", fileName = "ResourceDefinition")]
    public class ResourceDefinitionSO : ScriptableObject
    {
        public string resource;           // RICE | WOOD | STONE | IRON | CHARCOAL | CATALYST
        public string displayNameKey;
        public Sprite icon;
        public Color tintColor = Color.white;
        [Tooltip("Base production per hour at building level 1.")]
        public float baseProductionPerHour = 100f;
        [Tooltip("Requires Industrial 1+ before it produces (e.g. Catalyst).")]
        public bool requiresIndustrial;
    }
}
