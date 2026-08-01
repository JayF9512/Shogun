using System.Collections.Generic;
using UnityEngine;
using TMPro;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Clan
{
    /// <summary>Roster of clan members with roles (spec §18).</summary>
    public class ClanMemberListUI : MonoBehaviour
    {
        [SerializeField] private Transform container;
        [SerializeField] private GameObject rowPrefab;

        public void Bind(List<ClanMember> members)
        {
            foreach (Transform c in container) Destroy(c.gameObject);
            if (members == null) return;
            foreach (var m in members)
            {
                var row = Instantiate(rowPrefab, container);
                var labels = row.GetComponentsInChildren<TMP_Text>();
                if (labels.Length > 0) labels[0].text = m.displayName;
                if (labels.Length > 1) labels[1].text = m.role;
                if (labels.Length > 2) labels[2].text = m.power.ToString();
            }
        }
    }
}
