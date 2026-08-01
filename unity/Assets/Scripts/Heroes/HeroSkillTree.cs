using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Data;
using ShadowsOfTheShogun.Network;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Heroes
{
    /// <summary>
    /// Visual skill-unlock tree (spec §13). Nodes are locked until their
    /// prerequisites are met; unlock/upgrade requests are validated server-side.
    /// </summary>
    public class HeroSkillTree : MonoBehaviour
    {
        [SerializeField] private Transform nodeContainer;
        [SerializeField] private HeroSkillNode nodePrefab;

        private readonly List<HeroSkillNode> _nodes = new();
        private HeroData _hero;

        public void Build(HeroData hero)
        {
            _hero = hero;
            foreach (var n in _nodes) Destroy(n.gameObject);
            _nodes.Clear();
            foreach (var skill in hero.skills)
            {
                var node = Instantiate(nodePrefab, nodeContainer);
                bool unlockable = CanUnlock(hero, skill);
                node.Bind(skill, unlockable, () => Upgrade(skill.key));
                _nodes.Add(node);
            }
        }

        private static bool CanUnlock(HeroData hero, HeroSkill skill)
        {
            if (skill.unlocked && skill.level >= skill.maxLevel) return false;
            foreach (var prereq in skill.prerequisites)
            {
                var p = hero.skills.Find(s => s.key == prereq);
                if (p == null || !p.unlocked) return false;
            }
            return true;
        }

        private void Upgrade(string skillKey)
        {
            ServiceLocator.Get<HeroService>().UpgradeSkill(_hero.id, skillKey, res =>
            {
                if (res.Success && res.Data != null) Build(res.Data);
                else ToastNotification.Instance?.Show("Cannot upgrade skill");
            });
        }
    }
}
