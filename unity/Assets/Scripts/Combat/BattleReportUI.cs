using UnityEngine;
using TMPro;
using ShadowsOfTheShogun.Data;
using ShadowsOfTheShogun.Economy;

namespace ShadowsOfTheShogun.Combat
{
    /// <summary>
    /// Displays a server-resolved battle report: winner, casualties per side,
    /// Fear gained and loot (spec §14). Purely presentational.
    /// </summary>
    public class BattleReportUI : MonoBehaviour
    {
        [SerializeField] private GameObject panel;
        [SerializeField] private TMP_Text winnerLabel;
        [SerializeField] private TMP_Text attackerLossesLabel;
        [SerializeField] private TMP_Text defenderLossesLabel;
        [SerializeField] private TMP_Text fearLabel;
        [SerializeField] private Transform lootContainer;
        [SerializeField] private GameObject lootRowPrefab;

        public void Show(BattleData battle)
        {
            panel.SetActive(true);
            winnerLabel.text = battle.winner switch
            {
                "ATTACKER" => "Victory",
                "DEFENDER" => "Defeat",
                _ => "Draw",
            };
            attackerLossesLabel.text = $"Your losses: {battle.attacker?.losses ?? 0}";
            defenderLossesLabel.text = $"Enemy losses: {battle.defender?.losses ?? 0}";
            fearLabel.text = $"Fear +{battle.fearGained}";

            foreach (Transform c in lootContainer) Destroy(c.gameObject);
            if (battle.loot != null)
            {
                foreach (var item in battle.loot)
                {
                    var row = Instantiate(lootRowPrefab, lootContainer);
                    var t = row.GetComponentInChildren<TMP_Text>();
                    if (t != null) t.text = $"+{ResourceFormat.Abbreviate(item.amount)} {item.resource}";
                }
            }
        }

        public void Close() => panel.SetActive(false);
    }
}
