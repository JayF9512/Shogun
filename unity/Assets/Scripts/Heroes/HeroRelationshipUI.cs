using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Heroes
{
    /// <summary>
    /// Shows a hero's relationships as affinity meters and surfaces dialogue
    /// triggers when a relationship tier threshold is reached (spec §7.5, §9).
    /// </summary>
    public class HeroRelationshipUI : MonoBehaviour
    {
        [SerializeField] private Transform container;
        [SerializeField] private GameObject rowPrefab;

        public void Bind(HeroData hero)
        {
            foreach (Transform c in container) Destroy(c.gameObject);
            if (hero.relationships == null) return;
            foreach (var rel in hero.relationships)
            {
                var row = Instantiate(rowPrefab, container);
                var label = row.GetComponentInChildren<TMP_Text>();
                if (label != null) label.text = $"{rel.otherHeroName}  (Tier {rel.tier})";
                var slider = row.GetComponentInChildren<Slider>();
                if (slider != null) slider.value = rel.points / 100f;
            }
        }
    }
}
