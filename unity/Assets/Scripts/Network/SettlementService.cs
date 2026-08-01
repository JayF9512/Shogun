using System;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Network
{
    /// <summary>Settlement + building operations (/settlements).</summary>
    public class SettlementService
    {
        private readonly ApiClient _api;
        public SettlementService(ApiClient api) => _api = api;

        public void GetSettlement(string playerId, Action<ApiResponse<SettlementData>> cb)
            => _api.Get($"/settlements/{playerId}", cb);

        [Serializable] private class UpgradeBody { public string buildingId; }

        /// <summary>Requests a building upgrade. Server debits resources and
        /// returns the authoritative construction end time.</summary>
        public void UpgradeBuilding(string buildingId, Action<ApiResponse<BuildingData>> cb)
            => _api.Post("/settlements/building/upgrade", new UpgradeBody { buildingId = buildingId }, cb);

        /// <summary>Claims a completed construction (only succeeds if server
        /// confirms the timer has elapsed — never granted client-side).</summary>
        public void ClaimConstruction(string buildingId, Action<ApiResponse<BuildingData>> cb)
            => _api.Post("/settlements/building/claim", new UpgradeBody { buildingId = buildingId }, cb);
    }
}
