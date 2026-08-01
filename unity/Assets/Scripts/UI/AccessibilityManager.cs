using UnityEngine;
using ShadowsOfTheShogun.Core;

namespace ShadowsOfTheShogun.UI
{
    public enum ColorBlindMode { Normal, Protanopia, Deuteranopia, Tritanopia }

    /// <summary>
    /// Central accessibility settings (spec §108). Persists to PlayerPrefs and
    /// broadcasts <see cref="AccessibilityChanged"/> so UI can re-apply. Covers:
    /// scalable text, colour-blind palettes, reduced motion, vibration, flash
    /// reduction, adjustable battle speed and auto-battle.
    /// </summary>
    public class AccessibilityManager : MonoBehaviour
    {
        public static AccessibilityManager Instance { get; private set; }

        [SerializeField] private float textScale = 1.0f;         // 0.8x – 1.5x
        [SerializeField] private ColorBlindMode colorBlindMode = ColorBlindMode.Normal;
        [SerializeField] private bool reducedMotion;
        [SerializeField] private bool vibrationEnabled = true;
        [SerializeField] private bool flashReductionEnabled;
        [SerializeField] private float battleSpeed = 1.0f;       // 0.5x – 3x
        [SerializeField] private bool autoBattle;

        public float TextScale => textScale;
        public ColorBlindMode ColorBlind => colorBlindMode;
        public bool ReducedMotion => reducedMotion;
        public bool VibrationEnabled => vibrationEnabled;
        public bool FlashReductionEnabled => flashReductionEnabled;
        public float BattleSpeed => battleSpeed;
        public bool AutoBattle => autoBattle;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            Load();
        }

        public void SetTextScale(float scale)
        {
            textScale = Mathf.Clamp(scale, 0.8f, 1.5f);
            Save(Constants.PrefTextScale, textScale);
        }

        public void SetColorBlindMode(ColorBlindMode mode)
        {
            colorBlindMode = mode;
            PlayerPrefs.SetInt(Constants.PrefColorBlind, (int)mode);
            Persist();
        }

        public void SetReducedMotion(bool value)
        {
            reducedMotion = value;
            PlayerPrefs.SetInt(Constants.PrefReducedMotion, value ? 1 : 0);
            Persist();
        }

        public void SetVibration(bool value) { vibrationEnabled = value; Persist(); }
        public void SetFlashReduction(bool value) { flashReductionEnabled = value; Persist(); }
        public void SetAutoBattle(bool value) { autoBattle = value; Persist(); }

        public void SetBattleSpeed(float speed)
        {
            battleSpeed = Mathf.Clamp(speed, 0.5f, 3.0f);
            Save(Constants.PrefBattleSpeed, battleSpeed);
        }

        /// <summary>Convenience: trigger device vibration honouring the setting.</summary>
        public void Vibrate()
        {
#if UNITY_ANDROID || UNITY_IOS
            if (vibrationEnabled) Handheld.Vibrate();
#endif
        }

        private void Save(string key, float value)
        {
            PlayerPrefs.SetFloat(key, value);
            Persist();
        }

        private void Persist()
        {
            PlayerPrefs.Save();
            EventBus.Publish(new AccessibilityChanged());
        }

        private void Load()
        {
            textScale = PlayerPrefs.GetFloat(Constants.PrefTextScale, 1.0f);
            colorBlindMode = (ColorBlindMode)PlayerPrefs.GetInt(Constants.PrefColorBlind, 0);
            reducedMotion = PlayerPrefs.GetInt(Constants.PrefReducedMotion, 0) == 1;
            battleSpeed = PlayerPrefs.GetFloat(Constants.PrefBattleSpeed, 1.0f);
        }
    }
}
