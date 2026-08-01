using UnityEngine;
using TMPro;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.WorldMap
{
    /// <summary>
    /// Displays scouting results for a tile: garrison composition, defences and
    /// estimated loot (spec §14). Data is server-provided; the client only
    /// renders what scouting revealed.
    /// </summary>
    public class ScoutReportUI : MonoBehaviour
    {
        [SerializeField] private GameObject panel;
        [SerializeField] private TMP_Text tileLabel;
        [SerializeField] private TMP_Text garrisonLabel;
        [SerializeField] private TMP_Text defenceLabel;
        [SerializeField] private Transform lootContainer;
        [SerializeField] private GameObject lootRowPrefab;

        public void Show(Vector2Int tile, TroopData[] garrison, LootItem[] estimatedLoot, int defence)
        {
            panel.SetActive(true);
            tileLabel.text = $"Scout ({tile.x}, {tile.y})";
            defenceLabel.text = $"Defence: {defence}";

            int total = 0;
            if (garrison != null) foreach (var g in garrison) total += g.count;
            garrisonLabel.text = $"Garrison: ~{total} troops";

            foreach (Transform c in lootContainer) Destroy(c.gameObject);
            if (estimatedLoot != null)
                foreach (var item in estimatedLoot)
                {
                    var row = Instantiate(lootRowPrefab, lootContainer);
                    var t = row.GetComponentInChildren<TMP_Text>();
                    if (t != null) t.text = $"{item.resource}: ~{item.amount}";
                }
        }

        public void Close() => panel.SetActive(false);
    }
}
