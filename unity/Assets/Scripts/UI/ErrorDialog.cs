using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace ShadowsOfTheShogun.UI
{
    /// <summary>Modal error popup with an optional retry callback (spec §107).</summary>
    public class ErrorDialog : MonoBehaviour
    {
        [SerializeField] private GameObject panel;
        [SerializeField] private TMP_Text messageLabel;
        [SerializeField] private Button retryButton;
        [SerializeField] private Button dismissButton;

        private Action _onRetry;

        private void Awake()
        {
            retryButton.onClick.AddListener(() => { panel.SetActive(false); _onRetry?.Invoke(); });
            dismissButton.onClick.AddListener(() => panel.SetActive(false));
        }

        public void Show(string message, Action onRetry = null)
        {
            messageLabel.text = message;
            _onRetry = onRetry;
            retryButton.gameObject.SetActive(onRetry != null);
            panel.SetActive(true);
        }
    }
}
