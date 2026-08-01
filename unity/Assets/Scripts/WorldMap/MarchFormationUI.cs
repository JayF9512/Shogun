using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Data;
using ShadowsOfTheShogun.Network;
using ShadowsOfTheShogun.UI;
using ShadowsOfTheShogun.Analytics;

namespace ShadowsOfTheShogun.WorldMap
{
    /// <summary>
    /// Lets the player pick troops for a march to a selected tile and dispatches
    /// it (spec §15). The server computes speed, ETA and enforces the march cap.
    /// </summary>
    public class MarchFormationUI : MonoBehaviour
    {
        [SerializeField] private GameObject panel;
        [SerializeField] private TMP_Text targetLabel;
        [SerializeField] private TMP_InputField samuraiInput;
        [SerializeField] private TMP_InputField yumiInput;
        [SerializeField] private TMP_InputField komainuInput;
        [SerializeField] private Button marchButton;

        private Vector2Int _target;

        public void OpenFor(Vector2Int tile, Vector2Int origin)
        {
            _target = tile;
            panel.SetActive(true);
            targetLabel.text = $"March to ({tile.x}, {tile.y})";
        }

        public void Dispatch(int originX, int originY)
        {
            var participants = new List<MarchParticipant>();
            AddIfAny(participants, "SAMURAI_GUARD", samuraiInput);
            AddIfAny(participants, "YUMI_ARCHERS", yumiInput);
            int komainu = AddIfAny(participants, "KOMAINU_RIDERS", komainuInput);
            if (participants.Count == 0)
            {
                ToastNotification.Instance?.Show("Select troops to march");
                return;
            }

            var body = new MarchService.CreateMarchBody
            {
                originX = originX, originY = originY,
                targetX = _target.x, targetY = _target.y,
                hasKomainu = komainu > 0,
                participants = participants.ToArray(),
            };
            ServiceLocator.Get<MarchService>().CreateMarch(body, res =>
            {
                if (res.Success)
                {
                    AnalyticsManager.Instance.Track(AnalyticsEvent.FirstMarch);
                    panel.SetActive(false);
                }
                else ToastNotification.Instance?.Show(res.Error ?? "March failed");
            });
        }

        private int AddIfAny(List<MarchParticipant> list, string cls, TMP_InputField field)
        {
            if (int.TryParse(field.text, out var n) && n > 0)
            {
                list.Add(new MarchParticipant { troopClass = cls, count = n });
                return n;
            }
            return 0;
        }
    }
}
