using System.Collections.Generic;
using UnityEngine;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Data;
using ShadowsOfTheShogun.Network;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Store
{
    /// <summary>
    /// Main store screen with tabs (spec §26). Loads the catalog from the server
    /// and populates ProductCards under the selected tab.
    /// </summary>
    public class StoreUI : ScreenView
    {
        [SerializeField] private TabController tabs;
        [SerializeField] private Transform productContainer;
        [SerializeField] private ProductCard productCardPrefab;
        [SerializeField] private PurchaseConfirmUI confirmUI;

        private StoreCatalog _catalog;
        private readonly List<ProductCard> _cards = new();

        public override void OnShow() => LoadCatalog();

        private void LoadCatalog()
        {
            ServiceLocator.Get<StoreService>().GetCatalog(res =>
            {
                if (!res.Success || res.Data == null) return;
                _catalog = res.Data;
                tabs.OnTabChanged -= ShowTab;
                tabs.OnTabChanged += ShowTab;
                ShowTab(tabs.ActiveIndex);
            });
        }

        private void ShowTab(int index)
        {
            if (_catalog?.tabs == null || index >= _catalog.tabs.Count) return;
            foreach (var c in _cards) Destroy(c.gameObject);
            _cards.Clear();
            foreach (var product in _catalog.tabs[index].products)
            {
                var card = Instantiate(productCardPrefab, productContainer);
                card.Bind(product, () => confirmUI.Open(product));
                _cards.Add(card);
            }
        }
    }
}
