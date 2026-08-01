using UnityEngine;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Network;

namespace ShadowsOfTheShogun.DevTools
{
    /// <summary>
    /// Dev-only: grant resources instantly (spec §27). Registers a `give` console
    /// command that calls a gated server dev endpoint — the server still owns the
    /// grant so anti-cheat parity is preserved even in dev.
    /// </summary>
    [RequireComponent(typeof(DeveloperConsole))]
    public class ResourceCheat : MonoBehaviour
    {
        private DeveloperConsole _console;

        private void Awake()
        {
            _console = GetComponent<DeveloperConsole>();
            _console.RegisterCommand("give", Give);
        }

        // Usage: give RICE 100000
        private void Give(string[] args)
        {
            if (GameManager.Instance == null || !GameManager.Instance.DeveloperMode)
            {
                _console.Print("Developer mode required.");
                return;
            }
            if (args.Length < 2 || !long.TryParse(args[1], out var amount))
            {
                _console.Print("Usage: give <RESOURCE> <amount>");
                return;
            }
            var resource = args[0].ToUpperInvariant();
            var api = ServiceLocator.Get<ApiClient>();
            api.Post<EmptyResponse>("/admin/dev/grant-resource",
                new GrantBody { resource = resource, amount = amount },
                res => _console.Print(res.Success
                    ? $"Granted {amount} {resource}"
                    : $"Failed: {res.Error}"));
        }

        [System.Serializable] private class GrantBody { public string resource; public long amount; }
    }
}
