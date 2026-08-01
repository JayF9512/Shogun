using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ShadowsOfTheShogun.Core;

namespace ShadowsOfTheShogun.DevTools
{
    /// <summary>
    /// In-game debug console (spec §27). Hidden in production builds and only
    /// usable when GameManager.DeveloperMode is enabled. Commands are registered
    /// by other dev tools; all state-changing commands ultimately hit gated
    /// server dev endpoints — nothing is granted purely client-side.
    ///
    /// Toggle: back-quote (`) key, or a 4-finger tap on device.
    /// </summary>
    public class DeveloperConsole : MonoBehaviour
    {
        [SerializeField] private GameObject panel;
        [SerializeField] private TMP_InputField input;
        [SerializeField] private TMP_Text output;

        private readonly Dictionary<string, Action<string[]>> _commands = new();

        private bool Enabled =>
            GameManager.Instance != null && GameManager.Instance.DeveloperMode;

        private void Awake()
        {
            RegisterCommand("help", _ => Print(string.Join(", ", _commands.Keys)));
            RegisterCommand("clear", _ => output.text = "");
            panel.SetActive(false);
        }

        public void RegisterCommand(string name, Action<string[]> handler)
            => _commands[name.ToLowerInvariant()] = handler;

        private void Update()
        {
            if (!Enabled) return;
            if (Input.GetKeyDown(KeyCode.BackQuote)) Toggle();
        }

        public void Toggle()
        {
            if (!Enabled) return;
            panel.SetActive(!panel.activeSelf);
            if (panel.activeSelf) input.ActivateInputField();
        }

        public void Submit()
        {
            var raw = input.text?.Trim();
            input.text = "";
            if (string.IsNullOrEmpty(raw)) return;
            Print("> " + raw);

            var parts = raw.Split(' ');
            var cmd = parts[0].ToLowerInvariant();
            var args = parts.Length > 1 ? parts[1..] : Array.Empty<string>();
            if (_commands.TryGetValue(cmd, out var handler))
            {
                try { handler(args); }
                catch (Exception e) { Print("Error: " + e.Message); }
            }
            else Print($"Unknown command '{cmd}'. Type 'help'.");
        }

        public void Print(string line) => output.text += line + "\n";
    }
}
