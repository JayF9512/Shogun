using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using ShadowsOfTheShogun.Core;

namespace ShadowsOfTheShogun.Network
{
    /// <summary>Supplies the current bearer token and can refresh it on 401.</summary>
    public interface IAuthProvider
    {
        string AccessToken { get; }
        IEnumerator Refresh(Action<bool> done);
    }

    /// <summary>Result wrapper for an API call.</summary>
    public class ApiResponse<T>
    {
        public bool Success;
        public long StatusCode;
        public T Data;
        public string Error;
    }

    /// <summary>
    /// Thin HTTP client over UnityWebRequest. All game state is server
    /// authoritative (spec §98) so every mutation flows through here. Handles
    /// JSON (de)serialisation, auth headers, timeouts, and one automatic token
    /// refresh + retry on 401.
    /// </summary>
    public class ApiClient
    {
        private readonly MonoBehaviour _runner; // coroutine host (GameManager)
        private readonly string _baseUrl;
        private IAuthProvider _auth;

        public ApiClient(MonoBehaviour runner, string baseUrl)
        {
            _runner = runner;
            _baseUrl = baseUrl.TrimEnd('/');
        }

        public void SetAuthProvider(IAuthProvider auth) => _auth = auth;

        // --- Public verbs ------------------------------------------------
        public Coroutine Get<T>(string path, Action<ApiResponse<T>> cb)
            => _runner.StartCoroutine(Send("GET", path, null, cb));

        public Coroutine Post<T>(string path, object body, Action<ApiResponse<T>> cb)
            => _runner.StartCoroutine(Send("POST", path, body, cb));

        public Coroutine Put<T>(string path, object body, Action<ApiResponse<T>> cb)
            => _runner.StartCoroutine(Send("PUT", path, body, cb));

        public Coroutine Delete<T>(string path, Action<ApiResponse<T>> cb)
            => _runner.StartCoroutine(Send("DELETE", path, null, cb));

        // --- Core send with auth + one refresh retry ---------------------
        private IEnumerator Send<T>(string method, string path, object body,
            Action<ApiResponse<T>> cb, bool isRetry = false)
        {
            var url = _baseUrl + (path.StartsWith("/") ? path : "/" + path);
            using var req = new UnityWebRequest(url, method);
            req.timeout = Constants.RequestTimeoutSeconds;
            req.downloadHandler = new DownloadHandlerBuffer();

            if (body != null)
            {
                var json = JsonUtility.ToJson(body);
                req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
                req.SetRequestHeader("Content-Type", "application/json");
            }

            var token = _auth?.AccessToken;
            if (!string.IsNullOrEmpty(token))
                req.SetRequestHeader("Authorization", "Bearer " + token);

            yield return req.SendWebRequest();

            // Auto refresh + retry once on unauthorized.
            if (req.responseCode == 401 && !isRetry && _auth != null)
            {
                var refreshed = false;
                yield return _auth.Refresh(ok => refreshed = ok);
                if (refreshed)
                {
                    yield return Send(method, path, body, cb, isRetry: true);
                    yield break;
                }
            }

            cb?.Invoke(Parse<T>(req));
        }

        private static ApiResponse<T> Parse<T>(UnityWebRequest req)
        {
            var res = new ApiResponse<T> { StatusCode = req.responseCode };
            bool ok = req.result == UnityWebRequest.Result.Success
                      && req.responseCode >= 200 && req.responseCode < 300;
            if (ok)
            {
                res.Success = true;
                var text = req.downloadHandler.text;
                if (!string.IsNullOrEmpty(text) && typeof(T) != typeof(EmptyResponse))
                {
                    try { res.Data = JsonUtility.FromJson<T>(text); }
                    catch (Exception e) { res.Success = false; res.Error = "Parse error: " + e.Message; }
                }
            }
            else
            {
                res.Success = false;
                res.Error = string.IsNullOrEmpty(req.error)
                    ? $"HTTP {req.responseCode}" : req.error;
            }
            return res;
        }
    }

    /// <summary>Marker type for endpoints that return no meaningful body.</summary>
    [Serializable] public class EmptyResponse { }
}
