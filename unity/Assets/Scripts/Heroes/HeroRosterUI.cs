using System.Collections.Generic;
using UnityEngine;
using ShadowsOfTheShogun.Core;
using ShadowsOfTheShogun.Data;
using ShadowsOfTheShogun.Network;
using ShadowsOfTheShogun.UI;

namespace ShadowsOfTheShogun.Heroes
{
    /// <summary>
    /// Grid of owned heroes (spec §9). Loads the roster from the server and
    /// spawns cards; tapping a card opens HeroDetailUI.
    /// </summary>
    public class HeroRosterUI : ScreenView
    {
        [SerializeField] private Transform grid;
        [SerializeField] private HeroCard cardPrefab;
        [SerializeField] private HeroDetailUI detail;

        private readonly List<HeroCard> _cards = new();

        public override void OnShow() => Load();

        private void Load()
        {
            var auth = ServiceLocator.Get<AuthService>();
            ServiceLocator.Get<HeroService>().GetRoster(auth.PlayerId, res =>
            {
                if (!res.Success || res.Data?.heroes == null) return;
                foreach (var c in _cards) Destroy(c.gameObject);
                _cards.Clear();
                foreach (var hero in res.Data.heroes)
                {
                    var card = Instantiate(cardPrefab, grid);
                    card.Bind(hero, () => detail.Show(hero));
                    _cards.Add(card);
                }
            });
        }
    }
}
