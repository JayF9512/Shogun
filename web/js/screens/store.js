/* store.js — the merchant's road. Products grouped by category. */
(function () {
  'use strict';

  var CAT_ORDER = ['CURRENCY', 'PROGRESSION', 'PASS', 'HERO', 'PET', 'COSMETIC'];
  var CAT_LABEL = { CURRENCY: 'Jade & Coin', PROGRESSION: 'Growth', PASS: 'Battle Pass', HERO: 'Heroes', PET: 'Companions', COSMETIC: 'Cosmetics' };
  var CAT_ICON = { CURRENCY: 'jade', PROGRESSION: 'scroll', PASS: 'banner', HERO: 'hero', PET: 'star', COSMETIC: 'crown' };

  Screens.store = {
    topbar: true, navbar: true, navKey: 'store',

    render: function (el) {
      el.innerHTML =
        '<div style="position:relative;height:120px;overflow:hidden">' +
          '<div class="bg-cover" style="background-image:url(assets/images/store-bg.webp)"></div>' +
          '<div class="bg-scrim"></div>' +
          '<div style="position:absolute;left:16px;bottom:12px;z-index:2"><div class="title-md">Merchant\u2019s Road</div>' +
            '<div class="subtitle">Fortune favours the bold</div></div>' +
        '</div>' +
        '<div class="pad" id="s-body"><div class="empty">' + icon('bag') + '<div>Loading wares\u2026</div></div></div>';

      var self = this;
      UI.loading(true);
      api.getStore().then(function (items) {
        UI.loading(false);
        items = items || [];
        var body = el.querySelector('#s-body');
        if (!items.length) { body.innerHTML = '<div class="empty">' + icon('bag') + '<div>The merchant is restocking.</div></div>'; return; }
        var byCat = {};
        items.forEach(function (it) { var c = (it.description || 'PROGRESSION').toUpperCase(); (byCat[c] = byCat[c] || []).push(it); });
        var cats = CAT_ORDER.filter(function (c) { return byCat[c]; });
        Object.keys(byCat).forEach(function (c) { if (cats.indexOf(c) < 0) cats.push(c); });

        body.innerHTML = cats.map(function (c) {
          return '<h4 class="sec-title">' + esc(CAT_LABEL[c] || Fmt.title(c)) + '</h4>' +
            byCat[c].map(function (it) {
              var price = it.priceUsdCents != null ? '$' + (it.priceUsdCents / 100).toFixed(2) : '';
              return '<div class="card list-card" style="margin-bottom:8px" data-sku="' + esc(it.sku) + '">' +
                '<div class="thumb">' + icon(CAT_ICON[c] || 'bag') + '</div>' +
                '<div style="flex:1;min-width:0"><b>' + esc(it.name) + '</b>' +
                  (it.jadeGranted ? '<div class="muted" style="font-size:11px;margin-top:2px">' + icon('jade', 'sm') + ' ' + Fmt.int(it.jadeGranted) + ' Jade</div>' : '') +
                '</div>' +
                '<button class="btn sm" data-buy="' + esc(it.sku) + '">' + esc(price || 'Get') + '</button>' +
              '</div>';
            }).join('');
        }).join('');

        Array.prototype.forEach.call(body.querySelectorAll('[data-buy]'), function (b) {
          b.onclick = function () { self._buy(items.filter(function (x) { return x.sku === b.getAttribute('data-buy'); })[0]); };
        });
      }).catch(function (e) {
        UI.loading(false);
        el.querySelector('#s-body').innerHTML = '<div class="empty">' + icon('bag') + '<div>' + esc(api.friendly(e)) + '</div></div>';
      });
    },

    _buy: function (it) {
      if (!it) return;
      var price = it.priceUsdCents != null ? '$' + (it.priceUsdCents / 100).toFixed(2) : '';
      Modal(
        '<div class="panel gold stack">' +
          '<h3 class="title-md" style="font-size:18px">' + esc(it.name) + '</h3>' +
          '<p class="muted" style="font-size:13px">' + esc(Fmt.title(it.description || '')) + (it.jadeGranted ? ' \u2022 grants ' + Fmt.int(it.jadeGranted) + ' Jade' : '') + '</p>' +
          '<div class="row between"><span class="muted">Price</span><b style="color:var(--gold);font-size:18px">' + esc(price || 'Free') + '</b></div>' +
          '<div class="grid-2"><button class="btn secondary" id="buy-cancel">Cancel</button>' +
            '<button class="btn" id="buy-ok">Confirm</button></div>' +
        '</div>', { center: true });
      document.getElementById('buy-cancel').onclick = closeModal;
      document.getElementById('buy-ok').onclick = function () {
        closeModal();
        // The purchase endpoint is not wired in this build; confirm client-side.
        if (it.jadeGranted && Game.profile) {
          Game.profile.currencies = Game.profile.currencies || {};
          Game.profile.currencies.JADE = (Number(Game.profile.currencies.JADE) || 0) + it.jadeGranted;
          TopBar.render();
        }
        UI.ok('Purchase confirmed \u2014 ' + it.name);
      };
    }
  };
})();
