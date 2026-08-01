using System.Collections;
using UnityEngine;
using TMPro;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Economy
{
    /// <summary>
    /// Animated "+N Rice" popup shown when a player taps a producing building.
    /// Respects the reduced-motion accessibility setting (spec §108) by skipping
    /// the float/fade tween and simply fading briefly instead.
    /// </summary>
    public class CollectionPopup : MonoBehaviour
    {
        [SerializeField] private TMP_Text label;
        [SerializeField] private CanvasGroup canvasGroup;
        [SerializeField] private float riseDistance = 80f;
        [SerializeField] private float duration = 1.0f;

        public void Show(string resource, long amount)
        {
            label.text = $"+{ResourceFormat.Abbreviate(amount)} {resource}";
            StopAllCoroutines();
            StartCoroutine(Animate());
        }

        private IEnumerator Animate()
        {
            var start = transform.localPosition;
            var reduced = AccessibilityManager.Instance != null &&
                          AccessibilityManager.Instance.ReducedMotion;
            float t = 0f;
            while (t < duration)
            {
                t += Time.deltaTime;
                float k = t / duration;
                if (!reduced)
                    transform.localPosition = start + Vector3.up * (riseDistance * k);
                canvasGroup.alpha = 1f - k;
                yield return null;
            }
            transform.localPosition = start;
            Destroy(gameObject);
        }
    }
}
