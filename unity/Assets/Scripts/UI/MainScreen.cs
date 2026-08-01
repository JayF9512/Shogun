using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Network;
using ShadowsOfTheShogun.Data;

namespace ShadowsOfTheShogun.UI
{
    /// <summary>
    /// Settlement hub screen. Shows the player's name, a resource/currency HUD
    /// (gold / jade / stamina) and a bottom navigation bar. All values are
    /// pulled from the backend (spec §98); this screen only renders them and
    /// routes navigation to other scenes.
    /// </summary>
    public class MainScreen : MonoBehaviour
    {
        [Header("Header")]
        [SerializeField] private TMP_Text playerNameLabel;
        [SerializeField] private TMP_Text playerLevelLabel;

        [Header("Resource HUD")]
        [SerializeField] private TMP_Text goldLabel;
        [SerializeField] private TMP_Text jadeLabel;
        [SerializeField] private TMP_Text staminaLabel;

        [Header("Bottom navigation")]
        [SerializeField] private Button settlementTab;
        [SerializeField] private Button heroesTab;
        [SerializeField] private Button worldMapTab;
        [SerializeField] private Button battleTab;
        [SerializeField] private Button logoutButton;

        private void Awake()
        {
            WireTab(settlementTab, () => { /* already on hub */ });
            WireTab(heroesTab, () => LoadScene("Heroes"));
            WireTab(worldMapTab, () => LoadScene("WorldMap"));
            WireTab(battleTab, () => LoadScene("Battle"));
            if (logoutButton != null) logoutButton.onClick.AddListener(OnLogout);
        }

        private void OnEnable()
        {
            EventBus.Subscribe<CurrencyChanged>(OnCurrencyChanged);
            Refresh();
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<CurrencyChanged>(OnCurrencyChanged);
        }

        /// <summary>Loads the player profile + currency snapshot from the server.</summary>
        private void Refresh()
        {
            SetPlaceholders();

            if (!ServiceLocator.TryGet<AuthService>(out var auth) || string.IsNullOrEmpty(auth.PlayerId))
                return;

            if (ServiceLocator.TryGet<PlayerService>(out var players))
            {
                players.GetProfile(auth.PlayerId, res =>
                {
                    if (res != null && res.Success && res.Data != null)
                        BindPlayer(res.Data);
                });
            }
        }

        private void BindPlayer(PlayerData player)
        {
            if (playerNameLabel != null) playerNameLabel.text = player.displayName;
            if (playerLevelLabel != null) playerLevelLabel.text = $"Lv {player.level}";
        }

        private void OnCurrencyChanged(CurrencyChanged e)
        {
            switch (e.Currency)
            {
                case "GOLD": SetLabel(goldLabel, e.NewBalance); break;
                case "JADE": SetLabel(jadeLabel, e.NewBalance); break;
                case "STAMINA": SetLabel(staminaLabel, e.NewBalance); break;
            }
        }

        private void SetPlaceholders()
        {
            if (playerNameLabel != null) playerNameLabel.text = "Daimyo";
            if (playerLevelLabel != null) playerLevelLabel.text = "Lv 1";
            SetLabel(goldLabel, 0);
            SetLabel(jadeLabel, 0);
            SetLabel(staminaLabel, 0);
        }

        private void OnLogout()
        {
            if (GameManager.Instance != null) GameManager.Instance.Logout();
            LoadScene("Login");
        }

        private static void WireTab(Button button, UnityEngine.Events.UnityAction action)
        {
            if (button != null) button.onClick.AddListener(action);
        }

        private static void SetLabel(TMP_Text label, long value)
        {
            if (label != null) label.text = value.ToString("N0");
        }

        private static void LoadScene(string scene)
        {
            if (Application.CanStreamedLevelBeLoaded(scene))
                SceneManager.LoadScene(scene);
            else
                Debug.LogWarning($"[MainScreen] Scene '{scene}' is not in Build Settings.");
        }
    }
}
