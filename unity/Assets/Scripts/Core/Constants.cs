namespace ShadowsOfTheShogun.Core
{
    /// <summary>
    /// Global compile-time constants shared across the client.
    /// Gameplay balance values that must match the server are mirrored here but
    /// the server remains authoritative (spec §98). These are used only for
    /// client-side prediction and display.
    /// </summary>
    public static class Constants
    {
        // --- API ---------------------------------------------------------
        public const string DefaultApiBaseUrl = "https://api.shadowsoftheshogun.com/api";
        public const string ApiPrefix = "/api";
        public const int RequestTimeoutSeconds = 20;

        // --- Combat (must match backend CombatService) -------------------
        public const float CounterBonus = 0.25f;        // +25% vs countered class
        public const float BaseCasualtyRate = 0.5f;     // loser power * 0.5f

        // --- March (must match backend MarchService) ---------------------
        public const float BaseMarchSpeed = 100f;       // tiles / hour
        public const float KomainuSpeedBonus = 0.30f;   // Komainu +30% faster
        public const int MaxSimultaneousMarches = 5;

        // --- Economy (must match backend EconomyService) -----------------
        public const float ResourceLevelStep = 0.10f;   // +10% production / level
        public const float HardSyncIntervalSeconds = 60f;

        // --- Progression -------------------------------------------------
        public const int StandardMaxLevel = 30;
        public const int IndustrialMaxLevel = 10;
        public const int SubStagesPerLevel = 5;

        // --- PlayerPrefs keys -------------------------------------------
        public const string PrefAccessToken = "sots.auth.access";
        public const string PrefRefreshToken = "sots.auth.refresh";
        public const string PrefLocale = "sots.locale";
        public const string PrefTextScale = "sots.a11y.textscale";
        public const string PrefColorBlind = "sots.a11y.colorblind";
        public const string PrefReducedMotion = "sots.a11y.reducedmotion";
        public const string PrefBattleSpeed = "sots.a11y.battlespeed";
        public const string PrefMusicVolume = "sots.audio.music";
        public const string PrefSfxVolume = "sots.audio.sfx";
    }
}
