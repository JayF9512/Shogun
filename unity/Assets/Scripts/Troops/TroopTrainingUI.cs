using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Network;
using ShadowsOfTheShogun.UI;
using ShadowsOfTheShogun.Analytics;

namespace ShadowsOfTheShogun.Troops
{
    /// <summary>
    /// Train troops: select class, quantity and confirm (spec §8). Cost/time are
    /// previewed client-side but the server debits resources and schedules the
    /// training queue authoritatively.
    /// </summary>
    public class TroopTrainingUI : MonoBehaviour
    {
        [SerializeField] private GameObject panel;
        [SerializeField] private TMP_Dropdown classDropdown;   // 0 Samurai 1 Yumi 2 Komainu
        [SerializeField] private TMP_InputField quantityInput;
        [SerializeField] private TMP_Text costPreviewLabel;
        [SerializeField] private Button trainButton;

        private static readonly string[] ClassKeys =
            { "SAMURAI_GUARD", "YUMI_ARCHERS", "KOMAINU_RIDERS" };

        public void Train()
        {
            var cls = ClassKeys[Mathf.Clamp(classDropdown.value, 0, 2)];
            if (!int.TryParse(quantityInput.text, out var count) || count <= 0)
            {
                ToastNotification.Instance?.Show("Enter a valid quantity");
                return;
            }
            trainButton.interactable = false;
            ServiceLocator.Get<TroopService>().Train(cls, count, res =>
            {
                trainButton.interactable = true;
                if (res.Success)
                {
                    AnalyticsManager.Instance.TrackModeUse("train_troops");
                    ToastNotification.Instance?.Show($"Training {count} {cls}");
                    panel.SetActive(false);
                }
                else ToastNotification.Instance?.Show(res.Error ?? "Training failed");
            });
        }
    }
}
