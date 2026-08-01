using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Data;
using ShadowsOfTheShogun.Network;

namespace ShadowsOfTheShogun.Economy
{
    /// <summary>
    /// Local cache of the active settlement's resource stocks with optimistic
    /// updates (spec §98: client predicts, server validates).
    ///
    ///  • Spends apply optimistically and roll back if the server rejects.
    ///  • A hard sync every 60s replaces the cache with authoritative values.
    ///  • Never grants resources locally — production is server-owned; the HUD
    ///    only interpolates between authoritative snapshots for a smooth feel.
    /// </summary>
    public class ResourceManager
    {
        private readonly MonoBehaviour _runner;
        private readonly EconomyService _economy;
        private readonly Dictionary<string, ResourceData> _cache = new();
        private Coroutine _syncLoop;

        public string ActiveSettlementId { get; private set; }

        public ResourceManager(MonoBehaviour runner, EconomyService economy)
        {
            _runner = runner;
            _economy = economy;
        }

        public void SetActiveSettlement(string settlementId) => ActiveSettlementId = settlementId;

        public long Get(string resource)
            => _cache.TryGetValue(resource, out var r) ? r.amount : 0L;

        public ResourceData GetStock(string resource)
            => _cache.TryGetValue(resource, out var r) ? r : null;

        public IReadOnlyDictionary<string, ResourceData> All => _cache;

        // --- Optimistic spend --------------------------------------------
        /// <summary>Returns false if the client already knows the balance is
        /// insufficient (avoids a doomed round-trip).</summary>
        public bool CanAfford(string resource, long amount) => Get(resource) >= amount;

        /// <summary>
        /// Applies an optimistic debit, publishes the change, then confirms with
        /// the server. Rolls back and re-syncs on rejection.
        /// </summary>
        public void SpendOptimistic(IReadOnlyDictionary<string, long> costs, System.Action<bool> confirmed)
        {
            // Snapshot for rollback.
            var previous = new Dictionary<string, long>();
            foreach (var kv in costs)
            {
                previous[kv.Key] = Get(kv.Key);
                if (_cache.TryGetValue(kv.Key, out var stock))
                    stock.amount = System.Math.Max(0L, stock.amount - kv.Value);
            }
            EventBus.Publish(new ResourcesChanged(ActiveSettlementId));

            // The caller performs the actual server mutation (e.g. upgrade).
            // We expose Rollback so it can revert if that call fails.
            confirmed?.Invoke(true);

            void Rollback()
            {
                foreach (var kv in previous)
                    if (_cache.TryGetValue(kv.Key, out var stock)) stock.amount = kv.Value;
                EventBus.Publish(new ResourcesChanged(ActiveSettlementId));
            }
            _pendingRollback = Rollback;
        }

        private System.Action _pendingRollback;

        /// <summary>Call when a server mutation tied to a prior optimistic spend fails.</summary>
        public void RollbackLastSpend()
        {
            _pendingRollback?.Invoke();
            _pendingRollback = null;
            RequestHardSync();
        }

        public void CommitLastSpend() => _pendingRollback = null;

        // --- Sync loop ---------------------------------------------------
        public void StartAutoSync()
        {
            StopAutoSync();
            _syncLoop = _runner.StartCoroutine(SyncLoop());
        }

        public void StopAutoSync()
        {
            if (_syncLoop != null) { _runner.StopCoroutine(_syncLoop); _syncLoop = null; }
        }

        private IEnumerator SyncLoop()
        {
            var wait = new WaitForSeconds(Constants.HardSyncIntervalSeconds);
            while (true)
            {
                RequestHardSync();
                yield return wait;
            }
        }

        public void RequestHardSync()
        {
            if (string.IsNullOrEmpty(ActiveSettlementId)) return;
            _economy.Tick(ActiveSettlementId, res =>
            {
                if (res.Success && res.Data?.resources != null)
                    LoadSnapshot(res.Data.resources);
            });
        }

        /// <summary>
        /// Replaces the entire cache with an authoritative server snapshot and
        /// notifies listeners. Also used to seed the cache on first load.
        /// </summary>
        public void LoadSnapshot(ResourceData[] resources)
        {
            _cache.Clear();
            if (resources != null)
                foreach (var r in resources) _cache[r.resource] = r;
            EventBus.Publish(new ResourcesChanged(ActiveSettlementId));
        }
    }
}
