using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace ShadowsOfTheShogun.Core
{
    /// <summary>
    /// First MonoBehaviour to run in the Bootstrap scene. Applies global
    /// application settings, guarantees a persistent <see cref="GameManager"/>
    /// (which wires the ServiceLocator and network stack), checks for a stored
    /// auth token, and transitions to the appropriate scene:
    /// Main when a session can be restored, otherwise Login.
    /// The client is presentation-only; all authoritative state comes from the
    /// backend (spec §98).
    /// </summary>
    [DefaultExecutionOrder(-1000)]
    public class Bootstrap : MonoBehaviour
    {
        [Header("Scene routing")]
        [SerializeField] private string loginScene = "Login";
        [SerializeField] private string mainScene = "Main";

        [Header("Optional configuration override")]
        [Tooltip("Leave empty to use Constants.ApiBaseUrl.")]
        [SerializeField] private string apiBaseUrlOverride = "";

        private void Awake()
        {
            // Portrait mobile presentation @ 60fps (spec §107).
            Application.targetFrameRate = 60;
            Screen.orientation = ScreenOrientation.Portrait;
            Screen.sleepTimeout = SleepTimeout.SystemSetting;
            DontDestroyOnLoad(gameObject);
        }

        private IEnumerator Start()
        {
            EnsureGameManager();
            yield return null; // allow GameManager.Awake/Bootstrap to run

            var authed = HasStoredSession();
            var target = authed ? mainScene : loginScene;
            Debug.Log($"[Bootstrap] Stored session: {authed} → loading '{target}'.");

            // Guard against a missing scene in the build settings.
            if (Application.CanStreamedLevelBeLoaded(target))
                SceneManager.LoadScene(target);
            else
                Debug.LogWarning($"[Bootstrap] Scene '{target}' is not in Build Settings.");
        }

        /// <summary>Creates a GameManager if the Bootstrap scene doesn't ship one.</summary>
        private static void EnsureGameManager()
        {
            if (GameManager.Instance != null) return;
            if (Object.FindObjectOfType<GameManager>() != null) return;
            var go = new GameObject("GameManager");
            go.AddComponent<GameManager>();
        }

        /// <summary>True when a refresh token is present for a silent re-auth.</summary>
        private static bool HasStoredSession()
            => !string.IsNullOrEmpty(PlayerPrefs.GetString(Constants.PrefRefreshToken, ""));
    }
}
