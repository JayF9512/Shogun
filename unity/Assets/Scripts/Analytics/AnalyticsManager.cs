using System.Collections.Generic;
using UnityEngine;

namespace ShadowsOfTheShogun.Analytics
{
    /// <summary>
    /// Canonical funnel + telemetry events (spec §110). Names are stable strings
    /// so dashboards remain consistent across client versions.
    /// </summary>
    public enum AnalyticsEvent
    {
        // Acquisition / funnel milestones
        Install, Login, Tutorial, FirstBuilding, FirstHero, FirstBattle,
        FirstMarch, FirstClan, FirstPurchase, Level30, IndustrialAscension,
        IndustrialStage,
        // Ongoing telemetry
        SessionStart, SessionEnd, ModeUse, ClanActivity,
        ResourceSource, CurrencyInflation, ClassWinRate,
    }

    /// <summary>
    /// Buffers analytics events and flushes them to the backend /analytics
    /// endpoint in batches. Uses a pluggable sink so it can also fan out to a
    /// third-party SDK. Safe no-op if networking is unavailable.
    /// </summary>
    public class AnalyticsManager
    {
        private static AnalyticsManager _instance;
        public static AnalyticsManager Instance => _instance ??= new AnalyticsManager();

        private readonly List<Dictionary<string, object>> _buffer = new();
        private const int FlushThreshold = 20;

        public System.Action<IReadOnlyList<Dictionary<string, object>>> Sink;

        /// <summary>Track a funnel milestone with optional properties.</summary>
        public void Track(AnalyticsEvent evt, Dictionary<string, object> props = null)
        {
            var payload = new Dictionary<string, object>
            {
                ["event"] = evt.ToString(),
                ["ts"] = System.DateTime.UtcNow.ToString("o"),
                ["platform"] = Application.platform.ToString(),
                ["version"] = Application.version,
            };
            if (props != null)
                foreach (var kv in props) payload[kv.Key] = kv.Value;

            _buffer.Add(payload);
            if (_buffer.Count >= FlushThreshold) Flush();
        }

        // --- Typed helpers for the common telemetry dimensions -----------
        public void TrackModeUse(string mode)
            => Track(AnalyticsEvent.ModeUse, new() { ["mode"] = mode });

        public void TrackResourceSource(string resource, long amount, string source)
            => Track(AnalyticsEvent.ResourceSource,
                     new() { ["resource"] = resource, ["amount"] = amount, ["source"] = source });

        public void TrackCurrencyInflation(string currency, long minted, long sunk)
            => Track(AnalyticsEvent.CurrencyInflation,
                     new() { ["currency"] = currency, ["minted"] = minted, ["sunk"] = sunk });

        public void TrackClassWinRate(string troopClass, bool won)
            => Track(AnalyticsEvent.ClassWinRate,
                     new() { ["class"] = troopClass, ["won"] = won });

        public void TrackIndustrialStage(int major, int subStage)
            => Track(AnalyticsEvent.IndustrialStage,
                     new() { ["major"] = major, ["subStage"] = subStage });

        public void Flush()
        {
            if (_buffer.Count == 0) return;
            Sink?.Invoke(_buffer);
            _buffer.Clear();
        }
    }
}
