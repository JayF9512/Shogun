using System.Collections;
using UnityEngine;
using TMPro;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Events
{
    /// <summary>
    /// Floating banner announcing a new/active event. Respects reduced-motion by
    /// skipping the slide-in animation (spec §108).
    /// </summary>
    public class EventNotificationBanner : MonoBehaviour
    {
        [SerializeField] private RectTransform banner;
        [SerializeField] private TMP_Text messageLabel;
        [SerializeField] private float visibleSeconds = 3f;
        [SerializeField] private Vector2 hiddenPos = new(0, 200);
        [SerializeField] private Vector2 shownPos = new(0, -80);

        public void Show(string message)
        {
            messageLabel.text = message;
            StopAllCoroutines();
            StartCoroutine(Run());
        }

        private IEnumerator Run()
        {
            bool reduced = AccessibilityManager.Instance != null &&
                           AccessibilityManager.Instance.ReducedMotion;
            if (reduced)
            {
                banner.anchoredPosition = shownPos;
                yield return new WaitForSeconds(visibleSeconds);
                banner.anchoredPosition = hiddenPos;
                yield break;
            }

            yield return Slide(hiddenPos, shownPos, 0.3f);
            yield return new WaitForSeconds(visibleSeconds);
            yield return Slide(shownPos, hiddenPos, 0.3f);
        }

        private IEnumerator Slide(Vector2 from, Vector2 to, float dur)
        {
            float t = 0f;
            while (t < dur)
            {
                t += Time.deltaTime;
                banner.anchoredPosition = Vector2.Lerp(from, to, t / dur);
                yield return null;
            }
            banner.anchoredPosition = to;
        }
    }
}
