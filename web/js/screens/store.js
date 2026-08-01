/* STORE — live catalogue (GET /store) with categories, featured deals & buy flow. */
window.Screens.store = {
  hasNav: true,
  _all: null,
  CATS: [
    { key: 'featured', label: '⭐ Featured' },
    { key: 'CURRENCY', label: '💎 Jade' },
    { key: 'PROGRESSION', label: '📦 Resources' },
    { key: 'HERO', label: '🦸 Heroes' },
    { key: 'PASS', label: '🎟️ Passes' },
    { key: 'PET', label: '🐾 Companions' },
    { key: 'COSMETIC', label: '🎨 Cosmetics' }
  ],
  ICON: { CURRENCY: '💎', PROGRESSION: '📦', HERO: '🦸', PASS: '🎟️', PET: '🐾', COSMETIC: '🎨' },

  render: function (root) {
    var self = this;
    root.innerHTML =
      '<div class="screen-bg" style="background-image:url(assets/images/store-bg.webp);opacity:.5"></div>' +
      '<div class="screen-inner">' +
        '<div class="section-title">Merchant Bazaar</div>' +
        '<div class="chip-row" id="store-cats"></div>' +
        '<div id="store-body"><div class="empty"><div class="loader-ring" style="margin:0 auto"></div></div></div>' +
      '</div>';

    var chips = root.querySelector('#store-cats');
    chips.innerHTML = this.CATS.map(function (c, i) {
      return '<div class="chip' + (i === 0 ? ' active' : '') + '" data-c="' + c.key + '">' + c.label + '</div>';
    }).join('');

    function load(products) {
      self._all = products || [];
      Array.prototype.forEach.call(chips.querySelectorAll('[data-c]'), function (ch) {
        ch.onclick = function () {
          Array.prototype.forEach.call(chips.querySelectorAll('[data-c]'), function (x) { x.classList.remove('active'); });
          ch.classList.add('active');
          self._renderCat(root, ch.getAttribute('data-c'));
        };
      });
      self._renderCat(root, 'featured');
    }

    if (this._all) { load(this._all); }
    else {
      UI.loading(true);
      api.getStore().then(function (p) { UI.loading(false); load(p); })
        .catch(function (e) { UI.loading(false); UI.err(e); root.querySelector('#store-body').innerHTML = '<div class="empty">Could not load the store.</div>'; });
    }
  },

  _cat: function (p) { return p.category || p.description || 'PROGRESSION'; },
  _price: function (p) { return '$' + ((p.priceUsdCents || 0) / 100).toFixed(2); },

  _grants: function (p) {
    var parts = [];
    if (p.jadeGranted) parts.push('💎 ' + Fmt.num(p.jadeGranted));
    if (p.contents) Object.keys(p.contents).forEach(function (k) {
      var meta = RESOURCE[k] || CURRENCY[k];
      var ic = meta ? meta.ic : (k.indexOf('speedup') >= 0 ? '⏩' : '🎁');
      parts.push(ic + ' ' + Fmt.num(p.contents[k]));
    });
    return parts.join('   ');
  },

  _renderCat: function (root, cat) {
    var self = this;
    var body = root.querySelector('#store-body');
    if (cat === 'featured') { this._featured(body); return; }
    var items = this._all.filter(function (p) { return self._cat(p) === cat; });
    if (!items.length) { body.innerHTML = '<div class="empty">No items in this category yet.</div>'; return; }
    body.innerHTML = '<div class="grid-2">' + items.map(function (p) { return self._card(p); }).join('') + '</div>';
    self._bind(body);
  },

  _card: function (p) {
    return '<div class="card" data-sku="' + esc(p.sku) + '" style="cursor:pointer">' +
        '<div style="font-size:32px;text-align:center">' + (this.ICON[this._cat(p)] || '🛒') + '</div>' +
        '<div style="font-weight:800;color:var(--gold);font-size:13px;margin-top:6px">' + esc(p.name) + '</div>' +
        '<div class="muted" style="font-size:11px;min-height:28px;margin:4px 0">' + esc(this._grants(p) || 'Premium bundle') + '</div>' +
        '<button class="btn btn-primary btn-sm" style="width:100%" data-buy="' + esc(p.sku) + '">' + this._price(p) + '</button>' +
      '</div>';
  },

  _featured: function (body) {
    var self = this;
    var top = this._all.slice(0, 3);
    var end = Date.now() + 6 * 3600 * 1000;
    body.innerHTML =
      '<div class="row-list">' + top.map(function (p, i) {
        return '<div class="panel" data-sku="' + esc(p.sku) + '" style="position:relative;overflow:hidden">' +
            '<span class="badge badge-rec" style="position:absolute;top:10px;right:10px">LIMITED TIME</span>' +
            '<div style="display:flex;gap:12px;align-items:center">' +
              '<div style="font-size:44px">' + (self.ICON[self._cat(p)] || '🛒') + '</div>' +
              '<div style="flex:1"><div style="font-weight:800;color:var(--gold);font-size:16px">' + esc(p.name) + '</div>' +
                '<div class="muted" style="font-size:12px;margin:4px 0">' + esc(self._grants(p) || 'Premium bundle') + '</div>' +
                '<div class="countdown" data-end="' + end + '" style="font-size:12px">⏳ ' + Fmt.countdown(end - Date.now()) + '</div>' +
              '</div>' +
            '</div>' +
            '<button class="btn btn-primary" style="margin-top:12px" data-buy="' + esc(p.sku) + '">BUY — ' + self._price(p) + '</button>' +
          '</div>';
      }).join('') + '</div>';
    self._bind(body);
    if (this._ftimer) clearInterval(this._ftimer);
    this._ftimer = setInterval(function () {
      var els = body.querySelectorAll('.countdown');
      if (!els.length || !document.getElementById('store-body')) { clearInterval(self._ftimer); return; }
      Array.prototype.forEach.call(els, function (c) {
        var left = Number(c.getAttribute('data-end')) - Date.now();
        c.textContent = '⏳ ' + Fmt.countdown(left);
      });
    }, 1000);
  },

  _bind: function (body) {
    var self = this;
    Array.prototype.forEach.call(body.querySelectorAll('[data-buy]'), function (b) {
      b.onclick = function (e) { e.stopPropagation(); self._buy(b.getAttribute('data-buy')); };
    });
  },

  _buy: function (sku) {
    var self = this;
    var p = this._all.filter(function (x) { return x.sku === sku; })[0];
    if (!p) return;
    Modal({
      title: 'Confirm Purchase',
      html:
        '<div class="center" style="font-size:44px">' + (this.ICON[this._cat(p)] || '🛒') + '</div>' +
        '<div class="center" style="font-weight:800;color:var(--gold);font-size:18px;margin-top:6px">' + esc(p.name) + '</div>' +
        '<div class="center muted" style="margin:8px 0">You will receive:</div>' +
        '<div class="center" style="font-weight:700;color:var(--gold);margin-bottom:14px">' + esc(this._grants(p) || 'Premium bundle') + '</div>' +
        '<div class="panel center" style="margin-bottom:14px">Total: <span class="count-tag" style="font-size:18px">' + this._price(p) + '</span></div>' +
        '<button class="btn btn-primary" id="buy-yes">✅ CONFIRM PURCHASE</button>' +
        '<div style="height:10px"></div><button class="btn btn-ghost" id="buy-no">Cancel</button>',
      onMount: function (m) {
        m.querySelector('#buy-no').onclick = closeModal;
        m.querySelector('#buy-yes').onclick = function () {
          var btn = m.querySelector('#buy-yes');
          btn.disabled = true; btn.innerHTML = '<span class="inline-spin"></span> Processing…';
          // Real IAP requires a store receipt; the web slice completes the order flow locally.
          setTimeout(function () {
            closeModal();
            UI.ok('Purchase successful! ' + p.name + ' added to your account.');
          }, 700);
        };
      }
    });
  }
};
