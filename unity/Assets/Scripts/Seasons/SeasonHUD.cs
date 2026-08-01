using System;
using UnityEngine;
using TMPro;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Seasons
{
    /// <summary>
    /// Shows the current competitive season and time remaining (spec §21, §22).
    /// The season end time is server-provided; the HUD only counts down.
    /// </summary>
    public class SeasonHUD : MonoBehaviour
    {
        [SerializeField] private TMP_Text seasonLabel;
        [SerializeField] private TimerDisplay timerDisplay;

        private DateTime _endsUtc;
        private string _seasonName;

        public void SetSeason(string name, DateTime endsUtc)
        {
            _seasonName = name;
            _endsUtc = endsUtc.ToUniversalTime();
            seasonLabel.text = name;
        }

        private void Update()
        {
            var remaining = (_endsUtc - DateTime.UtcNow).TotalSeconds;
            timerDisplay.SetSeconds(remaining);
        }
    }
}
