using System;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Network
{
    /// <summary>Resource stocks + production ticks (/economy).</summary>
    public class EconomyService
    {
        private readonly ApiClient _api;
        public EconomyService(ApiClient api) => _api = api;

        public void GetResources(string settlementId, Action<ApiResponse<ResourceListResponse>> cb)
            => _api.Get($"/economy/{settlementId}/resources", cb);

        /// <summary>Forces a server production tick and returns fresh stocks.</summary>
        public void Tick(string settlementId, Action<ApiResponse<ResourceListResponse>> cb)
            => _api.Post($"/economy/{settlementId}/tick", null, cb);

        public void GetOfflineEarnings(string settlementId, Action<ApiResponse<OfflineEarnings>> cb)
            => _api.Get($"/economy/{settlementId}/offline", cb);
    }

    [Serializable] public class ResourceListResponse { public ResourceData[] resources; }

    [Serializable]
    public class OfflineEarnings
    {
        public long awaySeconds;
        public LootItem[] earned;
    }
}
