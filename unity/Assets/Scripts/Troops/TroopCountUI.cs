using System.Collections.Generic;
using UnityEngine;
using TMPro;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Network;
using ShadowsOfTheShogun.Economy;

namespace ShadowsOfTheShogun.Troops
{
    /// <summary>
    /// Displays owned troop counts per class with icons (spec §7.3): Samurai,
    /// Yumi, Komainu. Refreshed from the server troop endpoint.
    /// </summary>
    public class TroopCountUI : MonoBehaviour
    {
        [SerializeField] private TMP_Text samuraiLabel;
        [SerializeField] private TMP_Text yumiLabel;
        [SerializeField] private TMP_Text komainuLabel;

        public void Refresh(string playerId)
        {
            ServiceLocator.Get<TroopService>().GetTroops(playerId, res =>
            {
                if (!res.Success || res.Data?.troops == null) return;
                var totals = new Dictionary<string, long>();
                foreach (var t in res.Data.troops)
                    totals[t.troopClass] = totals.GetValueOrDefault(t.troopClass) + t.count;

                samuraiLabel.text = ResourceFormat.Abbreviate(totals.GetValueOrDefault("SAMURAI_GUARD"));
                yumiLabel.text = ResourceFormat.Abbreviate(totals.GetValueOrDefault("YUMI_ARCHERS"));
                komainuLabel.text = ResourceFormat.Abbreviate(totals.GetValueOrDefault("KOMAINU_RIDERS"));
            });
        }
    }
}
