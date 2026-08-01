using System;

namespace ShadowsOfTheShogun.Network
{
    /// <summary>
    /// Season pass progression (/season-pass). The definition (tiers + rewards)
    /// is static content; a player's live progress and point awards are
    /// server-authoritative (spec §22, §25). The client only displays state and
    /// requests point/claim mutations — grants come back from the server.
    /// </summary>
    public class SeasonPassService
    {
        private readonly ApiClient _api;
        public SeasonPassService(ApiClient api) => _api = api;

        /// <summary>Gets the current season definition (tiers, rewards, dates).</summary>
        public void GetDefinition(Action<ApiResponse<SeasonPassDefinition>> cb)
            => _api.Get("/season-pass", cb);

        /// <summary>Gets a player's live pass progress.</summary>
        public void GetProgress(string playerId, Action<ApiResponse<SeasonPassProgress>> cb)
            => _api.Get($"/season-pass/{playerId}", cb);

        /// <summary>Awards season points to the player (validated server-side).</summary>
        public void AddPoints(string playerId, int points,
            Action<ApiResponse<SeasonPassProgress>> cb)
            => _api.Post($"/season-pass/{playerId}/points",
                new AddPointsBody { points = points }, cb);

        /// <summary>Requests the premium track unlock (after IAP validation).</summary>
        public void UnlockPremium(string playerId, Action<ApiResponse<SeasonPassProgress>> cb)
            => _api.Post($"/season-pass/{playerId}/unlock-premium", null, cb);

        /// <summary>Claims the reward for a specific tier.</summary>
        public void ClaimTier(string playerId, int tier,
            Action<ApiResponse<SeasonPassProgress>> cb)
            => _api.Post($"/season-pass/{playerId}/claim",
                new ClaimBody { tier = tier }, cb);

        [Serializable] private class AddPointsBody { public int points; }
        [Serializable] private class ClaimBody { public int tier; }
    }

    // --- DTOs ------------------------------------------------------------

    [Serializable]
    public class SeasonPassDefinition
    {
        public string seasonId;
        public string title;
        public string startsAt;
        public string endsAt;
        public int maxTier;
        public int pointsPerTier;
        public SeasonPassTier[] tiers;
    }

    [Serializable]
    public class SeasonPassTier
    {
        public int tier;
        public SeasonPassReward freeReward;
        public SeasonPassReward premiumReward;
    }

    [Serializable]
    public class SeasonPassReward
    {
        public string kind;            // RESOURCE | CURRENCY | ITEM | HERO | PET
        public string key;
        public long amount;
        public string iconKey;
    }

    [Serializable]
    public class SeasonPassProgress
    {
        public string seasonId;
        public int points;
        public int currentTier;
        public float tierProgress;     // 0..1 within the current tier
        public bool premiumOwned;
        public int[] claimedFreeTiers;
        public int[] claimedPremiumTiers;
    }
}
