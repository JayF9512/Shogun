using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Store
{
    /// <summary>Confirmation dialog shown before initiating a purchase.</summary>
    public class PurchaseConfirmUI : MonoBehaviour
    {
        [SerializeField] private GameObject panel;
        [SerializeField] private TMP_Text titleLabel;
        [SerializeField] private TMP_Text priceLabel;
        [SerializeField] private Button confirmButton;
        [SerializeField] private PurchaseHandler purchaseHandler;

        private StoreProduct _product;

        public void Open(StoreProduct product)
        {
            _product = product;
            panel.SetActive(true);
            titleLabel.text = product.title;
            priceLabel.text = string.IsNullOrEmpty(product.priceDisplay)
                ? $"{product.currencyCost} {product.currencyType}"
                : product.priceDisplay;
            confirmButton.onClick.RemoveAllListeners();
            confirmButton.onClick.AddListener(Confirm);
        }

        private void Confirm()
        {
            panel.SetActive(false);
            purchaseHandler.BeginPurchase(_product);
        }

        public void Cancel() => panel.SetActive(false);
    }
}
