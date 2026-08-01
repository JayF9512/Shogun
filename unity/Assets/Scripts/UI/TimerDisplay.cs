using UnityEngine;
using TMPro;

namespace ShadowsOfTheShogun.UI
{
    /// <summary>Formats and renders an HH:MM:SS countdown from a seconds value.</summary>
    public class TimerDisplay : MonoBehaviour
    {
        [SerializeField] private TMP_Text label;

        public void SetSeconds(double seconds)
        {
            if (seconds < 0) seconds = 0;
            label.text = Format(seconds);
        }

        public static string Format(double seconds)
        {
            var ts = System.TimeSpan.FromSeconds(seconds);
            return ts.TotalHours >= 1
                ? $"{(int)ts.TotalHours:00}:{ts.Minutes:00}:{ts.Seconds:00}"
                : $"{ts.Minutes:00}:{ts.Seconds:00}";
        }
    }
}
