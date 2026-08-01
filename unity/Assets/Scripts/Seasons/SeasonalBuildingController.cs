using UnityEngine;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Seasons
{
    /// <summary>
    /// Swaps building visuals for the active natural season — spring blossoms,
    /// summer, autumn leaves, winter snow (spec §21, §23). Purely cosmetic; the
    /// active season is driven by the server clock.
    /// </summary>
    public class SeasonalBuildingController : MonoBehaviour
    {
        public enum NaturalSeason { Spring, Summer, Autumn, Winter }

        [System.Serializable]
        public class SeasonVisual { public NaturalSeason season; public GameObject[] enable; }

        [SerializeField] private SeasonVisual[] visuals;

        public void ApplySeason(NaturalSeason season)
        {
            foreach (var v in visuals)
            {
                bool on = v.season == season;
                foreach (var go in v.enable) if (go != null) go.SetActive(on);
            }
        }
    }
}
