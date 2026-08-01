using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.Heroes
{
    /// <summary>A single hero card in the roster grid.</summary>
    public class HeroCard : MonoBehaviour
    {
        [SerializeField] private Image portrait;
        [SerializeField] private TMP_Text nameLabel;
        [SerializeField] private TMP_Text levelLabel;
        [SerializeField] private Button button;

        public void Bind(HeroData hero, Action onClick)
        {
            nameLabel.text = hero.name;
            levelLabel.text = $"Lv {hero.level}";
            button.onClick.RemoveAllListeners();
            button.onClick.AddListener(() => onClick?.Invoke());
        }
    }
}
