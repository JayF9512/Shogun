using System;
using System.Collections;
using UnityEngine;
using ShadowsOfTheShogun.Core;

namespace ShadowsOfTheShogun.Network
{
    /// <summary>
    /// Handles login, registration, silent session restore and token refresh
    /// against the backend /auth endpoints. Tokens are stored in PlayerPrefs;
    /// on a real build prefer a secure keystore. Implements <see cref="IAuthProvider"/>
    /// so <see cref="ApiClient"/> can inject the bearer token and refresh on 401.
    /// </summary>
    public class AuthService : IAuthProvider
    {
        private readonly ApiClient _api;
        private string _accessToken;
        private string _refreshToken;

        public string AccessToken => _accessToken;
        public bool IsAuthenticated => !string.IsNullOrEmpty(_accessToken);
        public string PlayerId { get; private set; }

        public AuthService(ApiClient api)
        {
            _api = api;
            _refreshToken = PlayerPrefs.GetString(Constants.PrefRefreshToken, null);
        }

        // --- DTOs --------------------------------------------------------
        [Serializable] private class LoginBody { public string email; public string password; }
        [Serializable] private class RegisterBody
        { public string email; public string password; public string displayName; public string serverId; }
        [Serializable] private class RefreshBody { public string refreshToken; }
        [Serializable] private class TokenResponse
        { public string accessToken; public string refreshToken; public string playerId; }

        // --- Flows -------------------------------------------------------
        public IEnumerator Login(string email, string password, Action<bool, string> done)
        {
            yield return _api.Post<TokenResponse>("/auth/login",
                new LoginBody { email = email, password = password },
                res => HandleToken(res, done));
        }

        public IEnumerator Register(string email, string password, string displayName,
            string serverId, Action<bool, string> done)
        {
            yield return _api.Post<TokenResponse>("/auth/register",
                new RegisterBody { email = email, password = password, displayName = displayName, serverId = serverId },
                res => HandleToken(res, done));
        }

        /// <summary>Attempts to re-auth silently using a stored refresh token.</summary>
        public IEnumerator TryRestoreSession()
        {
            if (string.IsNullOrEmpty(_refreshToken)) yield break;
            var ok = false;
            yield return Refresh(r => ok = r);
            if (ok) EventBus.Publish(new AuthStateChanged(true));
        }

        public IEnumerator Refresh(Action<bool> done)
        {
            if (string.IsNullOrEmpty(_refreshToken)) { done?.Invoke(false); yield break; }
            yield return _api.Post<TokenResponse>("/auth/refresh",
                new RefreshBody { refreshToken = _refreshToken },
                res =>
                {
                    if (res.Success && res.Data != null && !string.IsNullOrEmpty(res.Data.accessToken))
                    {
                        Store(res.Data);
                        done?.Invoke(true);
                    }
                    else
                    {
                        ClearTokens();
                        done?.Invoke(false);
                    }
                });
        }

        public void Logout()
        {
            // Best-effort server revoke; local clear is what matters for security.
            if (!string.IsNullOrEmpty(_refreshToken))
                _api.Post<EmptyResponse>("/auth/logout",
                    new RefreshBody { refreshToken = _refreshToken }, _ => { });
            ClearTokens();
        }

        // --- Helpers -----------------------------------------------------
        private void HandleToken(ApiResponse<TokenResponse> res, Action<bool, string> done)
        {
            if (res.Success && res.Data != null && !string.IsNullOrEmpty(res.Data.accessToken))
            {
                Store(res.Data);
                EventBus.Publish(new AuthStateChanged(true));
                done?.Invoke(true, null);
            }
            else
            {
                done?.Invoke(false, res.Error ?? "Authentication failed");
            }
        }

        private void Store(TokenResponse t)
        {
            _accessToken = t.accessToken;
            if (!string.IsNullOrEmpty(t.refreshToken)) _refreshToken = t.refreshToken;
            if (!string.IsNullOrEmpty(t.playerId)) PlayerId = t.playerId;
            PlayerPrefs.SetString(Constants.PrefAccessToken, _accessToken);
            PlayerPrefs.SetString(Constants.PrefRefreshToken, _refreshToken);
            PlayerPrefs.Save();
        }

        private void ClearTokens()
        {
            _accessToken = null;
            _refreshToken = null;
            PlayerId = null;
            PlayerPrefs.DeleteKey(Constants.PrefAccessToken);
            PlayerPrefs.DeleteKey(Constants.PrefRefreshToken);
            PlayerPrefs.Save();
        }
    }
}
