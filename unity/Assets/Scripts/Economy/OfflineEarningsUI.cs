using UnityEngine;
using TMPro;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Network;

namespace ShadowsOfTheShogun.Economy
{
    /// <summary>
    /// Shows resources accrued while the player was away (spec §12). Values are
    /// fetched from the server — the client never computes offline gains itself.
    /// </summary>
    public class OfflineEarningsUI : MonoBehaviour
    {
        [SerializeField] private GameObject panel;
        [SerializeField] private TMP_Text awayLabel;
        [SerializeField] private Transform rewardContainer;
        [SerializeField] private GameObject rewardRowPrefab;

        public void FetchAndShow(string settlementId)
        {
            var economy = ServiceLocator.Get<EconomyService>();
            economy.GetOfflineEarnings(settlementId, res =>
            {
                if (!res.Success || res.Data == null || res.Data.earned == null) return;
                if (res.Data.earned.Length == 0) return;
                Populate(res.Data);
            });
        }

        private void Populate(OfflineEarnings data)
        {
            panel.SetActive(true);
            var hrs = data.awaySeconds / 3600f;
            awayLabel.text = $"Away for {hrs:0.#}h";
            foreach (Transform c in rewardContainer) Destroy(c.gameObject);
            foreach (var item in data.earned)
            {
                var row = Instantiate(rewardRowPrefab, rewardContainer);
                var text = row.GetComponentInChildren<TMP_Text>();
                if (text != null) text.text = $"+{ResourceFormat.Abbreviate(item.amount)} {item.resource}";
            }
        }

        public void Claim() => panel.SetActive(false);
    }
}
