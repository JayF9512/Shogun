/* troops.js — barracks roster grouped by troop class. */
(function () {
  'use strict';

  var CLASS_ICON = { SAMURAI_GUARD: 'sword', YUMI_ARCHERS: 'banner', KOMAINU_RIDERS: 'flag' };

  Screens.troops = {
    topbar: true, navbar: true, navKey: 'settlement',

    render: function (el) {
      el.innerHTML =
        '<div class="screen-head"><button class="hud-btn" id="t-back">' + icon('back') + '</button><h2>Barracks</h2></div>' +
        '<div class="pad"><div class="tabs" id="t-tabs"></div><div id="t-body"></div></div>';

      el.querySelector('#t-back').onclick = function () { Router.back('settlement'); };

      var self = this;
      var loadThen = Game.content.troops ? Promise.resolve() : Game.ensureContent();
      UI.loading(true);
      loadThen.then(function () {
        UI.loading(false);
        var troops = Game.content.troops || [];
        var classes = [];
        troops.forEach(function (t) { if (classes.indexOf(t.troopClass) < 0) classes.push(t.troopClass); });
        var tabs = el.querySelector('#t-tabs');
        tabs.innerHTML = classes.map(function (c, i) {
          return '<div class="tab' + (i === 0 ? ' active' : '') + '" data-c="' + esc(c) + '">' + esc(TERMS.troopClass[c] || Fmt.title(c)) + '</div>';
        }).join('');
        function paint(cls) {
          var body = el.querySelector('#t-body');
          var list = troops.filter(function (t) { return t.troopClass === cls; })
            .sort(function (a, b) { return (a.tier || 0) - (b.tier || 0); });
          body.innerHTML = list.map(function (t) {
            return '<div class="card list-card" style="margin-bottom:8px" data-k="' + esc(t.key) + '">' +
              '<div class="thumb">' + icon(CLASS_ICON[cls] || 'sword') + '</div>' +
              '<div style="flex:1;min-width:0">' +
                '<div class="row between"><b>' + esc(t.name) + '</b><span class="lvl-badge">Tier ' + (t.tier || 1) + '</span></div>' +
                '<div class="muted" style="font-size:11px;margin-top:2px">ATK ' + t.attack + ' \u2022 DEF ' + t.defense + ' \u2022 HP ' + t.health + '</div>' +
                '<div class="muted" style="font-size:11px;margin-top:2px">Unlocks at Lv ' + (t.unlockLevel || 1) + '</div>' +
              '</div>' +
              '<button class="btn sm" data-train="' + esc(t.key) + '">Train</button>' +
            '</div>';
          }).join('');
          Array.prototype.forEach.call(body.querySelectorAll('[data-train]'), function (b) {
            b.onclick = function (e) { e.stopPropagation(); self._train(b.getAttribute('data-train')); };
          });
        }
        Array.prototype.forEach.call(tabs.querySelectorAll('.tab'), function (tb) {
          tb.onclick = function () {
            Array.prototype.forEach.call(tabs.querySelectorAll('.tab'), function (x) { x.classList.remove('active'); });
            tb.classList.add('active'); paint(tb.getAttribute('data-c'));
          };
        });
        if (classes.length) paint(classes[0]);
      }).catch(function (e) { UI.loading(false); UI.err(e); });
    },

    _train: function (key) {
      var t = (Game.content.troops || []).filter(function (x) { return x.key === key; })[0];
      if (!t) return;
      var count = 10;
      var cost = t.trainCost || { rice: 0, silver: 0 };
      Modal(
        '<h3 class="sec-title">Train ' + esc(t.name) + '</h3>' +
        '<div class="panel stack">' +
          '<div class="slider-row"><span class="muted" style="font-size:12px">Amount</span>' +
            '<input type="range" id="tr-range" min="1" max="100" value="10"/>' +
            '<span class="sv" id="tr-val">10</span></div>' +
          '<div class="row between"><span class="muted">Cost</span>' +
            '<span id="tr-cost" class="row" style="gap:8px"></span></div>' +
          '<div class="row between"><span class="muted">Training time</span>' +
            '<b id="tr-time">' + Fmt.time((t.trainSeconds || 30) * count) + '</b></div>' +
          '<button class="btn" id="tr-go">Begin training</button>' +
        '</div>');

      function upd() {
        var v = Number(document.getElementById('tr-range').value);
        document.getElementById('tr-val').textContent = v;
        document.getElementById('tr-cost').innerHTML =
          icon('rice', 'sm') + '<b style="color:var(--gold)">' + Fmt.num((cost.rice || 0) * v) + '</b>' +
          icon('silver', 'sm') + '<b style="color:var(--gold)">' + Fmt.num((cost.silver || 0) * v) + '</b>';
        document.getElementById('tr-time').textContent = Fmt.time((t.trainSeconds || 30) * v);
      }
      document.getElementById('tr-range').oninput = upd; upd();
      document.getElementById('tr-go').onclick = function () {
        var v = Number(document.getElementById('tr-range').value);
        closeModal();
        UI.ok('Training ' + v + ' ' + t.name + ' \u2014 they will muster shortly.');
      };
    }
  };
})();
