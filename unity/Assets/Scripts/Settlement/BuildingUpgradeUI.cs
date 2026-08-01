using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Data;
using ShadowsOfTheShogun.Network;
using ShadowsOfTheShogun.Economy;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Settlement
{
    /// <summary>
    /// Upgrade panel: shows next-level cost/time/requirements and requests the
    /// upgrade. Applies an optimistic resource debit that rolls back if the
    /// server rejects (spec §98).
    /// </summary>
    public class BuildingUpgradeUI : MonoBehaviour
    {
        [SerializeField] private GameObject panel;
        [SerializeField] private TMP_Text titleLabel;
        [SerializeField] private TMP_Text costLabel;
        [SerializeField] private TMP_Text timeLabel;
        [SerializeField] private TMP_Text requirementLabel;
        [SerializeField] private Button upgradeButton;

        private BuildingData _building;

        public void Open(BuildingData building)
        {
            _building = building;
            panel.SetActive(true);
            titleLabel.text = $"{building.definitionKey} · Lv {building.level}";
            // Cost/time would come from a BuildingDefinitionSO tier lookup; the
            // server is the source of truth and re-validates on request.
            upgradeButton.interactable = !building.isConstructing;
            requirementLabel.text = building.isConstructing ? "Under construction" : "";
        }

        public void RequestUpgrade(long riceCost, long woodCost)
        {
            var resources = ServiceLocator.Get<ResourceManager>();
            var costs = new Dictionary<string, long> { ["RICE"] = riceCost, ["WOOD"] = woodCost };
            if (!resources.CanAfford("RICE", riceCost) || !resources.CanAfford("WOOD", woodCost))
            {
                ToastNotification.Instance?.Show("Not enough resources");
                return;
            }

            resources.SpendOptimistic(costs, _ => { });
            var settlements = ServiceLocator.Get<SettlementService>();
            settlements.UpgradeBuilding(_building.id, res =>
            {
                if (res.Success && res.Data != null)
                {
                    resources.CommitLastSpend();
                    ToastNotification.Instance?.Show("Upgrade started");
                    panel.SetActive(false);
                }
                else
                {
                    resources.RollbackLastSpend();
                    ToastNotification.Instance?.Show("Upgrade failed");
                }
            });
        }

        public void Close() => panel.SetActive(false);
    }
}
