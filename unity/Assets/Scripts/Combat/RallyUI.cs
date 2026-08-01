using System.Collections.Generic;
using UnityEngine;
using TMPro;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Data;
using ShadowsOfTheShogun.Network;

namespace ShadowsOfTheShogun.Combat
{
    /// <summary>
    /// Rally creation and join flow for coordinated clan attacks (spec §19).
    /// Creating a rally starts a march with a staging window; members join by
    /// contributing troops. All timing/validation is server-side.
    /// </summary>
    public class RallyUI : MonoBehaviour
    {
        [SerializeField] private GameObject panel;
        [SerializeField] private TMP_Text targetLabel;
        [SerializeField] private TMP_Text timerLabel;
        [SerializeField] private Transform participantContainer;
        [SerializeField] private GameObject participantRowPrefab;

        private int _targetX, _targetY;

        public void OpenForTarget(int x, int y)
        {
            _targetX = x; _targetY = y;
            panel.SetActive(true);
            targetLabel.text = $"Rally → ({x}, {y})";
        }

        public void CreateRally(List<MarchParticipant> troops, bool hasKomainu)
        {
            var march = ServiceLocator.Get<MarchService>();
            var body = new MarchService.CreateMarchBody
            {
                targetX = _targetX, targetY = _targetY,
                hasKomainu = hasKomainu,
                participants = troops.ToArray(),
            };
            march.CreateMarch(body, res =>
            {
                if (res.Success) EventBus.Publish(new MarchArrived(res.Data.id));
            });
        }

        public void Close() => panel.SetActive(false);
    }
}
