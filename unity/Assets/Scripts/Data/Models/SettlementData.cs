using System;
using System.Collections.Generic;

namespace ShadowsOfTheShogun.Data
{
    /// <summary>A player's home settlement and its buildings.</summary>
    [Serializable]
    public class SettlementData
    {
        public string id;
        public string playerId;
        public string name;
        public int tenshuLevel;           // keep/castle level (progression gate)
        public int x;
        public int y;
        public List<BuildingData> buildings = new();
        public List<ResourceData> resources = new();
    }
}
