using UnityEngine;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Data;
using ShadowsOfTheShogun.Network;
using ShadowsOfTheShogun.UI;
using ShadowsOfTheShogun.Analytics;

namespace ShadowsOfTheShogun.Store
{
    /// <summary>
    /// Drives the IAP flow (spec §26, §32). Entitlements are NEVER granted on the
    /// client — the platform receipt is always validated by the backend:
    ///
    ///   1. Request the purchase from Google Play / Apple IAP.
    ///   2. On platform success, forward the receipt to /purchases/process.
    ///   3. The backend verifies the receipt, grants the entitlement and returns
    ///      the updated inventory.
    ///   4. The client only reflects what the server granted.
    ///
    /// The platform layer is abstracted behind <see cref="IPlatformIap"/> so it
    /// can be backed by Unity IAP, a native plugin, or a mock in the editor.
    /// </summary>
    public class PurchaseHandler : MonoBehaviour
    {
        private IPlatformIap _iap;

        private void Awake()
        {
            // Swap for a real Unity IAP / native implementation in a build.
            _iap = new EditorMockIap();
        }

        public void SetPlatformIap(IPlatformIap iap) => _iap = iap;

        public void BeginPurchase(StoreProduct product)
        {
            // Soft-currency products skip the store and go straight to the server.
            if (product.currencyType != "REAL")
            {
                ValidateWithServer(product, platform: "SOFT", platformTxId: "n/a");
                return;
            }

            _iap.Purchase(product.sku, (success, platform, txId, error) =>
            {
                if (!success)
                {
                    ToastNotification.Instance?.Show(error ?? "Purchase cancelled");
                    return;
                }
                ValidateWithServer(product, platform, txId);
            });
        }

        private void ValidateWithServer(StoreProduct product, string platform, string platformTxId)
        {
            var body = new StoreService.ValidateBody
            {
                productId = product.id,
                platform = platform,
                platformTxId = platformTxId,
            };
            ServiceLocator.Get<StoreService>().ValidatePurchase(body, res =>
            {
                if (res.Success && res.Data != null && res.Data.granted)
                {
                    AnalyticsManager.Instance.Track(AnalyticsEvent.FirstPurchase,
                        new() { ["productId"] = product.id, ["usd"] = product.priceUsd });
                    // Refresh authoritative resources/currencies after the grant.
                    if (ServiceLocator.TryGet<Economy.ResourceManager>(out var rm))
                        rm.RequestHardSync();
                    ToastNotification.Instance?.Show("Purchase complete");
                }
                else
                {
                    ToastNotification.Instance?.Show("Purchase validation failed");
                }
            });
        }
    }

    /// <summary>Abstraction over a store's native IAP API.</summary>
    public interface IPlatformIap
    {
        void Purchase(string sku, System.Action<bool, string, string, string> callback);
    }

    /// <summary>Editor/testing stub that simulates an instant successful purchase.</summary>
    public class EditorMockIap : IPlatformIap
    {
        public void Purchase(string sku, System.Action<bool, string, string, string> callback)
        {
            callback?.Invoke(true, "MOCK", System.Guid.NewGuid().ToString(), null);
        }
    }
}
