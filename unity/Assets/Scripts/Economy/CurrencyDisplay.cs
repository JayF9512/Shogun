using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.Core;

namespace ShadowsOfTheShogun.Economy
{
    /// <summary>
    /// HUD element for premium/soft currencies (spec §12): Jade, Honour, Fear,
    /// Corruption. Listens for CurrencyChanged and updates its label.
    /// </summary>
    public class CurrencyDisplay : MonoBehaviour
    {
        [SerializeField] private string currency = "JADE"; // JADE|HONOUR|FEAR|CORRUPTION
        [SerializeField] private TMP_Text amountLabel;
        [SerializeField] private Image icon;

        private void OnEnable() => EventBus.Subscribe<CurrencyChanged>(OnChanged);
        private void OnDisable() => EventBus.Unsubscribe<CurrencyChanged>(OnChanged);

        public void SetAmount(long amount) =>
            amountLabel.text = ResourceFormat.Abbreviate(amount);

        private void OnChanged(CurrencyChanged e)
        {
            if (e.Currency == currency) SetAmount(e.NewBalance);
        }
    }

    /// <summary>Formats large numbers as 1.2K / 3.4M / 5.6B for compact HUDs.</summary>
    public static class ResourceFormat
    {
        public static string Abbreviate(long value)
        {
            if (value < 1000) return value.ToString();
            if (value < 1_000_000) return (value / 1000f).ToString("0.#") + "K";
            if (value < 1_000_000_000) return (value / 1_000_000f).ToString("0.#") + "M";
            return (value / 1_000_000_000f).ToString("0.#") + "B";
        }
    }
}
