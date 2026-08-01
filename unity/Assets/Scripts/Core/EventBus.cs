using System;
using System.Collections.Generic;

namespace ShadowsOfTheShogun.Core
{
    /// <summary>
    /// Lightweight, type-safe publish/subscribe event bus. Decouples systems
    /// (e.g. ResourceManager) from UI (e.g. ResourceHUD) without hard references.
    ///
    /// Usage:
    ///   EventBus.Subscribe&lt;ResourcesChanged&gt;(OnResourcesChanged);
    ///   EventBus.Publish(new ResourcesChanged(...));
    ///   EventBus.Unsubscribe&lt;ResourcesChanged&gt;(OnResourcesChanged); // in OnDestroy
    /// </summary>
    public static class EventBus
    {
        private static readonly Dictionary<Type, Delegate> Handlers = new();

        public static void Subscribe<T>(Action<T> handler) where T : struct
        {
            var t = typeof(T);
            Handlers[t] = Handlers.TryGetValue(t, out var existing)
                ? Delegate.Combine(existing, handler)
                : handler;
        }

        public static void Unsubscribe<T>(Action<T> handler) where T : struct
        {
            var t = typeof(T);
            if (!Handlers.TryGetValue(t, out var existing)) return;
            var remaining = Delegate.Remove(existing, handler);
            if (remaining == null) Handlers.Remove(t);
            else Handlers[t] = remaining;
        }

        public static void Publish<T>(T evt) where T : struct
        {
            if (Handlers.TryGetValue(typeof(T), out var d) && d is Action<T> action)
            {
                action.Invoke(evt);
            }
        }

        /// <summary>Clears all handlers. Call on scene teardown / logout.</summary>
        public static void Clear() => Handlers.Clear();
    }

    // --- Common event payloads (structs to avoid GC churn) ---------------

    public readonly struct ResourcesChanged
    {
        public readonly string SettlementId;
        public ResourcesChanged(string settlementId) => SettlementId = settlementId;
    }

    public readonly struct CurrencyChanged
    {
        public readonly string Currency;
        public readonly long NewBalance;
        public CurrencyChanged(string currency, long newBalance)
        {
            Currency = currency; NewBalance = newBalance;
        }
    }

    public readonly struct AuthStateChanged
    {
        public readonly bool IsLoggedIn;
        public AuthStateChanged(bool isLoggedIn) => IsLoggedIn = isLoggedIn;
    }

    public readonly struct ConstructionCompleted
    {
        public readonly string BuildingId;
        public ConstructionCompleted(string buildingId) => BuildingId = buildingId;
    }

    public readonly struct MarchArrived
    {
        public readonly string MarchId;
        public MarchArrived(string marchId) => MarchId = marchId;
    }

    public readonly struct BattleResolved
    {
        public readonly string BattleId;
        public BattleResolved(string battleId) => BattleId = battleId;
    }

    public readonly struct LocaleChanged
    {
        public readonly string Locale;
        public LocaleChanged(string locale) => Locale = locale;
    }

    public readonly struct AccessibilityChanged
    {
        public AccessibilityChanged(bool _ = true) { }
    }
}
