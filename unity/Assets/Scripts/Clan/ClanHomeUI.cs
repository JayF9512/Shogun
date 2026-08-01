using UnityEngine;
using TMPro;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Data;
using ShadowsOfTheShogun.Network;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Clan
{
    /// <summary>
    /// Clan overview screen: name, level, power, members and technology (spec §18).
    /// </summary>
    public class ClanHomeUI : ScreenView
    {
        [SerializeField] private TMP_Text nameLabel;
        [SerializeField] private TMP_Text statsLabel;
        [SerializeField] private TMP_Text announcementLabel;
        [SerializeField] private ClanMemberListUI memberList;

        [Tooltip("Set from the player's profile at runtime.")]
        public string ClanId;

        public override void OnShow() => Load();

        private void Load()
        {
            if (string.IsNullOrEmpty(ClanId))
            {
                nameLabel.text = "No clan";
                return;
            }
            ServiceLocator.Get<ClanService>().GetClan(ClanId, res =>
            {
                if (!res.Success || res.Data == null) return;
                var clan = res.Data;
                nameLabel.text = $"[{clan.tag}] {clan.name}";
                statsLabel.text = $"Lv {clan.level} · {clan.memberCount}/{clan.memberCap} · Power {clan.power}";
                announcementLabel.text = clan.announcement;
                memberList.Bind(clan.members);
            });
        }
    }
}
