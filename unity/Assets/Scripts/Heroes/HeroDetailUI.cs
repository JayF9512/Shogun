using UnityEngine;
using TMPro;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Heroes
{
    /// <summary>
    /// Detailed hero view: stats, skills, relationships and equipment (spec §9,
    /// §13). Delegates the skill tree and relationship meter to sub-components.
    /// </summary>
    public class HeroDetailUI : MonoBehaviour
    {
        [SerializeField] private GameObject panel;
        [SerializeField] private TMP_Text nameLabel;
        [SerializeField] private TMP_Text statsLabel;
        [SerializeField] private HeroSkillTree skillTree;
        [SerializeField] private HeroRelationshipUI relationships;

        public void Show(HeroData hero)
        {
            panel.SetActive(true);
            nameLabel.text = $"{hero.name} ★{hero.stars} ({hero.rarity})";
            statsLabel.text =
                $"ATK {hero.attack}   DEF {hero.defense}\n" +
                $"March +{hero.marchBonus:P0}   Combat +{hero.combatBonus:P0}";
            skillTree.Build(hero);
            relationships.Bind(hero);
        }

        public void Close() => panel.SetActive(false);
    }
}
