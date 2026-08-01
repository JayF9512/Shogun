using System.Collections.Generic;
using UnityEngine;

namespace ShadowsOfTheShogun.Audio
{
    /// <summary>
    /// Plays background music and one-shot SFX (spec §30). Clips are loaded from
    /// Resources/Audio by key. Volumes are owned by <see cref="AudioSettings"/>.
    /// </summary>
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [SerializeField] private AudioSource musicSource;
        [SerializeField] private AudioSource sfxSource;

        private readonly Dictionary<string, AudioClip> _cache = new();
        private string _currentMusicKey;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            if (musicSource != null) musicSource.loop = true;
        }

        public void PlayMusic(string key)
        {
            if (_currentMusicKey == key || musicSource == null) return;
            var clip = Load(key);
            if (clip == null) return;
            _currentMusicKey = key;
            musicSource.clip = clip;
            musicSource.Play();
        }

        public void StopMusic()
        {
            if (musicSource != null) musicSource.Stop();
            _currentMusicKey = null;
        }

        public void PlaySfx(string key)
        {
            var clip = Load(key);
            if (clip != null && sfxSource != null) sfxSource.PlayOneShot(clip);
        }

        public void SetMusicVolume(float v) { if (musicSource != null) musicSource.volume = Mathf.Clamp01(v); }
        public void SetSfxVolume(float v) { if (sfxSource != null) sfxSource.volume = Mathf.Clamp01(v); }

        private AudioClip Load(string key)
        {
            if (_cache.TryGetValue(key, out var cached)) return cached;
            var clip = Resources.Load<AudioClip>($"Audio/{key}");
            if (clip != null) _cache[key] = clip;
            else Debug.LogWarning($"[Audio] Missing clip '{key}'.");
            return clip;
        }
    }
}
