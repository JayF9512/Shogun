using UnityEngine;
using ShadowsOfTheShogun.Core;

namespace ShadowsOfTheShogun.UI
{
    /// <summary>
    /// Root HUD orchestrator that owns persistent overlays (resource bar,
    /// currency bar, bottom navigation) shown across gameplay screens (spec §107).
    /// </summary>
    public class MainHUD : MonoBehaviour
    {
        [SerializeField] private GameObject topResourceBar;
        [SerializeField] private GameObject currencyBar;
        [SerializeField] private GameObject bottomNav;
        [SerializeField] private ScreenManager screenManager;

        private void Start()
        {
            ServiceLocator.Register(screenManager);
            EventBus.Subscribe<AuthStateChanged>(OnAuth);
            SetHudVisible(false);
        }

        private void OnDestroy() => EventBus.Unsubscribe<AuthStateChanged>(OnAuth);

        private void OnAuth(AuthStateChanged e) => SetHudVisible(e.IsLoggedIn);

        private void SetHudVisible(bool visible)
        {
            topResourceBar.SetActive(visible);
            currencyBar.SetActive(visible);
            bottomNav.SetActive(visible);
        }

        // Bottom-nav button hooks (wired in the Inspector).
        public void GoSettlement() => screenManager.Show(ScreenId.Settlement);
        public void GoWorldMap() => screenManager.Show(ScreenId.WorldMap);
        public void GoHeroes() => screenManager.Show(ScreenId.Heroes);
        public void GoClan() => screenManager.Show(ScreenId.Clan);
        public void GoStore() => screenManager.Show(ScreenId.Store);
    }
}
