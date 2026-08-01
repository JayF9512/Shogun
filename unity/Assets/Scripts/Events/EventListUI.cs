using System.Collections.Generic;
using UnityEngine;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Events
{
    /// <summary>Browser of currently active LiveOps events (spec §22, §28).</summary>
    [System.Serializable]
    public class GameEventSummary
    {
        public string id;
        public string title;
        public string endsAtIso;
        public float progress;
    }

    public class EventListUI : ScreenView
    {
        [SerializeField] private Transform container;
        [SerializeField] private GameObject rowPrefab;
        [SerializeField] private EventDetailUI detail;

        public void Populate(List<GameEventSummary> events)
        {
            foreach (Transform c in container) Destroy(c.gameObject);
            foreach (var e in events)
            {
                var row = Instantiate(rowPrefab, container);
                var label = row.GetComponentInChildren<TMPro.TMP_Text>();
                if (label != null) label.text = e.title;
                var button = row.GetComponentInChildren<UnityEngine.UI.Button>();
                if (button != null) button.onClick.AddListener(() => detail.Show(e));
            }
        }
    }
}
