using System;
using System.Collections.Generic;

namespace ShadowsOfTheShogun.Data
{
    /// <summary>A moving army on the world map (spec §15).</summary>
    [Serializable]
    public class MarchData
    {
        public string id;
        public string playerId;
        public string state;              // GATHERING | MARCHING | IN_COMBAT | RETURNING
        public int originX;
        public int originY;
        public int targetX;
        public int targetY;
        public float speed;               // tiles/hr (server computed)
        public float distance;
        public DateTime departedAt;
        public DateTime arrivesAt;        // server-authoritative ETA
        public bool hasKomainu;
        public List<MarchParticipant> participants = new();
    }

    [Serializable]
    public class MarchParticipant
    {
        public string troopClass;
        public int count;
    }
}
