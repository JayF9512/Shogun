using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Heroes
{
    /// <summary>A single node in the hero skill tree.</summary>
    public class HeroSkillNode : MonoBehaviour
    {
        [SerializeField] private TMP_Text nameLabel;
        [SerializeField] private TMP_Text levelLabel;
        [SerializeField] private Button button;
        [SerializeField] private GameObject lockedOverlay;

        public void Bind(HeroSkill skill, bool unlockable, Action onUpgrade)
        {
            nameLabel.text = skill.name;
            levelLabel.text = $"{skill.level}/{skill.maxLevel}";
            lockedOverlay.SetActive(!skill.unlocked && !unlockable);
            button.interactable = unlockable;
            button.onClick.RemoveAllListeners();
            button.onClick.AddListener(() => onUpgrade?.Invoke());
        }
    }
}
