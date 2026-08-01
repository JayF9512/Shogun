using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using ShadowsOfTheShogun.Core;

namespace ShadowsOfTheShogun.Localisation
{
    /// <summary>
    /// Loads locale key/value tables from JSON and resolves strings with
    /// variable replacement and basic plural rules (spec §109). RTL-ready: each
    /// locale carries an <c>isRtl</c> flag consumers can honour for layout.
    ///
    /// Locale files live at Resources/Localisation/&lt;locale&gt;.json:
    ///   { "isRtl": false,
    ///     "entries": [ { "key": "greeting", "value": "Hello {playerName}" },
    ///                  { "key": "troops", "one": "{n} troop", "other": "{n} troops" } ] }
    /// </summary>
    public class LocalisationManager
    {
        private static LocalisationManager _instance;
        public static LocalisationManager Instance => _instance ??= new LocalisationManager();

        private readonly Dictionary<string, LocaleEntry> _entries = new();
        public string CurrentLocale { get; private set; } = "en";
        public bool IsRtl { get; private set; }

        [System.Serializable] private class LocaleFile { public bool isRtl; public LocaleEntry[] entries; }
        [System.Serializable]
        public class LocaleEntry
        {
            public string key;
            public string value;
            public string zero, one, two, few, many, other; // plural forms
        }

        private LocalisationManager()
        {
            CurrentLocale = PlayerPrefs.GetString(Constants.PrefLocale, DetectSystemLocale());
        }

        public IEnumerator LoadCurrentLocale() => LoadLocale(CurrentLocale);

        public IEnumerator LoadLocale(string locale)
        {
            var asset = Resources.Load<TextAsset>($"Localisation/{locale}");
            if (asset == null)
            {
                Debug.LogWarning($"[Localisation] Missing locale '{locale}', falling back to 'en'.");
                asset = Resources.Load<TextAsset>("Localisation/en");
                locale = "en";
            }

            _entries.Clear();
            if (asset != null)
            {
                var file = JsonUtility.FromJson<LocaleFile>(asset.text);
                IsRtl = file.isRtl;
                if (file.entries != null)
                    foreach (var e in file.entries) _entries[e.key] = e;
            }

            CurrentLocale = locale;
            PlayerPrefs.SetString(Constants.PrefLocale, locale);
            PlayerPrefs.Save();
            EventBus.Publish(new LocaleChanged(locale));
            yield break;
        }

        /// <summary>Resolve a key with optional {name} substitutions.</summary>
        public string Get(string key, Dictionary<string, string> args = null)
        {
            if (!_entries.TryGetValue(key, out var e) || string.IsNullOrEmpty(e.value))
                return key; // show the key so missing strings are obvious
            return Substitute(e.value, args);
        }

        /// <summary>Resolve a pluralised key based on <paramref name="count"/>.</summary>
        public string GetPlural(string key, int count, Dictionary<string, string> args = null)
        {
            if (!_entries.TryGetValue(key, out var e)) return key;
            var form = SelectPluralForm(e, count);
            args ??= new Dictionary<string, string>();
            args["n"] = count.ToString();
            return Substitute(form, args);
        }

        private string SelectPluralForm(LocaleEntry e, int count)
        {
            // Simplified CLDR: English-like one/other with zero support.
            if (count == 0 && !string.IsNullOrEmpty(e.zero)) return e.zero;
            if (count == 1 && !string.IsNullOrEmpty(e.one)) return e.one;
            return !string.IsNullOrEmpty(e.other) ? e.other : (e.value ?? e.key);
        }

        private static string Substitute(string template, Dictionary<string, string> args)
        {
            if (args == null) return template;
            foreach (var kv in args)
                template = template.Replace("{" + kv.Key + "}", kv.Value);
            return template;
        }

        private static string DetectSystemLocale()
        {
            return Application.systemLanguage switch
            {
                SystemLanguage.Japanese => "ja",
                SystemLanguage.Chinese or SystemLanguage.ChineseSimplified => "zh",
                SystemLanguage.Korean => "ko",
                SystemLanguage.French => "fr",
                SystemLanguage.German => "de",
                SystemLanguage.Spanish => "es",
                SystemLanguage.Arabic => "ar",
                _ => "en",
            };
        }
    }
}
