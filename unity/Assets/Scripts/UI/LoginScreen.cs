using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Network;

namespace ShadowsOfTheShogun.UI
{
    /// <summary>
    /// Login / registration entry screen. Collects credentials, drives the
    /// <see cref="AuthService"/> flows, surfaces a loading + error state, and
    /// navigates to the Main scene on success. Authentication is fully
    /// server-authoritative (spec §98); this screen only relays input.
    /// </summary>
    public class LoginScreen : MonoBehaviour
    {
        [Header("Inputs")]
        [SerializeField] private TMP_InputField emailInput;
        [SerializeField] private TMP_InputField passwordInput;
        [SerializeField] private TMP_InputField displayNameInput; // register only

        [Header("Buttons")]
        [SerializeField] private Button loginButton;
        [SerializeField] private Button registerButton;
        [SerializeField] private Button toggleModeButton;

        [Header("State")]
        [SerializeField] private GameObject loadingOverlay;
        [SerializeField] private TMP_Text statusLabel;
        [SerializeField] private GameObject displayNameGroup;

        [Header("Navigation")]
        [SerializeField] private string mainScene = "Main";

        [Header("Config")]
        [Tooltip("Default server/shard to register new accounts on.")]
        [SerializeField] private string defaultServerId = "s1";

        private bool _registerMode;
        private bool _busy;

        private void Awake()
        {
            if (loginButton != null) loginButton.onClick.AddListener(OnSubmit);
            if (registerButton != null) registerButton.onClick.AddListener(OnSubmit);
            if (toggleModeButton != null) toggleModeButton.onClick.AddListener(ToggleMode);
            SetLoading(false);
            SetStatus(string.Empty);
            ApplyMode();
        }

        private void OnDestroy()
        {
            if (loginButton != null) loginButton.onClick.RemoveListener(OnSubmit);
            if (registerButton != null) registerButton.onClick.RemoveListener(OnSubmit);
            if (toggleModeButton != null) toggleModeButton.onClick.RemoveListener(ToggleMode);
        }

        private void ToggleMode()
        {
            _registerMode = !_registerMode;
            ApplyMode();
        }

        private void ApplyMode()
        {
            if (displayNameGroup != null) displayNameGroup.SetActive(_registerMode);
            SetStatus(_registerMode ? "Create your account" : "Welcome back");
        }

        private void OnSubmit()
        {
            if (_busy) return;

            var email = emailInput != null ? emailInput.text.Trim() : "";
            var password = passwordInput != null ? passwordInput.text : "";
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                SetStatus("Please enter your email and password.");
                return;
            }

            if (!ServiceLocator.TryGet<AuthService>(out var auth))
            {
                SetStatus("Service unavailable. Please try again.");
                return;
            }

            SetLoading(true);
            SetStatus(_registerMode ? "Creating account…" : "Signing in…");

            if (_registerMode)
            {
                var displayName = displayNameInput != null ? displayNameInput.text.Trim() : "";
                if (string.IsNullOrEmpty(displayName))
                {
                    SetLoading(false);
                    SetStatus("Please choose a display name.");
                    return;
                }
                StartCoroutine(auth.Register(email, password, displayName, defaultServerId, OnAuthResult));
            }
            else
            {
                StartCoroutine(auth.Login(email, password, OnAuthResult));
            }
        }

        private void OnAuthResult(bool success, string error)
        {
            SetLoading(false);
            if (success)
            {
                SetStatus("Success!");
                if (Application.CanStreamedLevelBeLoaded(mainScene))
                    SceneManager.LoadScene(mainScene);
            }
            else
            {
                SetStatus(string.IsNullOrEmpty(error) ? "Authentication failed." : error);
            }
        }

        private void SetLoading(bool busy)
        {
            _busy = busy;
            if (loadingOverlay != null) loadingOverlay.SetActive(busy);
            if (loginButton != null) loginButton.interactable = !busy;
            if (registerButton != null) registerButton.interactable = !busy;
            if (toggleModeButton != null) toggleModeButton.interactable = !busy;
        }

        private void SetStatus(string message)
        {
            if (statusLabel != null) statusLabel.text = message;
        }
    }
}
