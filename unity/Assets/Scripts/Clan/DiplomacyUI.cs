using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Network;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Clan
{
    /// <summary>
    /// Alliance / war / peace declarations between clans (spec §18). All actions
    /// are validated and recorded server-side.
    /// </summary>
    public class DiplomacyUI : MonoBehaviour
    {
        [SerializeField] private GameObject panel;
        [SerializeField] private TMP_Text targetLabel;
        [SerializeField] private Button warButton;
        [SerializeField] private Button allianceButton;
        [SerializeField] private Button peaceButton;

        private string _targetClanId;

        public void Open(string targetClanId, string targetClanName)
        {
            _targetClanId = targetClanId;
            panel.SetActive(true);
            targetLabel.text = targetClanName;
            Wire(warButton, "WAR");
            Wire(allianceButton, "ALLIANCE");
            Wire(peaceButton, "PEACE");
        }

        private void Wire(Button button, string action)
        {
            button.onClick.RemoveAllListeners();
            button.onClick.AddListener(() => Declare(action));
        }

        private void Declare(string action)
        {
            ServiceLocator.Get<ClanService>().Diplomacy(_targetClanId, action, res =>
            {
                ToastNotification.Instance?.Show(res.Success ? $"{action} declared" : "Action failed");
                if (res.Success) panel.SetActive(false);
            });
        }

        public void Close() => panel.SetActive(false);
    }
}
