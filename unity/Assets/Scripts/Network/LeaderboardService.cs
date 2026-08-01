using System;

namespace ShadowsOfTheShogun.Network
{
    /// <summary>
    /// Ranked leaderboards (/leaderboards). All ranking is computed and ordered
    /// server-side (spec §98); the client only requests and renders a page.
    /// </summary>
    public class LeaderboardService
    {
        private readonly ApiClient _api;
        public LeaderboardService(ApiClient api) => _api = api;

        /// <summary>Fetches the default (power) leaderboard.</summary>
        public void GetPower(Action<ApiResponse<LeaderboardResponse>> cb)
            => _api.Get("/leaderboards/power", cb);

        /// <summary>Fetches a leaderboard for a given scope (e.g. power, clan, kills).</summary>
        public void GetLeaderboard(string scope, Action<ApiResponse<LeaderboardResponse>> cb)
            => _api.Get($"/leaderboards/{scope}", cb);

        /// <summary>Fetches all available leaderboards.</summary>
        public void GetAll(Action<ApiResponse<LeaderboardListResponse>> cb)
            => _api.Get("/leaderboards", cb);
    }

    // --- DTOs ------------------------------------------------------------

    [Serializable]
    public class LeaderboardListResponse
    {
        public LeaderboardResponse[] leaderboards;
    }

    [Serializable]
    public class LeaderboardResponse
    {
        public string scope;           // power | kills | clan ...
        public string title;
        public string updatedAt;
        public LeaderboardEntry[] entries;
    }

    [Serializable]
    public class LeaderboardEntry
    {
        public int rank;
        public string playerId;
        public string displayName;
        public string clanTag;
        public long score;
        public bool isCurrentPlayer;
    }
}
