using System.Collections.Generic;
using UnityEngine;
using TMPro;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Localisation
{
    /// <summary>
    /// Attach to a TMP_Text to auto-translate a localisation key. Re-resolves on
    /// LocaleChanged, and applies the accessibility text-scale multiplier
    /// (spec §108, §109). Supports {var} args set at runtime.
    /// </summary>
    [RequireComponent(typeof(TMP_Text))]
    public class LocalisedText : MonoBehaviour
    {
        [SerializeField] private string localisationKey;
        [SerializeField] private bool applyTextScale = true;

        private TMP_Text _text;
        private float _baseFontSize;
        private Dictionary<string, string> _args;

        private void Awake()
        {
            _text = GetComponent<TMP_Text>();
            _baseFontSize = _text.fontSize;
        }

        private void OnEnable()
        {
            EventBus.Subscribe<LocaleChanged>(OnLocaleChanged);
            EventBus.Subscribe<AccessibilityChanged>(OnAccessibilityChanged);
            Refresh();
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<LocaleChanged>(OnLocaleChanged);
            EventBus.Unsubscribe<AccessibilityChanged>(OnAccessibilityChanged);
        }

        public void SetKey(string key) { localisationKey = key; Refresh(); }
        public void SetArgs(Dictionary<string, string> args) { _args = args; Refresh(); }

        private void OnLocaleChanged(LocaleChanged _) => Refresh();
        private void OnAccessibilityChanged(AccessibilityChanged _) => ApplyScale();

        private void Refresh()
        {
            if (_text == null) return;
            _text.text = LocalisationManager.Instance.Get(localisationKey, _args);
            if (LocalisationManager.Instance.IsRtl)
                _text.isRightToLeftText = true;
            ApplyScale();
        }

        private void ApplyScale()
        {
            if (!applyTextScale || _text == null) return;
            var scale = AccessibilityManager.Instance != null
                ? AccessibilityManager.Instance.TextScale : 1f;
            _text.fontSize = _baseFontSize * scale;
        }
    }
}
