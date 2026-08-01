using System;

namespace ShadowsOfTheShogun.Data
{
    /// <summary>An instance of a building in a settlement.</summary>
    [Serializable]
    public class BuildingData
    {
        public string id;
        public string definitionKey;      // e.g. "tenshu", "hospital"
        public string category;           // MILITARY | ECONOMY | SUPPORT
        public int level;
        public int gridX;
        public int gridY;
        public bool isConstructing;
        public DateTime constructionEndsAt; // server-authoritative completion
    }
}
