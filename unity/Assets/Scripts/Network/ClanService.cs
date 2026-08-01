using System;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Network
{
    /// <summary>Clan membership, tech and diplomacy (/clans).</summary>
    public class ClanService
    {
        private readonly ApiClient _api;
        public ClanService(ApiClient api) => _api = api;

        public void GetClan(string clanId, Action<ApiResponse<ClanData>> cb)
            => _api.Get($"/clans/{clanId}", cb);

        [Serializable] private class JoinBody { public string clanId; }
        [Serializable] private class DiplomacyBody { public string targetClanId; public string action; }

        public void Join(string clanId, Action<ApiResponse<ClanData>> cb)
            => _api.Post("/clans/join", new JoinBody { clanId = clanId }, cb);

        public void Leave(string clanId, Action<ApiResponse<EmptyResponse>> cb)
            => _api.Post("/clans/leave", new JoinBody { clanId = clanId }, cb);

        /// <summary>Declare war / propose alliance (action = WAR | ALLIANCE | PEACE).</summary>
        public void Diplomacy(string targetClanId, string action, Action<ApiResponse<EmptyResponse>> cb)
            => _api.Post("/clans/diplomacy", new DiplomacyBody { targetClanId = targetClanId, action = action }, cb);
    }
}
