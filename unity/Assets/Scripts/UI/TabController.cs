using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace ShadowsOfTheShogun.UI
{
    /// <summary>
    /// Reusable tab navigation. Wire tab buttons + content panels in the
    /// Inspector; the controller toggles panels and raises OnTabChanged.
    /// </summary>
    public class TabController : MonoBehaviour
    {
        [Serializable]
        public class Tab { public Button button; public GameObject content; }

        [SerializeField] private List<Tab> tabs = new();
        [SerializeField] private int defaultIndex;

        public event Action<int> OnTabChanged;
        public int ActiveIndex { get; private set; }

        private void Start()
        {
            for (int i = 0; i < tabs.Count; i++)
            {
                int idx = i;
                tabs[i].button.onClick.AddListener(() => Select(idx));
            }
            Select(defaultIndex);
        }

        public void Select(int index)
        {
            ActiveIndex = index;
            for (int i = 0; i < tabs.Count; i++)
                tabs[i].content.SetActive(i == index);
            OnTabChanged?.Invoke(index);
        }
    }
}
