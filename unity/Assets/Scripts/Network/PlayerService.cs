using System;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Network
{
    /// <summary>Reads player profile / progression from /players.</summary>
    public class PlayerService
    {
        private readonly ApiClient _api;
        public PlayerService(ApiClient api) => _api = api;

        public void GetProfile(string playerId, Action<ApiResponse<PlayerData>> cb)
            => _api.Get($"/players/{playerId}", cb);

        public void GetAscensionStatus(string playerId, Action<ApiResponse<AscensionStatus>> cb)
            => _api.Get($"/progression/{playerId}/ascension", cb);

        /// <summary>Request Industrial Ascension (server validates all gates).</summary>
        public void Ascend(string playerId, Action<ApiResponse<PlayerData>> cb)
            => _api.Post($"/progression/{playerId}/ascend", null, cb);
    }

    [Serializable]
    public class AscensionStatus
    {
        public bool eligible;
        public string[] unmet;
    }
}
