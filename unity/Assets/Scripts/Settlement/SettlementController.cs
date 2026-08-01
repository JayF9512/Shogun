using System.Collections.Generic;
using UnityEngine;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Data;
using ShadowsOfTheShogun.Network;
using ShadowsOfTheShogun.Economy;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Settlement
{
    /// <summary>
    /// Orchestrates the main settlement view (spec §7.1, §11): loads the
    /// authoritative settlement from the server, instantiates BuildingViews and
    /// primes the ResourceManager cache. Presentation-only.
    /// </summary>
    public class SettlementController : ScreenView
    {
        [SerializeField] private Transform buildingRoot;
        [SerializeField] private BuildingView buildingViewPrefab;
        [SerializeField] private OfflineEarningsUI offlineEarnings;

        private readonly Dictionary<string, BuildingView> _views = new();
        private SettlementData _settlement;

        public override void OnShow() => LoadSettlement();

        private void LoadSettlement()
        {
            var auth = ServiceLocator.Get<AuthService>();
            var settlements = ServiceLocator.Get<SettlementService>();
            settlements.GetSettlement(auth.PlayerId, res =>
            {
                if (!res.Success || res.Data == null)
                {
                    ToastNotification.Instance?.Show("Failed to load settlement");
                    return;
                }
                _settlement = res.Data;
                Render();
                var resources = ServiceLocator.Get<ResourceManager>();
                resources.SetActiveSettlement(_settlement.id);
                resources.RequestHardSync();
                offlineEarnings?.FetchAndShow(_settlement.id);
            });
        }

        private void Render()
        {
            foreach (var v in _views.Values) Destroy(v.gameObject);
            _views.Clear();
            foreach (var b in _settlement.buildings)
            {
                var view = Instantiate(buildingViewPrefab, buildingRoot);
                view.Bind(b, this);
                _views[b.id] = view;
            }
        }

        public SettlementData Current => _settlement;
    }
}
