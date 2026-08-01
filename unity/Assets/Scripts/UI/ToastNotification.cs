using System.Collections;
using UnityEngine;
using TMPro;

namespace ShadowsOfTheShogun.UI
{
    /// <summary>Brief, auto-dismissing toast messages (spec §107).</summary>
    public class ToastNotification : MonoBehaviour
    {
        public static ToastNotification Instance { get; private set; }

        [SerializeField] private CanvasGroup group;
        [SerializeField] private TMP_Text label;
        [SerializeField] private float showSeconds = 2.0f;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            if (group != null) group.alpha = 0f;
        }

        public void Show(string message)
        {
            label.text = message;
            StopAllCoroutines();
            StartCoroutine(Run());
        }

        private IEnumerator Run()
        {
            group.alpha = 1f;
            yield return new WaitForSeconds(showSeconds);
            float t = 0f;
            while (t < 0.4f) { t += Time.deltaTime; group.alpha = 1f - t / 0.4f; yield return null; }
            group.alpha = 0f;
        }
    }
}
