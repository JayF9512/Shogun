using UnityEngine;
using UnityEngine.UI;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Combat
{
    /// <summary>
    /// Shows an advantage/disadvantage/neutral icon for a matchup so players can
    /// read the rock-paper-scissors counter at a glance (spec §7.3).
    /// </summary>
    public class TroopCounterIndicator : MonoBehaviour
    {
        [SerializeField] private Image icon;
        [SerializeField] private Sprite advantageSprite;
        [SerializeField] private Sprite disadvantageSprite;
        [SerializeField] private Sprite neutralSprite;

        public void SetMatchup(TroopClass mine, TroopClass enemy)
        {
            if (BattleResolver.HasCounterAdvantage(mine, enemy))
                icon.sprite = advantageSprite;
            else if (BattleResolver.HasCounterAdvantage(enemy, mine))
                icon.sprite = disadvantageSprite;
            else
                icon.sprite = neutralSprite;
        }
    }
}
