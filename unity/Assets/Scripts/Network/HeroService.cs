using System;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Network
{
    /// <summary>Hero roster, skills and relationships (/heroes).</summary>
    public class HeroService
    {
        private readonly ApiClient _api;
        public HeroService(ApiClient api) => _api = api;

        public void GetRoster(string playerId, Action<ApiResponse<HeroListResponse>> cb)
            => _api.Get($"/heroes/{playerId}", cb);

        public void GetHero(string heroId, Action<ApiResponse<HeroData>> cb)
            => _api.Get($"/heroes/detail/{heroId}", cb);

        [Serializable] private class SkillBody { public string heroId; public string skillKey; }

        /// <summary>Requests a skill unlock/level-up. Server validates prereqs.</summary>
        public void UpgradeSkill(string heroId, string skillKey, Action<ApiResponse<HeroData>> cb)
            => _api.Post("/heroes/skill/upgrade", new SkillBody { heroId = heroId, skillKey = skillKey }, cb);
    }

    [Serializable] public class HeroListResponse { public HeroData[] heroes; }
}
