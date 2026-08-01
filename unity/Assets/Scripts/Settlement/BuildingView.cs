using UnityEngine;
using UnityEngine.UI;
using ShadowsOfTheShogun.Data;
using ShadowsOfTheShogun.Audio;

namespace ShadowsOfTheShogun.Settlement
{
    /// <summary>
    /// Renders a single building and handles tap → open upgrade panel. Shows a
    /// construction timer overlay while building/upgrading.
    /// </summary>
    public class BuildingView : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer sprite;
        [SerializeField] private ConstructionTimer constructionTimer;
        [SerializeField] private GameObject upgradeBadge;

        public BuildingData Data { get; private set; }
        private SettlementController _controller;

        public void Bind(BuildingData data, SettlementController controller)
        {
            Data = data;
            _controller = controller;
            transform.localPosition = new Vector3(data.gridX, 0f, data.gridY);
            if (data.isConstructing)
                constructionTimer.Begin(data.id, data.constructionEndsAt);
            else
                constructionTimer.Hide();
        }

        private void OnMouseUpAsButton() => OnTapped();

        public void OnTapped()
        {
            AudioManager.Instance?.PlaySfx("ui_tap");
            var panel = FindObjectOfType<BuildingUpgradeUI>(true);
            if (panel != null) panel.Open(Data);
        }
    }
}
