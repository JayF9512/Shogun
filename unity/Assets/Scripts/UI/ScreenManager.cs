using System.Collections.Generic;
using UnityEngine;

namespace ShadowsOfTheShogun.UI
{
    /// <summary>All top-level screens in the interface inventory (spec §107).</summary>
    public enum ScreenId
    {
        Login,
        Loading,
        Settlement,
        WorldMap,
        Heroes,
        Troops,
        Combat,
        Clan,
        Store,
        Events,
        Mail,
        Seasons,
        Settings,
    }

    /// <summary>A screen registered with the ScreenManager.</summary>
    public interface IScreen
    {
        ScreenId Id { get; }
        void OnShow();
        void OnHide();
    }

    /// <summary>
    /// Stack-based screen navigation (push/pop) for the whole client (spec §107).
    /// Screens register themselves; the manager toggles their GameObjects and
    /// maintains a back stack for hardware-back / cancel handling.
    /// </summary>
    public class ScreenManager : MonoBehaviour
    {
        private readonly Dictionary<ScreenId, ScreenView> _screens = new();
        private readonly Stack<ScreenId> _stack = new();

        public ScreenId Current => _stack.Count > 0 ? _stack.Peek() : ScreenId.Loading;

        public void Register(ScreenView screen)
        {
            _screens[screen.Id] = screen;
            screen.gameObject.SetActive(false);
        }

        /// <summary>Replaces the top of the stack (tab-style navigation).</summary>
        public void Show(ScreenId id)
        {
            if (_stack.Count > 0) Hide(_stack.Peek());
            _stack.Clear();
            _stack.Push(id);
            ActivateTop();
        }

        /// <summary>Pushes a screen on top (modal-style navigation).</summary>
        public void Push(ScreenId id)
        {
            if (_stack.Count > 0) Hide(_stack.Peek());
            _stack.Push(id);
            ActivateTop();
        }

        /// <summary>Pops the current screen and reveals the previous one.</summary>
        public bool Pop()
        {
            if (_stack.Count <= 1) return false;
            Hide(_stack.Pop());
            ActivateTop();
            return true;
        }

        private void ActivateTop()
        {
            if (_stack.Count == 0) return;
            var id = _stack.Peek();
            if (_screens.TryGetValue(id, out var s))
            {
                s.gameObject.SetActive(true);
                s.OnShow();
            }
        }

        private void Hide(ScreenId id)
        {
            if (_screens.TryGetValue(id, out var s))
            {
                s.OnHide();
                s.gameObject.SetActive(false);
            }
        }
    }

    /// <summary>Base MonoBehaviour for a screen; override the lifecycle hooks.</summary>
    public abstract class ScreenView : MonoBehaviour, IScreen
    {
        [SerializeField] private ScreenId id;
        public ScreenId Id => id;
        public virtual void OnShow() { }
        public virtual void OnHide() { }
    }
}
