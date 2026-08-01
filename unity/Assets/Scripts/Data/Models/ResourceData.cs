using System;

namespace ShadowsOfTheShogun.Data
{
    /// <summary>Resource types (spec §12).</summary>
    public enum ResourceType
    {
        Rice, Wood, Stone, Iron, Charcoal, Catalyst,
    }

    /// <summary>A single resource stock in a settlement.</summary>
    [Serializable]
    public class ResourceData
    {
        public string id;
        public string resource;           // RICE | WOOD | STONE | IRON | CHARCOAL | CATALYST
        public long amount;
        public long capacity;
        public float productionPerHour;
        public DateTime updatedAt;
    }
}
