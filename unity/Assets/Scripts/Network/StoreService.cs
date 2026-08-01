using System;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Network
{
    /// <summary>Store catalog + purchase validation (/store, /purchases).</summary>
    public class StoreService
    {
        private readonly ApiClient _api;
        public StoreService(ApiClient api) => _api = api;

        public void GetCatalog(Action<ApiResponse<StoreCatalog>> cb)
            => _api.Get("/store/catalog", cb);

        [Serializable]
        public class ValidateBody
        {
            public string productId;
            public string platform;       // GOOGLE | APPLE
            public string platformTxId;   // receipt / purchase token
        }

        /// <summary>Sends the platform receipt for server-side validation.
        /// Entitlements are ONLY granted by the server (spec §32).</summary>
        public void ValidatePurchase(ValidateBody body, Action<ApiResponse<PurchaseResult>> cb)
            => _api.Post("/purchases/process", body, cb);
    }

    [Serializable]
    public class PurchaseResult
    {
        public bool granted;
        public string transactionId;
        public StoreReward[] grantedRewards;
    }
}
