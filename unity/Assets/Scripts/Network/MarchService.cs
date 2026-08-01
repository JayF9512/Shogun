using System;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Network
{
    /// <summary>March creation and tracking (/marches).</summary>
    public class MarchService
    {
        private readonly ApiClient _api;
        public MarchService(ApiClient api) => _api = api;

        public void GetActiveMarches(string playerId, Action<ApiResponse<MarchListResponse>> cb)
            => _api.Get($"/marches/{playerId}", cb);

        [Serializable]
        public class CreateMarchBody
        {
            public int originX, originY, targetX, targetY;
            public bool hasKomainu;
            public MarchParticipant[] participants;
        }

        /// <summary>Creates a march; server computes speed/ETA authoritatively.</summary>
        public void CreateMarch(CreateMarchBody body, Action<ApiResponse<MarchData>> cb)
            => _api.Post("/marches", body, cb);

        public void Recall(string marchId, Action<ApiResponse<MarchData>> cb)
            => _api.Post($"/marches/{marchId}/recall", null, cb);
    }

    [Serializable] public class MarchListResponse { public MarchData[] marches; }
}
