using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Store
{
    /// <summary>A single store product tile with price and discount badge.</summary>
    public class ProductCard : MonoBehaviour
    {
        [SerializeField] private TMP_Text titleLabel;
        [SerializeField] private TMP_Text priceLabel;
        [SerializeField] private GameObject discountBadge;
        [SerializeField] private TMP_Text discountLabel;
        [SerializeField] private Button buyButton;

        public void Bind(StoreProduct product, Action onBuy)
        {
            titleLabel.text = product.title;
            priceLabel.text = string.IsNullOrEmpty(product.priceDisplay)
                ? $"{product.currencyCost} {product.currencyType}"
                : product.priceDisplay;

            bool discounted = product.discountPercent > 0;
            discountBadge.SetActive(discounted);
            if (discounted) discountLabel.text = $"-{product.discountPercent}%";

            buyButton.onClick.RemoveAllListeners();
            buyButton.onClick.AddListener(() => onBuy?.Invoke());
        }
    }
}
