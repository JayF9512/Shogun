using System;
using System.Collections.Generic;

namespace ShadowsOfTheShogun.Data
{
    /// <summary>Store catalog + individual products (spec §26).</summary>
    [Serializable]
    public class StoreCatalog
    {
        public List<StoreTab> tabs = new();
    }

    [Serializable]
    public class StoreTab
    {
        public string key;
        public string title;
        public List<StoreProduct> products = new();
    }

    [Serializable]
    public class StoreProduct
    {
        public string id;
        public string sku;                // platform IAP product id
        public string title;
        public string description;
        public string iconKey;
        public string priceDisplay;       // localized price string
        public float priceUsd;
        public string currencyType;       // REAL | JADE | HONOUR ...
        public long currencyCost;         // for soft-currency products
        public int discountPercent;
        public bool isFeatured;
        public List<StoreReward> rewards = new();
    }

    [Serializable]
    public class StoreReward
    {
        public string kind;               // RESOURCE | CURRENCY | ITEM | HERO
        public string key;
        public long amount;
    }
}
