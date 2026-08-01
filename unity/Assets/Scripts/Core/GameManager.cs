using System.Collections;
using UnityEngine;
using ShadowsOfTheShogun.Network;
using ShadowsOfTheShogun.Economy;
using ShadowsOfTheShogun.Localisation;
using ShadowsOfTheShogun.Audio;
using ShadowsOfTheShogun.Analytics;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Core
{
    /// <summary>
    /// Root bootstrapper and lifecycle owner. Persists across scenes, wires the
    /// ServiceLocator, and drives the top-level game flow (boot → auth → play).
    /// The client is presentation-only; all authoritative state comes from the
    /// backend (spec §98).
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Configuration")]
        [SerializeField] private string apiBaseUrl = Constants.DefaultApiBaseUrl;
        [SerializeField] private bool developerMode;

        public bool DeveloperMode => developerMode;
        public GameState State { get; private set; } = GameState.Booting;

        // Core services (also registered in ServiceLocator).
        public ApiClient Api { get; private set; }
        public AuthService Auth { get; private set; }
        public ResourceManager Resources { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            Bootstrap();
        }

        private void Bootstrap()
        {
            // Network stack.
            Api = new ApiClient(this, apiBaseUrl);
            Auth = new AuthService(Api);
            Api.SetAuthProvider(Auth);
            ServiceLocator.Register(Api);
            ServiceLocator.Register(Auth);

            // Domain services.
            ServiceLocator.Register(new PlayerService(Api));
            ServiceLocator.Register(new SettlementService(Api));
            ServiceLocator.Register(new EconomyService(Api));
            ServiceLocator.Register(new TroopService(Api));
            ServiceLocator.Register(new HeroService(Api));
            ServiceLocator.Register(new MarchService(Api));
            ServiceLocator.Register(new ClanService(Api));
            ServiceLocator.Register(new StoreService(Api));
            ServiceLocator.Register(new ContentService(Api));
            ServiceLocator.Register(new SeasonPassService(Api));
            ServiceLocator.Register(new LeaderboardService(Api));

            // Cross-cutting managers.
            Resources = new ResourceManager(this, ServiceLocator.Get<EconomyService>());
            ServiceLocator.Register(Resources);
            ServiceLocator.Register(LocalisationManager.Instance);
            ServiceLocator.Register(AnalyticsManager.Instance);

            AnalyticsManager.Instance.Track(AnalyticsEvent.Install);
            StartCoroutine(BootFlow());
        }

        private IEnumerator BootFlow()
        {
            SetState(GameState.Booting);
            yield return LocalisationManager.Instance.LoadCurrentLocale();

            // Attempt silent re-auth from stored refresh token.
            SetState(GameState.Authenticating);
            var restore = Auth.TryRestoreSession();
            yield return restore;

            if (Auth.IsAuthenticated)
            {
                AnalyticsManager.Instance.Track(AnalyticsEvent.Login);
                EnterGame();
            }
            else
            {
                SetState(GameState.LoggedOut);
                if (ServiceLocator.TryGet<ScreenManager>(out var screens))
                    screens.Show(ScreenId.Login);
            }
        }

        public void EnterGame()
        {
            SetState(GameState.InGame);
            Resources.StartAutoSync();
            AudioManager.Instance.PlayMusic("bgm_settlement");
            if (ServiceLocator.TryGet<ScreenManager>(out var screens))
                screens.Show(ScreenId.Settlement);
        }

        public void Logout()
        {
            Resources.StopAutoSync();
            Auth.Logout();
            EventBus.Publish(new AuthStateChanged(false));
            SetState(GameState.LoggedOut);
            if (ServiceLocator.TryGet<ScreenManager>(out var screens))
                screens.Show(ScreenId.Login);
        }

        private void SetState(GameState state)
        {
            State = state;
            Debug.Log($"[GameManager] State → {state}");
        }

        private void OnApplicationPause(bool paused)
        {
            // Re-sync authoritative state when returning from background so
            // offline earnings and timers reflect the server (spec §98).
            if (!paused && State == GameState.InGame)
                Resources.RequestHardSync();
        }
    }

    public enum GameState
    {
        Booting,
        Authenticating,
        LoggedOut,
        InGame,
    }
}
