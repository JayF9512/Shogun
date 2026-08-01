using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace ShadowsOfTheShogun.UI
{
    /// <summary>Full-screen loading overlay with a progress bar and status text.</summary>
    public class LoadingScreen : ScreenView
    {
        [SerializeField] private Slider progressBar;
        [SerializeField] private TMP_Text statusLabel;

        public void SetProgress(float normalized01, string status = null)
        {
            if (progressBar != null) progressBar.value = Mathf.Clamp01(normalized01);
            if (statusLabel != null && status != null) statusLabel.text = status;
        }
    }
}
