using UnityEngine;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Settlement
{
    /// <summary>
    /// Drives ambient civilian NPCs wandering the settlement to sell the
    /// "living settlement" pillar (spec §7.1). Movement/animation is purely
    /// cosmetic and pauses under the reduced-motion accessibility setting.
    /// </summary>
    public class CivilianController : MonoBehaviour
    {
        [SerializeField] private Transform[] waypoints;
        [SerializeField] private float speed = 1.2f;
        [SerializeField] private Animator animator;

        private int _target;

        private void Update()
        {
            if (waypoints == null || waypoints.Length == 0) return;
            if (AccessibilityManager.Instance != null && AccessibilityManager.Instance.ReducedMotion)
            {
                if (animator != null) animator.speed = 0f;
                return;
            }
            if (animator != null) animator.speed = 1f;

            var dest = waypoints[_target].position;
            transform.position = Vector3.MoveTowards(transform.position, dest, speed * Time.deltaTime);
            if (Vector3.Distance(transform.position, dest) < 0.05f)
                _target = (_target + 1) % waypoints.Length;
        }
    }
}
