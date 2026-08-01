using System.Collections.Generic;
using UnityEngine;
using TMPro;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Economy;

namespace ShadowsOfTheShogun.Settlement
{
    /// <summary>
    /// Top resource bar showing Rice/Wood/Stone/Iron/Charcoal/Catalyst (spec §12).
    /// Reads from the ResourceManager cache and refreshes on ResourcesChanged.
    /// </summary>
    public class ResourceHUD : MonoBehaviour
    {
        [System.Serializable]
        public class ResourceSlot { public string resource; public TMP_Text label; public GameObject root; }

        [SerializeField] private List<ResourceSlot> slots = new();

        private void OnEnable()
        {
            EventBus.Subscribe<ResourcesChanged>(OnChanged);
            Refresh();
        }

        private void OnDisable() => EventBus.Unsubscribe<ResourcesChanged>(OnChanged);

        private void OnChanged(ResourcesChanged _) => Refresh();

        private void Refresh()
        {
            if (!ServiceLocator.TryGet<ResourceManager>(out var rm)) return;
            foreach (var slot in slots)
            {
                var stock = rm.GetStock(slot.resource);
                // Catalyst hidden until it exists (unlocked at Industrial 1).
                bool visible = slot.resource != "CATALYST" || (stock != null && stock.capacity > 0);
                if (slot.root != null) slot.root.SetActive(visible);
                slot.label.text = ResourceFormat.Abbreviate(rm.Get(slot.resource));
            }
        }
    }
}
