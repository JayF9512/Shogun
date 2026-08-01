using UnityEngine;
using ShadowsOfTheShogun.Core;

namespace ShadowsOfTheShogun.Audio
{
    /// <summary>
    /// Persists and applies music/SFX volume preferences to the AudioManager.
    /// </summary>
    public class AudioSettings : MonoBehaviour
    {
        [Range(0f, 1f)] [SerializeField] private float musicVolume = 0.7f;
        [Range(0f, 1f)] [SerializeField] private float sfxVolume = 1.0f;

        public float MusicVolume => musicVolume;
        public float SfxVolume => sfxVolume;

        private void Start()
        {
            musicVolume = PlayerPrefs.GetFloat(Constants.PrefMusicVolume, musicVolume);
            sfxVolume = PlayerPrefs.GetFloat(Constants.PrefSfxVolume, sfxVolume);
            Apply();
        }

        public void SetMusicVolume(float v)
        {
            musicVolume = Mathf.Clamp01(v);
            PlayerPrefs.SetFloat(Constants.PrefMusicVolume, musicVolume);
            PlayerPrefs.Save();
            Apply();
        }

        public void SetSfxVolume(float v)
        {
            sfxVolume = Mathf.Clamp01(v);
            PlayerPrefs.SetFloat(Constants.PrefSfxVolume, sfxVolume);
            PlayerPrefs.Save();
            Apply();
        }

        private void Apply()
        {
            if (AudioManager.Instance == null) return;
            AudioManager.Instance.SetMusicVolume(musicVolume);
            AudioManager.Instance.SetSfxVolume(sfxVolume);
        }
    }
}
