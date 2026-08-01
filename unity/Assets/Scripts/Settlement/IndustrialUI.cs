using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Data;
using ShadowsOfTheShogun.Network;

namespace ShadowsOfTheShogun.Settlement
{
    /// <summary>
    /// Shows the player's Industrial level and (owner-only) private sub-stage
    /// progress (spec §10, §12). Only completed full Industrial levels are
    /// public; the sub-stage bar is visible to the owner alone.
    /// </summary>
    public class IndustrialUI : MonoBehaviour
    {
        [SerializeField] private GameObject panel;
        [SerializeField] private TMP_Text publicLevelLabel;
        [SerializeField] private GameObject subStageGroup;      // owner-only
        [SerializeField] private Slider subStageBar;
        [SerializeField] private TMP_Text subStageLabel;
        [SerializeField] private Button ascendButton;

        public void Bind(PlayerData player, bool isOwner)
        {
            panel.SetActive(true);
            publicLevelLabel.text = player.industrialLevel > 0
                ? $"Industrial {player.industrialLevel}"
                : $"Standard {player.level}";

            subStageGroup.SetActive(isOwner && player.tier == "INDUSTRIAL");
            if (isOwner)
            {
                subStageBar.value = player.industrialSubStage / (float)Constants.SubStagesPerLevel;
                subStageLabel.text = $"{player.industrialLevel}.{player.industrialSubStage}";
            }
        }

        public void CheckAscension(string playerId)
        {
            var players = ServiceLocator.Get<PlayerService>();
            players.GetAscensionStatus(playerId, res =>
            {
                if (res.Success && res.Data != null)
                    ascendButton.interactable = res.Data.eligible;
            });
        }

        public void RequestAscend(string playerId)
        {
            var players = ServiceLocator.Get<PlayerService>();
            players.Ascend(playerId, res =>
            {
                if (res.Success) Analytics.AnalyticsManager.Instance.Track(Analytics.AnalyticsEvent.IndustrialAscension);
            });
        }
    }
}
