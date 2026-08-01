using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace ShadowsOfTheShogun.Events
{
    /// <summary>
    /// Event detail: progress, leaderboard snapshot and reward tiers (spec §22).
    /// </summary>
    public class EventDetailUI : MonoBehaviour
    {
        [SerializeField] private GameObject panel;
        [SerializeField] private TMP_Text titleLabel;
        [SerializeField] private Slider progressBar;
        [SerializeField] private Transform leaderboardContainer;
        [SerializeField] private GameObject leaderboardRowPrefab;

        public void Show(GameEventSummary summary)
        {
            panel.SetActive(true);
            titleLabel.text = summary.title;
            progressBar.value = Mathf.Clamp01(summary.progress);
        }

        public void Close() => panel.SetActive(false);
    }
}
