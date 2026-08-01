using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Network;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Troops
{
    /// <summary>
    /// Recover wounded troops (spec §8). Wounded counts come from the server;
    /// healing consumes resources/time validated server-side.
    /// </summary>
    public class HospitalUI : MonoBehaviour
    {
        [SerializeField] private GameObject panel;
        [SerializeField] private TMP_Text woundedLabel;
        [SerializeField] private TMP_InputField healInput;
        [SerializeField] private TMP_Dropdown classDropdown;

        private static readonly string[] ClassKeys =
            { "SAMURAI_GUARD", "YUMI_ARCHERS", "KOMAINU_RIDERS" };

        public void Refresh(string playerId)
        {
            ServiceLocator.Get<TroopService>().GetTroops(playerId, res =>
            {
                if (!res.Success || res.Data?.troops == null) return;
                int wounded = 0;
                foreach (var t in res.Data.troops) wounded += t.wounded;
                woundedLabel.text = $"Wounded: {wounded}";
            });
        }

        public void Heal()
        {
            var cls = ClassKeys[Mathf.Clamp(classDropdown.value, 0, 2)];
            if (!int.TryParse(healInput.text, out var count) || count <= 0) return;
            ServiceLocator.Get<TroopService>().Heal(cls, count, res =>
            {
                if (res.Success) ToastNotification.Instance?.Show("Recovery started");
                else ToastNotification.Instance?.Show("Recovery failed");
            });
        }
    }
}
