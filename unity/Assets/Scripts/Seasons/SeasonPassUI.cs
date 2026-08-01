using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace ShadowsOfTheShogun.Seasons
{
    /// <summary>
    /// Season pass progression with free + premium reward tracks (spec §22, §25).
    /// Claim requests are validated server-side; the client reflects granted tiers.
    /// </summary>
    public class SeasonPassUI : ScreenViewProxy
    {
        [SerializeField] private Slider progressBar;
        [SerializeField] private TMP_Text tierLabel;
        [SerializeField] private Transform rewardTrack;
        [SerializeField] private GameObject rewardTierPrefab;

        public void Bind(int currentTier, int maxTier, float tierProgress, bool premiumOwned)
        {
            tierLabel.text = $"Tier {currentTier}/{maxTier}";
            progressBar.value = Mathf.Clamp01(tierProgress);
            foreach (Transform c in rewardTrack) Destroy(c.gameObject);
            for (int i = 1; i <= maxTier; i++)
            {
                var go = Instantiate(rewardTierPrefab, rewardTrack);
                var label = go.GetComponentInChildren<TMP_Text>();
                if (label != null) label.text = i.ToString();
            }
        }
    }

    /// <summary>Lightweight base so this panel can live outside the screen stack.</summary>
    public abstract class ScreenViewProxy : MonoBehaviour { }
}
