using UnityEngine;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Network;

namespace ShadowsOfTheShogun.DevTools
{
    /// <summary>
    /// Dev-only: skip active timers such as construction/training (spec §27).
    /// Registers a `skip` console command that calls a gated server dev endpoint;
    /// the server advances the timer so client and server stay consistent.
    /// </summary>
    [RequireComponent(typeof(DeveloperConsole))]
    public class TimerCheat : MonoBehaviour
    {
        private DeveloperConsole _console;

        private void Awake()
        {
            _console = GetComponent<DeveloperConsole>();
            _console.RegisterCommand("skip", Skip);
        }

        // Usage: skip <buildingId|marchId>
        private void Skip(string[] args)
        {
            if (GameManager.Instance == null || !GameManager.Instance.DeveloperMode)
            {
                _console.Print("Developer mode required.");
                return;
            }
            if (args.Length < 1)
            {
                _console.Print("Usage: skip <timerId>");
                return;
            }
            var api = ServiceLocator.Get<ApiClient>();
            api.Post<EmptyResponse>("/admin/dev/skip-timer",
                new SkipBody { timerId = args[0] },
                res => _console.Print(res.Success ? "Timer skipped" : $"Failed: {res.Error}"));
        }

        [System.Serializable] private class SkipBody { public string timerId; }
    }
}
