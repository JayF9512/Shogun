using System;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Network
{
    /// <summary>Troop training, promotion and hospital recovery (/troops).</summary>
    public class TroopService
    {
        private readonly ApiClient _api;
        public TroopService(ApiClient api) => _api = api;

        public void GetTroops(string playerId, Action<ApiResponse<TroopListResponse>> cb)
            => _api.Get($"/troops/{playerId}", cb);

        [Serializable] private class TrainBody { public string troopClass; public int count; }
        [Serializable] private class HealBody { public string troopClass; public int count; }

        public void Train(string troopClass, int count, Action<ApiResponse<TroopData>> cb)
            => _api.Post("/troops/train", new TrainBody { troopClass = troopClass, count = count }, cb);

        public void Heal(string troopClass, int count, Action<ApiResponse<TroopData>> cb)
            => _api.Post("/troops/heal", new HealBody { troopClass = troopClass, count = count }, cb);
    }

    [Serializable] public class TroopListResponse { public TroopData[] troops; }
}
